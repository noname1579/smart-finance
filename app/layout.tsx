import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';

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
        <div className="relative min-h-screen pb-20 flex justify-center">
          <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>

        {/* Навигация - клиентский компонент */}
        <Navigation />
      </body>
    </html>
  );
}