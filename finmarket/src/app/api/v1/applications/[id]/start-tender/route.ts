import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApplicationStatus } from '@prisma/client';
import { z } from 'zod';
import { getAblyClient } from '@/lib/ably';

const startTenderSchema = z.object({
  durationHours: z.number().min(1).max(72).default(24)
});

// For Next.js App Router dynamic routes with params
export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const applicationId = params.id;

    // Allow empty body to use default 24 hours
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Ignore JSON parse errors for empty bodies
    }

    const result = startTenderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const { durationHours } = result.data;

    // Получаем заявку
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== ApplicationStatus.DRAFT && application.status !== ApplicationStatus.TENDER_NO_OFFERS) {
      return NextResponse.json({ error: 'Can only start tender from DRAFT or TENDER_NO_OFFERS status' }, { status: 400 });
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.TENDER_ACTIVE,
        tenderStartedAt: now,
        tenderEndsAt: endsAt,
        antiSnipingCount: 0
      }
    });

    // Отправляем Realtime уведомление через Ably
    try {
       const ably = getAblyClient();
       const channel = ably.channels.get('tenders');
       await channel.publish('tender-started', {
         applicationId: updatedApp.id,
         smartId: updatedApp.smartId,
         endsAt: updatedApp.tenderEndsAt
       });
    } catch (err) {
       console.error("Ably publish error:", err);
    }

    return NextResponse.json({
      success: true,
      tenderEndsAt: endsAt
    });

  } catch (error) {
    console.error('Error starting tender:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
