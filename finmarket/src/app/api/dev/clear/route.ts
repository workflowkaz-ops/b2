import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    // Delete in reverse order of dependencies
    await prisma.chatMessage.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.dispute.deleteMany();
    await prisma.deliveryPhoto.deleteMany();
    await prisma.document.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.application.deleteMany();
    await prisma.listing.deleteMany();

    // Auth & Users
    await prisma.walletTransaction.deleteMany();
    await prisma.bonusTransaction.deleteMany();
    await prisma.auditLog.deleteMany();

    // Departments
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    return NextResponse.json({ success: true, message: 'Database cleared' });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
