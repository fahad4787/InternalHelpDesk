'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api-client';
import { disconnectIntegrationProvider } from '@/lib/disconnect-integration';
import { invalidateIntegrationQueries } from '@/lib/integration-query-keys';
import { IntegrationMarketplaceSkeleton } from '@/components/shared/loading-state';
import {
  IntegrationIcon,
  isIntegrationIconProvider,
} from '@/components/shared/integration-icon';
import { SearchInput } from '@/components/shared/search-input';
import { integrationsService } from '@/services/integrations.service';
import { Integration } from '@/types/api.types';
import {
  MARKETPLACE_APPS,
  MARKETPLACE_CATEGORY_FILTERS,
  PRIMARY_MARKETPLACE_BY_PROVIDER,
  type MarketplaceAppMeta,
  type MarketplaceCategory,
} from '@/constants/dashboard-integrations';
import {
  countDashboardWidgetsForProvider,
  getWidgetLabelsForProvider,
  type DashboardWidgetId,
} from '@/constants/dashboard-widget-registry';
import { MARKETPLACE_APP_COUNT } from '@/constants/navigation';
import {
  type DashboardIntegrationStatuses,
} from '@/lib/dashboard-widget-utils';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import { useDashboardUi, type IntegrationsTab } from './dashboard-ui-context';

const TAB_OPTIONS: { id: IntegrationsTab; label: string }[] = [
  { id: 'browse', label: 'Browse' },
  { id: 'connected', label: 'My connected apps' },
];

interface MarketplaceEntry {
  id: string;
  name: string;
  description: string;
  category: Exclude<MarketplaceCategory, 'all'>;
  categoryLabel: string;
  meta: MarketplaceAppMeta;
  status: string;
  connectedAt?: string | null;
  isConnected: boolean;
  dashboardWidgetCount: number;
  widgetLabels: string[];
}

function isProviderConnected(
  provider: string,
  item: Integration | undefined,
  statuses: DashboardIntegrationStatuses,
): boolean {
  if (item?.status === 'CONNECTED') return true;

  switch (provider) {
    case 'GOOGLE_CALENDAR':
      return statuses.google?.connected === true;
    case 'JIRA':
      return statuses.jira?.connected === true;
    case 'TRELLO':
      return statuses.trello?.connected === true;
    case 'ASANA':
      return statuses.asana?.connected === true;
    case 'MONDAY':
      return statuses.monday?.connected === true;
    case 'CLICKUP':
      return statuses.clickup?.connected === true;
    case 'CALENDLY':
      return statuses.calendly?.connected === true;
    case 'SLACK':
      return statuses.slack?.connected === true;
    case 'ZOOM':
      return statuses.zoom?.connected === true;
    case 'OUTLOOK':
      return statuses.outlook?.connected === true;
    case 'MICROSOFT_TEAMS':
      return statuses.teams?.connected === true;
    case 'DROPBOX':
      return statuses.dropbox?.connected === true;
    case 'BOX':
      return statuses.box?.connected === true;
    case 'ONEDRIVE':
      return statuses.onedrive?.connected === true;
    case 'SHAREPOINT':
      return statuses.sharepoint?.connected === true;
    case 'HUBSPOT':
      return statuses.hubspot?.connected === true;
    case 'WORKDAY':
      return statuses.workday?.connected === true;
    default:
      return false;
  }
}

function connectedAtForProvider(
  provider: string,
  item: Integration | undefined,
  statuses: DashboardIntegrationStatuses,
): string | null {
  if (item?.connectedAt) return item.connectedAt;

  switch (provider) {
    case 'GOOGLE_CALENDAR':
      return statuses.google?.lastSyncedAt ?? null;
    case 'JIRA':
      return statuses.jira?.lastSyncedAt ?? null;
    case 'TRELLO':
      return statuses.trello?.lastSyncedAt ?? null;
    case 'ASANA':
      return statuses.asana?.lastSyncedAt ?? null;
    case 'MONDAY':
      return statuses.monday?.lastSyncedAt ?? null;
    case 'CLICKUP':
      return statuses.clickup?.lastSyncedAt ?? null;
    case 'CALENDLY':
      return statuses.calendly?.lastSyncedAt ?? null;
    case 'SLACK':
      return statuses.slack?.lastSyncedAt ?? null;
    case 'ZOOM':
      return statuses.zoom?.lastSyncedAt ?? null;
    case 'OUTLOOK':
      return statuses.outlook?.lastSyncedAt ?? null;
    case 'MICROSOFT_TEAMS':
      return statuses.teams?.lastSyncedAt ?? null;
    case 'DROPBOX':
      return statuses.dropbox?.lastSyncedAt ?? null;
    case 'BOX':
      return statuses.box?.lastSyncedAt ?? null;
    case 'ONEDRIVE':
      return statuses.onedrive?.lastSyncedAt ?? null;
    case 'SHAREPOINT':
      return statuses.sharepoint?.lastSyncedAt ?? null;
    case 'HUBSPOT':
      return statuses.hubspot?.lastSyncedAt ?? null;
    case 'WORKDAY':
      return statuses.workday?.lastSyncedAt ?? null;
    default:
      return null;
  }
}

function buildEntries(
  integrations: Integration[],
  visibleWidgetIds: DashboardWidgetId[],
  statuses: DashboardIntegrationStatuses,
): MarketplaceEntry[] {
  const byProvider = new Map(
    integrations.map((item) => [item.provider, item] as const),
  );

  return MARKETPLACE_APPS.map((meta) => {
    const item = byProvider.get(meta.provider);
    const isConnected = isProviderConnected(meta.provider, item, statuses);
    const showWidgets = Boolean(meta.showWidgets);
    const widgetLabels = showWidgets ? getWidgetLabelsForProvider(meta.provider) : [];
    const dashboardWidgetCount = showWidgets
      ? countDashboardWidgetsForProvider(meta.provider, visibleWidgetIds)
      : 0;

    return {
      id: meta.id,
      name: meta.name,
      description: meta.description,
      category: meta.category,
      categoryLabel: meta.categoryLabel,
      meta,
      status: isConnected ? 'CONNECTED' : (item?.status ?? 'NOT_CONNECTED'),
      connectedAt: connectedAtForProvider(meta.provider, item, statuses),
      isConnected,
      dashboardWidgetCount,
      widgetLabels,
    };
  });
}

function buildConnectedEntries(
  integrations: Integration[],
  visibleWidgetIds: DashboardWidgetId[],
  statuses: DashboardIntegrationStatuses,
): MarketplaceEntry[] {
  const byProvider = new Map(
    integrations.map((item) => [item.provider, item] as const),
  );
  const seen = new Set<string>();
  const entries: MarketplaceEntry[] = [];

  const providers = new Set<string>([
    ...byProvider.keys(),
    ...Object.keys(PRIMARY_MARKETPLACE_BY_PROVIDER),
  ]);

  for (const provider of providers) {
    if (seen.has(provider)) continue;
    const item = byProvider.get(provider);
    if (!isProviderConnected(provider, item, statuses)) continue;

    const meta =
      PRIMARY_MARKETPLACE_BY_PROVIDER[provider] ??
      MARKETPLACE_APPS.find((app) => app.provider === provider);
    if (!meta) continue;

    seen.add(provider);
    entries.push({
      id: meta.id,
      name: item?.name ?? meta.name,
      description: item?.description ?? meta.description,
      category: meta.category,
      categoryLabel: meta.categoryLabel,
      meta,
      status: 'CONNECTED',
      connectedAt: connectedAtForProvider(provider, item, statuses),
      isConnected: true,
      dashboardWidgetCount: countDashboardWidgetsForProvider(
        meta.provider,
        visibleWidgetIds,
      ),
      widgetLabels: getWidgetLabelsForProvider(meta.provider),
    });
  }

  return entries;
}

function IntegrationMarketplaceCard({ entry }: { entry: MarketplaceEntry }) {
  const { meta, isConnected, dashboardWidgetCount, widgetLabels } = entry;
  const iconKey = meta.iconKey;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border-warm bg-white p-5 shadow-sm transition-colors hover:border-positive-muted hover:shadow-md">
      <div className="flex items-start gap-3">
        <IntegrationIcon
          provider={isIntegrationIconProvider(iconKey) ? iconKey : 'JIRA'}
          size="md"
          tile
          dimmed={!meta.available}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink">{entry.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{entry.categoryLabel}</Badge>
            {isConnected && meta.available && <Badge variant="success">Connected</Badge>}
            {!meta.available && <Badge variant="secondary">Coming soon</Badge>}
            {dashboardWidgetCount > 0 && (
              <Badge variant="default">
                {dashboardWidgetCount} on dashboard
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">{entry.description}</p>
        </div>
      </div>

      {widgetLabels.length > 0 && (
        <div className="mt-4 rounded-lg border border-border-warm bg-canvas p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Dashboard widgets
          </p>
          <ul className="mt-2 space-y-1" role="list">
            {widgetLabels.map((label) => (
              <li key={label} className="text-sm text-ink">
                • {label}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Toggle each widget on the integration page after connecting.
          </p>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {!meta.available || !meta.configureRoute ? (
          <Button size="sm" disabled>
            Coming soon
          </Button>
        ) : isConnected ? (
          <Link href={meta.configureRoute} className={buttonVariants({ size: 'sm' })}>
            Manage
          </Link>
        ) : (
          <Link href={meta.configureRoute} className={buttonVariants({ size: 'sm' })}>
            Connect
          </Link>
        )}
      </div>
    </article>
  );
}

function ConnectedAppDetailCard({
  entry,
  onRevoke,
  isRevoking,
  error,
}: {
  entry: MarketplaceEntry;
  onRevoke: () => void;
  isRevoking: boolean;
  error: string | null;
}) {
  const { meta, dashboardWidgetCount } = entry;
  const iconKey = meta.iconKey;

  return (
    <article className="rounded-2xl border border-positive-muted bg-gradient-to-br from-positive-light/80 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <IntegrationIcon
            provider={isIntegrationIconProvider(iconKey) ? iconKey : 'JIRA'}
            size="md"
            tile
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-ink">{entry.name}</h3>
              <Badge variant="success">Connected</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{entry.categoryLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {meta.configureRoute && (
            <Link
              href={meta.configureRoute}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Manage widgets
            </Link>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={onRevoke}
            disabled={isRevoking}
          >
            {isRevoking ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Removing…
              </span>
            ) : (
              'Revoke & remove'
            )}
          </Button>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 border-t border-positive-muted/60 pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Connected</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {entry.connectedAt
              ? new Date(entry.connectedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recently'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Dashboard</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {dashboardWidgetCount > 0
              ? `${dashboardWidgetCount} widget${dashboardWidgetCount === 1 ? '' : 's'} active`
              : 'No widgets enabled'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Status</dt>
          <dd className="mt-0.5 font-medium text-ink">Active</dd>
        </div>
      </dl>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </article>
  );
}

export function IntegrationsMarketplace() {
  const queryClient = useQueryClient();
  const { category, setCategory, searchQuery, setSearchQuery, integrationsTab, setIntegrationsTab } =
    useDashboardUi();
  const { visibleWidgetIds, statuses } = useDashboardVisibleWidgets({
    // Marketplace only needs these for widget counts; integrations list drives Connect state.
    // Defer heavy status fan-out until My connected apps (or when list already loaded).
    enabled: integrationsTab === 'connected',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsService.getAll(),
  });

  const integrations = data?.data ?? [];

  const entries = useMemo(
    () => buildEntries(integrations, visibleWidgetIds, statuses),
    [integrations, visibleWidgetIds, statuses],
  );

  const connectedEntries = useMemo(
    () => buildConnectedEntries(integrations, visibleWidgetIds, statuses),
    [integrations, visibleWidgetIds, statuses],
  );

  const filteredBrowse = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return entries
      .filter((entry) => {
        const matchesCategory = category === 'all' || entry.category === category;
        const matchesSearch =
          !query ||
          entry.name.toLowerCase().includes(query) ||
          entry.description.toLowerCase().includes(query) ||
          entry.categoryLabel.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        // Connected first, then available, then coming soon (preserve catalog order within each group)
        const rank = (entry: MarketplaceEntry) => {
          if (entry.isConnected) return 0;
          if (entry.meta.available) return 1;
          return 2;
        };
        return rank(a) - rank(b);
      });
  }, [entries, category, searchQuery]);

  const revokeMutation = useMutation({
    mutationFn: (provider: string) => disconnectIntegrationProvider(provider),
    onSuccess: (_data, provider) => {
      invalidateIntegrationQueries(queryClient, provider);
    },
  });

  const connectedCount = connectedEntries.length;

  return (
    <div className="space-y-6">
      <div
        className="inline-flex rounded-xl border border-border-warm bg-canvas p-1"
        role="tablist"
        aria-label="Integration views"
      >
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={integrationsTab === tab.id}
            onClick={() => setIntegrationsTab(tab.id)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              integrationsTab === tab.id
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <IntegrationMarketplaceSkeleton count={6} />
      ) : integrationsTab === 'browse' ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              {MARKETPLACE_CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setCategory(filter.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                    category === filter.id
                      ? 'border-brand bg-brand text-white'
                      : 'border-border-warm bg-white text-ink hover:bg-canvas',
                  )}
                  aria-pressed={category === filter.id}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-64">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search apps…"
              />
            </div>
          </div>

          {filteredBrowse.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-warm bg-canvas p-8 text-center text-sm text-muted">
              No apps match your filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBrowse.map((entry) => (
                <IntegrationMarketplaceCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {connectedEntries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-warm bg-canvas p-8 text-center text-sm text-muted">
              No apps connected yet. Browse the marketplace to connect your first app.
            </p>
          ) : (
            connectedEntries.map((entry) => (
              <ConnectedAppDetailCard
                key={entry.id}
                entry={entry}
                isRevoking={
                  revokeMutation.isPending &&
                  revokeMutation.variables === entry.meta.provider
                }
                error={
                  revokeMutation.isError && revokeMutation.variables === entry.meta.provider
                    ? getErrorMessage(revokeMutation.error)
                    : null
                }
                onRevoke={() => revokeMutation.mutate(entry.meta.provider)}
              />
            ))
          )}
        </div>
      )}

      {integrationsTab === 'browse' && (
        <p className="border-t border-border-warm pt-4 text-center text-sm text-muted">
          {MARKETPLACE_APP_COUNT} apps listed · {connectedCount} connected · Coming soon apps
          unlock as we ship them
        </p>
      )}
    </div>
  );
}
