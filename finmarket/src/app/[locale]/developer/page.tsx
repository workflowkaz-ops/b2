'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function DeveloperDashboard() {
  const t = useTranslations('Developer');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runSeed = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/dev/seed', { method: 'POST' });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e: unknown) {
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearDb = async () => {
    if (!confirm('Вы уверены? Это удалит ВСЕ данные из локальной БД!')) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/dev/clear', { method: 'POST' });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e: unknown) {
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const impersonate = async (role: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/dev/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        window.location.href = `/dashboard/${role.replace('_', '-').toLowerCase()}`;
      } else {
        setResult(await res.text());
      }
    } catch (e: unknown) {
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Генерация */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{t('seed')}</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Генерирует тестовых пользователей: Клиента, Дилера (Босс + Менеджер), Лизинговую компанию (Босс + Агент) и фейковую технику.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={runSeed}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : t('generate_full_cycle')}
            </button>
            <button
              onClick={clearDb}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {t('clear_all')}
            </button>
          </div>
        </div>

        {/* Переключение ролей */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{t('impersonation')}</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Быстрый вход под разными ролями для тестирования дашбордов (в обход Clerk).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => impersonate('CLIENT')}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
            >
              Войти как Клиент
            </button>
            <button
              onClick={() => impersonate('DEALER_MANAGER')}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
            >
              Войти как Менеджер Дилера
            </button>
            <button
              onClick={() => impersonate('DEALER_BOSS')}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
            >
              Войти как Босс Дилера
            </button>
            <button
              onClick={() => impersonate('LC_AGENT')}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
            >
              Войти как Агент ЛК
            </button>
            <button
              onClick={() => impersonate('LC_BOSS')}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
            >
              Войти как Босс ЛК
            </button>
            <button
              onClick={() => impersonate('GLOBAL_ADMIN')}
              className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm font-medium"
            >
              Войти как Админ
            </button>
          </div>
        </div>

      </div>

      {result && (
        <div className="mt-8 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-xl overflow-auto max-h-96">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}
