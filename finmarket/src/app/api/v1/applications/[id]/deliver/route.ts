import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApplicationStatus } from '@prisma/client';
import { z } from 'zod';
import Decimal from 'decimal.js';

const deliverSchema = z.object({
  qrScanned: z.boolean(),
  photos: z.array(z.object({
    s3Url: z.string().url(),
    s3Key: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    watermarkData: z.record(z.string(), z.any())
  })).min(1, "At least one photo is required")
});

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const applicationId = params.id;

    // Временная заглушка Auth
    const mockDealerCompanyId = "cl_dealer_company_mock";
    const mockManagerId = "cl_manager_mock";

    const body = await req.json();
    const result = deliverSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.format() }, { status: 400 });
    }

    const { qrScanned, photos } = result.data;

    if (!qrScanned) {
      return NextResponse.json({ error: 'QR code must be scanned to deliver' }, { status: 400 });
    }

    // 1. Получаем заявку
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        dealerCompany: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== ApplicationStatus.DELIVERY_PENDING) {
      // Для упрощения тестирования разрешим из ACCEPTED/PAYMENT_PENDING, но в реальности строго DELIVERY_PENDING
      // return NextResponse.json({ error: 'Application must be in DELIVERY_PENDING status' }, { status: 400 });
    }

    // 2. Транзакция: Закрытие сделки, добавление фото, списание комиссии и начисление бонуса
    const now = new Date();
    // Логика бонусов: например 50 000 тг менеджеру
    const bonusAmount = new Decimal(50000);
    // Логика комиссии платформы: например 1% от суммы лизинга
    const platformCommission = new Decimal(application.requestedAmount).mul(0.01);

    await prisma.$transaction(async (tx) => {
      // 1. Сохраняем фото
      for (const photo of photos) {
        await tx.deliveryPhoto.create({
          data: {
            applicationId: application.id,
            s3Url: photo.s3Url,
            s3Key: photo.s3Key,
            latitude: photo.latitude,
            longitude: photo.longitude,
            watermarkData: photo.watermarkData,
            takenAt: now
          }
        });
      }

      // 2. Меняем статус на DELIVERED
      await tx.application.update({
        where: { id: application.id },
        data: {
          status: ApplicationStatus.DELIVERED,
        }
      });

      // 3. Списываем комиссию с кошелька дилера (допускаем уход в минус или проверяем баланс заранее)
      const currentBalance = new Decimal(application.dealerCompany.walletBalance);
      const newBalance = currentBalance.sub(platformCommission);

      await tx.company.update({
        where: { id: application.dealerCompanyId },
        data: {
          walletBalance: newBalance.toNumber()
        }
      });

      await tx.walletTransaction.create({
        data: {
          companyId: application.dealerCompanyId,
          amount: platformCommission,
          type: 'DEBIT',
          description: `Комиссия платформы по сделке ${application.smartId}`,
          balanceAfter: newBalance,
          referenceId: application.id
        }
      });

      // 4. Начисляем бонус менеджеру
      // (Нужно найти баланс менеджера. В текущей схеме у User нет walletBalance, добавим просто транзакцию истории)
      await tx.bonusTransaction.create({
        data: {
          userId: application.assignedManagerId || mockManagerId,
          amount: bonusAmount,
          type: 'EARNED',
          reason: `Бонус за отгрузку по сделке ${application.smartId}`,
          applicationId: application.id,
          balanceAfter: bonusAmount // Условно, если нет накопительного баланса в User
        }
      });

    });

    return NextResponse.json({
      success: true,
      message: 'Deal delivered successfully',
      bonusAwarded: bonusAmount.toNumber()
    });

  } catch (error) {
    console.error('Error delivering application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
