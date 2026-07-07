'use client';

import { createContext, useContext, type DragEvent, type ReactNode } from 'react';
import type { DashboardWidgetId } from '@/constants/dashboard-widget-registry';

export interface DashboardWidgetShellContextValue {
  widgetId: DashboardWidgetId;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}

const DashboardWidgetShellContext =
  createContext<DashboardWidgetShellContextValue | null>(null);

export function useDashboardWidgetShell() {
  return useContext(DashboardWidgetShellContext);
}

export function DashboardWidgetShellProvider({
  value,
  children,
}: {
  value: DashboardWidgetShellContextValue;
  children: ReactNode;
}) {
  return (
    <DashboardWidgetShellContext.Provider value={value}>
      {children}
    </DashboardWidgetShellContext.Provider>
  );
}
