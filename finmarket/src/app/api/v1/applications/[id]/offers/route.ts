import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { calculateLease } from '@/lib/services/calculator';
import { ApplicationStatus, OfferStatus } from '@prisma/client';
import { getAblyClient } from '@/lib/ably';
import Decimal from 'decimal.js';

const submitOfferSchema = z.object({
  annualRate: z.number().min(1).max(50),
  advancePercent: z.number().min(5).max(80),
  termMonths: z.number().min(6).max(84),
  comment: z.string().max(500).optional(),

  // Для валидации расчетов с фронтендом
  expectedMonthlyPayment: z.number(),
  expectedTotalOverpayment: z.number(),
  expectedGaes: z.number()
});

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const applicationId = params.id;

    // Временная заглушка Auth
    const mockLcCompanyId = "cl_lc_company_mock";
    const mockAgentUserId = "cl_agent_mock";

    const body = await req.json();
    const result = submitOfferSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid offer data', details: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // 1. Проверяем заявку и статус тендера
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== ApplicationStatus.TENDER_ACTIVE) {
      return NextResponse.json({ error: 'Tender is not active' }, { status: 400 });
    }

    if (application.tenderEndsAt && application.tenderEndsAt < new Date()) {
      return NextResponse.json({ error: 'Tender has already ended' }, { status: 400 });
    }

    // 2. Строгая валидация математики
    // Сумма берется из заявки (requestedAmount).
    const requestedAmountNum = Number(application.requestedAmount);

    const calcResult = calculateLease(
      requestedAmountNum,
      data.advancePercent,
      data.termMonths,
      data.annualRate
    );

    // Допускаем расхождение в 1 тенге из-за округлений на разных сторонах
    const diffMonthly = Math.abs(calcResult.monthlyPayment.toNumber() - data.expectedMonthlyPayment);
    const diffOverpayment = Math.abs(calcResult.totalOverpayment.toNumber() - data.expectedTotalOverpayment);
    const diffGaes = Math.abs(calcResult.gaes.toNumber() - data.expectedGaes);

    if (diffMonthly > 1 || diffOverpayment > 1 || diffGaes > 0.1) {
       console.error("Math validation failed", { calcResult, expected: data });
       return NextResponse.json({
         error: 'Calculation mismatch. Please check your numbers.',
         expected: calcResult
       }, { status: 400 });
    }

    // 3. Создаем или обновляем оффер (один агент/компания - один оффер на заявку)
    // Используем upsert
    const offer = await prisma.offer.upsert({
      where: {
        applicationId_lcCompanyId: {
          applicationId: application.id,
          lcCompanyId: mockLcCompanyId
        }
      },
      update: {
        annualRate: data.annualRate,
        advancePercent: data.advancePercent,
        termMonths: data.termMonths,
        monthlyPayment: calcResult.monthlyPayment.toNumber(),
        totalOverpayment: calcResult.totalOverpayment.toNumber(),
        gaes: calcResult.gaes.toNumber(),
        comment: data.comment,
        status: OfferStatus.ACTIVE,
        submittedByUserId: mockAgentUserId
      },
      create: {
        applicationId: application.id,
        lcCompanyId: mockLcCompanyId,
        submittedByUserId: mockAgentUserId,
        status: OfferStatus.ACTIVE,
        annualRate: data.annualRate,
        advancePercent: data.advancePercent,
        termMonths: data.termMonths,
        monthlyPayment: calcResult.monthlyPayment.toNumber(),
        totalOverpayment: calcResult.totalOverpayment.toNumber(),
        gaes: calcResult.gaes.toNumber(),
        comment: data.comment,
        isAutomatic: false,
        currencySnapshot: { rate: 1, currency: "KZT" } // Пример снапшота
      }
    });

    // 4. Отправляем Realtime уведомление дилеру/клиенту через Ably
    try {
      const ably = getAblyClient();
      const channel = ably.channels.get(`application-${application.id}`);
      await channel.publish('new-offer', {
        offerId: offer.id,
        lcCompanyId: mockLcCompanyId,
        annualRate: data.annualRate,
        advancePercent: data.advancePercent,
        termMonths: data.termMonths,
        monthlyPayment: calcResult.monthlyPayment.toNumber()
      });
    } catch (err) {
      console.error("Ably publish error:", err);
    }

    return NextResponse.json({
      success: true,
      offer
    });

  } catch (error) {
    console.error('Error submitting offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
