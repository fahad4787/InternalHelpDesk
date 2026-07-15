import { Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { MondayStatus } from '@/services/monday.service';

interface MondayConnectionCardProps {
  status?: MondayStatus;
  isLoading: boolean;
  isConnected: boolean;
  isPending: boolean;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
  authError: string | null;
  connectError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function MondayConnectionCard({
  status,
  isLoading,
  isConnected,
  isPending,
  isConnecting,
  isDisconnecting,
  authError,
  connectError,
  onConnect,
  onDisconnect,
}: MondayConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="MONDAY"
      title="Monday.com Account"
      disconnectedHint="Link your Monday.com account to view boards and items"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Monday.com"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Monday.com access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Monday.com sign-in was interrupted. Refresh the page and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.mondayEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.mondayEmail}
            </p>
          )}
          {status?.mondayName && (
            <p className="truncate text-xs text-muted">{status.mondayName}</p>
          )}
          {(status?.mondayAccountName || status?.mondayAccountSlug) && (
            <p className="text-xs text-muted">
              Account:{' '}
              {status.mondayAccountName ?? status.mondayAccountSlug}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
