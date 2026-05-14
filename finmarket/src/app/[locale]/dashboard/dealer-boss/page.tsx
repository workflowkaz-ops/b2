import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DealerBossDashboard() {
  const user = await getCurrentUser();
  if (user?.role !== 'DEALER_BOSS') redirect('/developer');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Кабинет Босса Дилера</h1>
      <p className="text-gray-600">Аналитика по всей компании, управление менеджерами.</p>
    </div>
  );
}
