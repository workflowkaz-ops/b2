import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const { role } = await req.json();

  // Find a user with this role
  const user = await prisma.user.findFirst({
    where: { role }
  });

  if (!user) {
    return NextResponse.json(
      { error: `Пользователь с ролью ${role} не найден. Сначала запустите Seed (генерацию).` },
      { status: 404 }
    );
  }

  // Set impersonation cookie
  const cookieStore = await cookies();
  cookieStore.set('dev_impersonate_id', user.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 1 day
  });

  return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
}
