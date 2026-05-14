import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Link } from '@/i18n/routing';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/developer'); // Пока редиректим в dev-панель
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-slate-800">
          FinMarket
        </div>

        <div className="p-4 flex-1">
          <div className="text-sm text-slate-400 mb-2">Авторизован как:</div>
          <div className="font-medium text-blue-400">{user.role}</div>
          <div className="text-xs text-slate-500 mt-1">{user.email}</div>
          {user.company && (
            <div className="mt-4 p-2 bg-slate-800 rounded text-xs">
              {user.company.name} <br/>
              БИН: {user.company.bin}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <Link href="/developer" className="text-sm text-slate-400 hover:text-white">
            ← В dev-панель
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b h-16 flex items-center px-8">
          <div className="ml-auto flex items-center gap-4">
             {/* Заглушка профиля */}
             <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
               {user.firstName?.[0] || 'U'}
             </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
