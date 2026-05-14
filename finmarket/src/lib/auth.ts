import { cookies } from 'next/headers';
import { prisma } from './db';

// В будущем здесь будет проверка через @clerk/nextjs
// Но пока мы используем dev_impersonate_id
export async function getCurrentUser() {
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies();
    const devUserId = cookieStore.get('dev_impersonate_id')?.value;

    if (devUserId) {
      const user = await prisma.user.findUnique({
        where: { id: devUserId },
        include: { company: true }
      });
      return user;
    }
  }

  // Здесь будет логика Clerk для продакшена:
  // const { userId } = auth();
  // if (!userId) return null;
  // return prisma.user.findUnique({ where: { clerkId: userId } });

  return null;
}
