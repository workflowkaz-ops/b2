import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

const createApplicationSchema = z.object({
  listingId: z.string(),
  requestedAmount: z.number().positive(),
  advancePercent: z.number().min(10).max(50),
  requestedTermMonths: z.number().min(6).max(84),
  clientBin: z.string().length(12).regex(/^\d+$/),
  clientName: z.string().min(2),
  clientPhone: z.string().min(10),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientRegion: z.string(),
  clientIndustry: z.string(),
});

export async function POST(req: Request) {
  try {
    // В будущем здесь будет проверка сессии Clerk:
    // const { userId } = auth();
    // И поиск пользователя/компании в БД.

    // Временная заглушка для тестирования без Auth:
    const mockDealerCompanyId = "cl_dealer_company_mock";
    const mockManagerId = "cl_manager_mock";

    const body = await req.json();
    const result = createApplicationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // Получаем листинг (снапшот)
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId }
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Проверка BIN на блокировку (если есть активный BinLock у другого дилера)
    // Эта логика будет расширена позже (работа с BinLock таблицей).

    // Для создания клиента нам нужен его CompanyId.
    // В реальном мире: ищем компанию по BIN, если нет - создаем.
    let clientCompany = await prisma.company.findFirst({
      where: { bin: data.clientBin, type: 'CLIENT' }
    });

    if (!clientCompany) {
       // Создаем компанию заглушку
       clientCompany = await prisma.company.create({
         data: {
           type: 'CLIENT',
           name: data.clientName,
           bin: data.clientBin,
           status: 'ACTIVE',
           walletBalance: 0
         }
       });
    }

    // Генерация Smart ID (например, 24-0001)
    const currentYear = new Date().getFullYear();
    const smartIdStr = currentYear.toString().slice(-2);

    const sequence = await prisma.smartIdSequence.upsert({
      where: { year: currentYear },
      update: { counter: { increment: 1 } },
      create: { year: currentYear, counter: 1 }
    });

    const newSmartId = `${smartIdStr}-${sequence.counter.toString().padStart(4, '0')}`;

    // Создаем заявку
    const application = await prisma.application.create({
      data: {
        smartId: newSmartId,
        status: ApplicationStatus.DRAFT,
        clientCompanyId: clientCompany.id,
        dealerCompanyId: mockDealerCompanyId,
        assignedManagerId: mockManagerId,
        listingId: listing.id,
        listingSnapshot: listing, // Сохраняем слепок техники
        requestedAmount: data.requestedAmount,
        advancePercent: data.advancePercent,
        requestedTermMonths: data.requestedTermMonths,
        clientBin: data.clientBin,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail || '',
        clientRegion: data.clientRegion,
        clientIndustry: data.clientIndustry,
        currency: 'KZT',
      }
    });

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        smartId: application.smartId,
        status: application.status
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
