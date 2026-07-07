'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MarketplaceCategory } from '@/constants/dashboard-integrations';

export type DashboardView = 'home' | 'integrations';
export type IntegrationsTab = 'browse' | 'connected';

interface DashboardUiContextValue {
  category: MarketplaceCategory;
  searchQuery: string;
  integrationsTab: IntegrationsTab;
  setCategory: (category: MarketplaceCategory) => void;
  setSearchQuery: (query: string) => void;
  setIntegrationsTab: (tab: IntegrationsTab) => void;
}

const DashboardUiContext = createContext<DashboardUiContextValue | null>(null);

export function DashboardUiProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<MarketplaceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [integrationsTab, setIntegrationsTab] = useState<IntegrationsTab>('browse');

  const value = useMemo<DashboardUiContextValue>(
    () => ({
      category,
      searchQuery,
      integrationsTab,
      setCategory,
      setSearchQuery,
      setIntegrationsTab,
    }),
    [category, searchQuery, integrationsTab],
  );

  return (
    <DashboardUiContext.Provider value={value}>{children}</DashboardUiContext.Provider>
  );
}

export function useDashboardUi() {
  const context = useContext(DashboardUiContext);
  if (!context) {
    throw new Error('useDashboardUi must be used within DashboardUiProvider');
  }
  return context;
}
