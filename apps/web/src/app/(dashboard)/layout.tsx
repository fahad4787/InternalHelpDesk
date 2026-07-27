'use client';

import { AuthGuard } from '@/components/layout/auth-guard';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardShell>
    </AuthGuard>
  );
}
