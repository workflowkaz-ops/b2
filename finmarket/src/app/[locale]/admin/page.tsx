import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (user?.role !== 'GLOBAL_ADMIN') redirect('/developer');

  return (
    <div className="p-8">
      <div className="mb-4">
        <Link href="/developer" className="text-blue-500 hover:underline">← Назад в Dev панель</Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Панель Администратора</h1>
      <p className="text-gray-600">Верификация компаний, разрешение споров, мониторинг платформы.</p>
    </div>
  );
}
