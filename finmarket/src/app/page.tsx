import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="flex items-center justify-between p-6 glassmorphism sticky top-0 z-50">
        <div className="text-2xl font-bold tracking-tight text-text-fg">
          Fin<span className="text-accent-gold">Market</span>
        </div>
        <nav className="hidden md:flex gap-6">
          <Link href="/catalog" className="font-medium text-slate-300 hover:text-accent-gold transition">Каталог</Link>
          <Link href="/about" className="font-medium text-slate-300 hover:text-accent-gold transition">О нас</Link>
          <Link href="/contact" className="font-medium text-slate-300 hover:text-accent-gold transition">Контакты</Link>
        </nav>
        <div className="flex gap-4">
          <Link href="/sign-in" className="font-medium text-slate-300 hover:text-accent-gold py-2">Войти</Link>
          <Link href="/catalog" className="btn-primary py-2 px-4">В каталог</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-32 overflow-hidden bg-bg-primary">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-bg-surface via-bg-primary to-bg-primary"></div>
        <div className="z-10 max-w-4xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold text-text-fg tracking-tight leading-tight">
            Лизинг спецтехники <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-[#F3E5AB]">нового поколения</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto">
            От заявки до отгрузки — в одном окне. Интеллектуальный подбор лизинговых компаний и прозрачные тендеры.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/catalog" className="btn-gold flex items-center justify-center gap-2 text-lg">
              Подобрать технику <ArrowRight className="w-5 h-5 text-slate-900" />
            </Link>
            <Link href="/contact" className="btn-primary bg-bg-surface border border-border text-text-fg hover:bg-border flex items-center justify-center gap-2 text-lg">
              Стать дилером
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-text-fg">Как это работает</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glassmorphism p-8 rounded-2xl text-center space-y-4 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#001f3f] rounded-full flex items-center justify-center mx-auto text-accent-gold mb-6 border border-border">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-text-fg">Smart Matching</h3>
              <p className="text-slate-400">ИИ автоматически подбирает лизинговые компании под ваш профиль и запрашиваемую технику.</p>
            </div>

            <div className="glassmorphism p-8 rounded-2xl text-center space-y-4 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#332A00] rounded-full flex items-center justify-center mx-auto text-accent-gold mb-6 border border-border">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-text-fg">Reverse Tender</h3>
              <p className="text-slate-400">Лизинговые компании конкурируют за вашу заявку, предлагая лучшие условия в режиме реального времени.</p>
            </div>

            <div className="glassmorphism p-8 rounded-2xl text-center space-y-4 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#00331A] rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-6 border border-border">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-text-fg">Digital Workflow</h3>
              <p className="text-slate-400">От подачи заявки до подписания документов и контроля отгрузки — всё онлайн.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
