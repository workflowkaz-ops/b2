import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function HomePage() {
  const t = useTranslations('Common');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">{t('welcome')}</h1>

      <div className="flex gap-4">
        <Link
          href="/developer"
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Кабинет разработчика
        </Link>
      </div>
    </main>
  );
}
