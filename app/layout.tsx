import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from './components/AuthProvider';
import AuthGuard from './components/AuthGuard';
import Navigation from './components/Navigation';
import { ToastProvider } from './components/ToastProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartFinance',
  description: 'Трекер финансов со сканированием чеков',
  manifest: '/manifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} bg-[#0a0a0f] min-h-screen antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <AuthGuard>
              <div className="relative min-h-screen pb-20 flex justify-center">
                <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              </div>
              <Navigation />
            </AuthGuard>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}