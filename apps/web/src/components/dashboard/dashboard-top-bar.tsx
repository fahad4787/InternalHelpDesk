'use client';

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
  const query = searchQuery.trim();

  const subtitle = query
    ? `${formatDashboardDate()} · Filtering widgets for “${query}”`
    : showAttention && attentionCount > 0
      ? `${formatDashboardDate()} · ${attentionCount} live ${attentionCount === 1 ? 'widget' : 'widgets'} on your board`
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
          <div className="min-w-0 flex-1 sm:w-72 sm:flex-none">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search widgets & apps…"
            />
          </div>
        )}
      </div>
    </header>
  );
}
