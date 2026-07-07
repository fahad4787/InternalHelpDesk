'use client';

import { type ReactNode } from 'react';
import { ToastContainer } from '@/components/shared/toast';
import { DashboardUiProvider } from './dashboard-ui-context';

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardUiProvider>
      {children}
      <ToastContainer />
    </DashboardUiProvider>
  );
}
