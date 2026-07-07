'use client';

import { Bell } from 'lucide-react';
import { SearchInput } from '@/components/shared/search-input';
import { useAuth } from '@/hooks/use-auth';
import { formatDashboardDate, getGreeting } from '@/constants/dashboard-seed';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import { useDashboardUi } from './dashboard-ui-context';

interface DashboardTopBarProps {
  showSearch?: boolean;
  showAttention?: boolean;
}

export function DashboardTopBar({ showSearch = true, showAttention = false }: DashboardTopBarProps) {
  const { user } = useAuth();
  const { searchQuery, setSearchQuery } = useDashboardUi();
  const { visibleWidgetIds } = useDashboardVisibleWidgets();
  const firstName = user?.firstName ?? 'there';
  const attentionCount = visibleWidgetIds.length;

  const subtitle =
    showAttention && attentionCount > 0
      ? `${formatDashboardDate()} · ${attentionCount} ${attentionCount === 1 ? 'widget needs' : 'widgets need'} your attention today`
      : formatDashboardDate();

  return (
    <header className="mb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {showSearch && (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 sm:w-72">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search work, people, apps…"
              />
            </div>
            <button
              type="button"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-warm bg-white text-muted transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              aria-label={
                attentionCount > 0
                  ? `Notifications — ${attentionCount} widgets active`
                  : 'Notifications'
              }
            >
              <Bell className="h-5 w-5" aria-hidden />
              {attentionCount > 0 && (
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white"
                  aria-hidden
                />
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
