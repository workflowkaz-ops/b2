import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LcAgentDashboard() {
  const user = await getCurrentUser();
  if (user?.role !== 'LC_AGENT') redirect('/developer');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Кабинет Агента ЛК</h1>
      <p className="text-gray-600">Работа с тендерами, подача офферов.</p>
    </div>
  );
}
