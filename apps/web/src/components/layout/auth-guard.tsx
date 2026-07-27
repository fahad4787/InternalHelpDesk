'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { FullPageLoader } from '@/components/shared/loading-state';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Only block the shell on cold start with no known session.
  // Soft nav / returning users keep the sidebar while profile refreshes.
  if (isLoading && !user) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
