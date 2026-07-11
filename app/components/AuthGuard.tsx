'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = ['/auth/login', '/auth/register'];
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

  useEffect(() => {
    if (status === 'loading') return;

    if (!session && !isPublicRoute) {
      router.push('/auth/login');
    }

    if (session && isPublicRoute) {
      router.push('/');
    }
  }, [session, status, isPublicRoute, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}