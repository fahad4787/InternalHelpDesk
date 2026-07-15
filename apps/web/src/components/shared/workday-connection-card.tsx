'use client';

import { IntegrationConnectionCard } from '@/components/shared/integration-connection-card';
import { Badge } from '@/components/ui/badge';

export interface WorkdayConnectionStatus {
  connected?: boolean;
  tenantUrl?: string | null;
  environment?: string | null;
  mockMode?: boolean;
  status?: string;
}

interface WorkdayConnectionCardProps {
  status: WorkdayConnectionStatus | undefined;
  isLoading: boolean;
  isConnected: boolean;
  isPending: boolean;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
  connectError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WorkdayConnectionCard({
  status,
  isLoading,
  isConnected,
  isPending,
  isConnecting,
  isDisconnecting,
  connectError,
  onConnect,
  onDisconnect,
}: WorkdayConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="WORKDAY"
      title="Workday Account"
      disconnectedHint="Enter credentials below, then save to sync help articles into your knowledge base."
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Save Connection"
      connectingLabel="Saving…"
      authError={null}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      connectedMeta={
        <div className="space-y-1 text-sm text-muted">
          {status?.tenantUrl && (
            <p className="truncate" title={status.tenantUrl}>
              {status.tenantUrl}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {status?.environment && (
              <Badge variant="secondary">{status.environment}</Badge>
            )}
            {status?.mockMode && <Badge variant="info">Mock Mode</Badge>}
          </div>
        </div>
      }
      banner={
        status?.mockMode ? (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Mock Mode: using sample Workday help articles for development.
          </p>
        ) : null
      }
    />
  );
}
