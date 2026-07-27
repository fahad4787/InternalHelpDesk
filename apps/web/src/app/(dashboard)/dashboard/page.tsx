'use client';

import { DashboardTopBar } from '@/components/dashboard/dashboard-top-bar';
import { DashboardHomeView } from '@/components/dashboard/dashboard-home-view';

export default function DashboardPage() {
  return (
    <>
      <DashboardTopBar showAttention />
      <DashboardHomeView />
    </>
  );
}
