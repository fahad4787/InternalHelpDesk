'use client';

import { DashboardTopBar } from '@/components/dashboard/dashboard-top-bar';
import { DashboardHomeView } from '@/components/dashboard/dashboard-home-view';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardTopBar showAttention />
      <DashboardHomeView />
    </DashboardShell>
  );
}
