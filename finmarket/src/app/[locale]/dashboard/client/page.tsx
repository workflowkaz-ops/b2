import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ClientDashboard() {
  const user = await getCurrentUser();
  if (user?.role !== 'CLIENT') redirect('/developer');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Кабинет Корпоративного Клиента</h1>
      <p className="text-gray-600">Здесь будет дашборд клиента со сводкой по заявкам.</p>
    </div>
  );
}
