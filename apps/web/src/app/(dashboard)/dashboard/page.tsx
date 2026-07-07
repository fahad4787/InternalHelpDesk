'use client';

import { DashboardTopBar } from '@/components/dashboard/dashboard-top-bar';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { DashboardHomeView } from '@/components/dashboard/dashboard-home-view';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardTopBar showAttention />
      <DashboardTabs />
      <DashboardHomeView />
    </DashboardShell>
  );
}
