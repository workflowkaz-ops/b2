import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LcBossDashboard() {
  const user = await getCurrentUser();
  if (user?.role !== 'LC_BOSS') redirect('/developer');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Кабинет Босса ЛК</h1>
      <p className="text-gray-600">Управление агентами ЛК, автоофферы.</p>
    </div>
  );
}
