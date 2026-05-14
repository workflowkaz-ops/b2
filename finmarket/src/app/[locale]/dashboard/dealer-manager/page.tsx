import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function DealerManagerDashboard() {
  const user = await getCurrentUser();
  if (user?.role !== 'DEALER_MANAGER') redirect('/developer');

  const t = await getTranslations('Dealer');
  const tStatus = await getTranslations('Status');

  // Fetch KPI data
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Активных заявок (TENDER_ACTIVE, DOCUMENTS_PENDING, PAYMENT_PENDING, DELIVERY_PENDING)
  const activeStatuses = ['TENDER_ACTIVE', 'DOCUMENTS_PENDING', 'PAYMENT_PENDING', 'DELIVERY_PENDING'];
  const activeCount = await prisma.application.count({
    where: {
      assignedManagerId: user.id,
      status: { in: activeStatuses as import("@prisma/client").ApplicationStatus[] }
    }
  });

  // 2. Закрыто за месяц (DELIVERED в этом месяце)
  const closedThisMonthCount = await prisma.application.count({
    where: {
      assignedManagerId: user.id,
      status: 'DELIVERED',
      updatedAt: { gte: startOfMonth } // В идеале нужно поле deliveredAt, используем updatedAt как fallback
    }
  });

  // 3. Объем за месяц (Сумма по закрытым сделкам)
  // В Prisma нет SUM по Decimal напрямую без $queryRaw в некоторых случаях,
  // сделаем простой aggregate по requestedAmount (finalTotalPayment пока нет в схеме)
  const volumeAgg = await prisma.application.aggregate({
    _sum: {
      requestedAmount: true
    },
    where: {
      assignedManagerId: user.id,
      status: 'DELIVERED',
      updatedAt: { gte: startOfMonth }
    }
  });

  const volumeKzt = volumeAgg._sum.requestedAmount ? Number(volumeAgg._sum.requestedAmount) : 0;
  const volumeFormatted = (volumeKzt / 1000000).toFixed(1) + ' млн ₸';

  // 4. Все заявки за месяц для расчета конверсии
  const totalThisMonth = await prisma.application.count({
    where: {
      assignedManagerId: user.id,
      createdAt: { gte: startOfMonth }
    }
  });

  const conversion = totalThisMonth > 0 ? Math.round((closedThisMonthCount / totalThisMonth) * 100) : 0;

  // Последние 10 заявок
  const recentApps = await prisma.application.findMany({
    where: { assignedManagerId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { clientCompany: true }
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('dashboard_title')}</h1>
        <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium shadow transition-colors">
          Создать заявку
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-amber-200 transition-colors cursor-pointer">
          <div className="text-sm text-gray-500 mb-1">{t('active_applications')}</div>
          <div className="text-3xl font-bold text-blue-600">{activeCount}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-amber-200 transition-colors cursor-pointer">
          <div className="text-sm text-gray-500 mb-1">{t('closed_this_month')}</div>
          <div className="text-3xl font-bold text-emerald-600">{closedThisMonthCount}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-500 mb-1">{t('volume_kzt')}</div>
          <div className="text-3xl font-bold text-gray-900">{volumeFormatted}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-500 mb-1">{t('conversion')}</div>
          <div className="text-3xl font-bold text-gray-900">{conversion}%</div>
        </div>
      </div>

      {/* Grade Progress Bar (Mock for now based on TZ) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-1">Грейд: Bronze</div>
            <div className="text-sm text-gray-500">До Серебра ещё {Math.max(0, 10 - closedThisMonthCount)} сделок</div>
          </div>
          <div className="text-sm text-gray-500">{closedThisMonthCount} / 10</div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (closedThisMonthCount / 10) * 100)}%` }}></div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{t('recent_applications')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Smart ID</th>
                <th className="px-6 py-3 font-medium">Техника</th>
                <th className="px-6 py-3 font-medium">Клиент</th>
                <th className="px-6 py-3 font-medium">Сумма</th>
                <th className="px-6 py-3 font-medium">Статус</th>
                <th className="px-6 py-3 font-medium text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Нет заявок. Нажмите &quot;Создать заявку&quot; или запустите Seed в кабинете разработчика.
                  </td>
                </tr>
              ) : (
                recentApps.map((app) => {
                  const snap = app.listingSnapshot as { brand?: string; model?: string };
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-blue-600">
                        <Link href={`/dashboard/dealer-manager/applications/${app.id}`}>{app.smartId}</Link>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {snap?.brand} {snap?.model}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {app.clientCompany.name || app.clientName}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {Number(app.requestedAmount).toLocaleString('ru-RU')} ₸
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${app.status === 'TENDER_ACTIVE' ? 'bg-blue-100 text-blue-800' : ''}
                          ${app.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : ''}
                          ${app.status === 'CLIENT_ACCEPTED' ? 'bg-green-100 text-green-800' : ''}
                        `}>
                          {tStatus(app.status as never) || app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/dealer-manager/applications/${app.id}`}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                        >
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
