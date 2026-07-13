'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

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
    return <LoadingScreen />;
  }

  return <>{children}</>;
}