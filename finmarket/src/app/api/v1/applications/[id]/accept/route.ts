import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApplicationStatus, OfferStatus } from '@prisma/client';
import { z } from 'zod';

const acceptOfferSchema = z.object({
  offerId: z.string(),
});

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const applicationId = params.id;

    // Временная заглушка Auth
    const mockClientCompanyId = "cl_client_company_mock";

    const body = await req.json();
    const result = acceptOfferSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { offerId } = result.data;

    // 1. Получаем заявку и проверяем права
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        offers: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // В реальном приложении здесь проверяем, что application.clientCompanyId === auth().companyId

    if (application.status !== ApplicationStatus.TENDER_ACTIVE && application.status !== ApplicationStatus.TENDER_CLOSED) {
      return NextResponse.json({ error: 'Cannot accept offer in current status' }, { status: 400 });
    }

    // 2. Ищем выбранный оффер
    const selectedOffer = application.offers.find(o => o.id === offerId);

    if (!selectedOffer) {
      return NextResponse.json({ error: 'Offer not found for this application' }, { status: 404 });
    }

    // 3. Выполняем транзакцию
    const now = new Date();
    // Даем 72 часа на резервацию
    const reservationDeadline = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // Обновляем заявку
      await tx.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.CLIENT_ACCEPTED,
          selectedOfferId: selectedOffer.id,
          reservationDeadline: reservationDeadline,
          lockedPrice: application.requestedAmount, // Фиксируем цену
          lockedAt: now,
          tenderEndsAt: now // Если тендер еще шел, досрочно закрываем
        }
      });

      // Делаем выбранный оффер победителем
      await tx.offer.update({
        where: { id: selectedOffer.id },
        data: { status: OfferStatus.WINNER }
      });

      // Остальные офферы отклоняем
      await tx.offer.updateMany({
        where: {
          applicationId: applicationId,
          id: { not: selectedOffer.id }
        },
        data: { status: OfferStatus.REJECTED }
      });

      // В будущем: создание Notification для дилера и ЛК
    });

    return NextResponse.json({
      success: true,
      reservationDeadline
    });

  } catch (error) {
    console.error('Error accepting offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
