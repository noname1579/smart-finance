import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartFinance',
  description: 'Трекер финансов со сканированием чеков',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} bg-[#0a0a0f] min-h-screen antialiased`}>
        <div className="relative min-h-screen pb-20">
          {children}
        </div>

        {/* Bottom Navigation - Адаптивная */}
        <nav className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 glass rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl sm:w-auto sm:min-w-[320px] sm:max-w-[400px]">
          <div className="flex justify-around items-center py-2 px-4">
            <Link 
              href="/" 
              className="flex flex-col items-center gap-0.5 px-3 sm:px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-all hover:bg-white/5"
            >
              <span className="text-lg sm:text-xl">🏠</span>
              <span className="font-medium text-[9px] sm:text-[10px]">Главная</span>
            </Link>
            <Link 
              href="/add" 
              className="flex flex-col items-center gap-0.5 px-3 sm:px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-all hover:bg-white/5"
            >
              <span className="text-lg sm:text-xl">➕</span>
              <span className="font-medium text-[9px] sm:text-[10px]">Добавить</span>
            </Link>
            <Link 
              href="/categories" 
              className="flex flex-col items-center gap-0.5 px-3 sm:px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-all hover:bg-white/5"
            >
              <span className="text-lg sm:text-xl">📂</span>
              <span className="font-medium text-[9px] sm:text-[10px]">Категории</span>
            </Link>
            <Link 
              href="/stats" 
              className="flex flex-col items-center gap-0.5 px-3 sm:px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-all hover:bg-white/5"
            >
              <span className="text-lg sm:text-xl">📊</span>
              <span className="font-medium text-[9px] sm:text-[10px]">Статистика</span>
            </Link>
          </div>
        </nav>
      </body>
    </html>
  );
}