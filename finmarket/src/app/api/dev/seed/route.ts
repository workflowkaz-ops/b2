import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    // 0. Create system admin company
    const adminCompany = await prisma.company.create({
      data: {
        bin: '000000000000',
        name: 'FinMarket Platform',
        type: 'DEALER', // Just a placeholder so user can be attached
        status: "ACTIVE",
      }
    });

    // 1. Create Admin
    await prisma.user.create({
      data: {
        clerkId: 'admin_123',
        email: 'admin@finmarket.kz',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'GLOBAL_ADMIN',
        companyId: adminCompany.id
      }
    });

    // 2. Create Dealer Company & Users
    const dealerCompany = await prisma.company.create({
      data: {
        bin: '123456789012',
        name: 'ОсОО "КазТехника"',
        type: 'DEALER',
        status: "ACTIVE",
      }
    });

    await prisma.user.create({
      data: {
        clerkId: 'dealer_boss_123',
        email: 'boss@kazteh.kz',
        firstName: 'Иван',
        lastName: 'Дилеров',
        role: 'DEALER_BOSS',
        companyId: dealerCompany.id
      }
    });

    const dealerManager = await prisma.user.create({
      data: {
        clerkId: 'dealer_manager_123',
        email: 'manager@kazteh.kz',
        firstName: 'Петр',
        lastName: 'Продавцов',
        role: 'DEALER_MANAGER',
        companyId: dealerCompany.id
      }
    });

    // 3. Create LC Company & Users
    const lcCompany = await prisma.company.create({
      data: {
        bin: '987654321098',
        name: 'АО "Евразия Лизинг"',
        type: 'LEASING_COMPANY',
        status: "ACTIVE",
      }
    });

    await prisma.user.create({
      data: {
        clerkId: 'lc_boss_123',
        email: 'boss@eurasialeasing.kz',
        firstName: 'Айдос',
        lastName: 'Босов',
        role: 'LC_BOSS',
        companyId: lcCompany.id
      }
    });

    await prisma.user.create({
      data: {
        clerkId: 'lc_agent_123',
        email: 'agent@eurasialeasing.kz',
        firstName: 'Серик',
        lastName: 'Агентов',
        role: 'LC_AGENT',
        companyId: lcCompany.id
      }
    });

    // 4. Create Client Company & User
    const clientCompany = await prisma.company.create({
      data: {
        bin: '112233445566',
        name: 'ТОО "АгроСервис Строй"',
        type: 'CLIENT',
        status: "ACTIVE",
      }
    });

    const clientUser = await prisma.user.create({
      data: {
        clerkId: 'client_123',
        email: 'director@agro.kz',
        firstName: 'Марат',
        lastName: 'Клиентов',
        role: 'CLIENT',
        companyId: clientCompany.id
      }
    });

    // 5. Create Listings (Technique)
    const listing = await prisma.listing.create({
      data: {
        dealerCompanyId: dealerCompany.id,
        slug: 'cat-320-excavator-2023',
        smartId: 'L-CAT-001',
        name: 'Экскаватор Caterpillar 320',
        category: 'Строительная техника',
        brand: 'Caterpillar',
        model: '320',
        year: 2023,
        condition: 'NEW',
        price: 45000000,
        region: "Алматы",
        currency: 'KZT',
        isActive: true,
        specs: { weight: '20t', engine: 'CAT C7.1' }
      }
    });

    // 6. Create an Application (TENDER_ACTIVE)
    await prisma.application.create({
      data: {
        smartId: '24-0001',
        status: 'TENDER_ACTIVE',
        clientCompanyId: clientCompany.id,
        dealerCompanyId: dealerCompany.id,
        assignedManagerId: dealerManager.id,
        listingId: listing.id,
        listingSnapshot: {
          name: listing.name,
          brand: listing.brand,
          model: listing.model,
          price: 45000000
        },
        requestedAmount: 45000000,
        advancePercent: 20,
        requestedTermMonths: 36,
        currency: 'KZT',
        clientBin: clientCompany.bin,
        clientName: clientCompany.name,
        clientPhone: '+77010000000',
        clientEmail: clientUser.email,
        clientRegion: 'Шымкент',
        clientIndustry: 'Строительство',
        tenderEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // +24 hours
      }
    });

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
