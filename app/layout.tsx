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
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
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
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
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