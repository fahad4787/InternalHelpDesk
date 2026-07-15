import { Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { AsanaStatus } from '@/services/asana.service';

interface AsanaConnectionCardProps {
  status?: AsanaStatus;
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

export function AsanaConnectionCard({
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
}: AsanaConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="ASANA"
      title="Asana Account"
      disconnectedHint="Link your Asana account to view projects and tasks"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Asana"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Asana access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Asana sign-in was interrupted. Refresh the page and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.asanaEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.asanaEmail}
            </p>
          )}
          {status?.asanaName && (
            <p className="truncate text-xs text-muted">{status.asanaName}</p>
          )}
          {status?.workspaceNames && status.workspaceNames.length > 0 && (
            <p className="text-xs text-muted">
              Workspace{status.workspaceNames.length > 1 ? 's' : ''}:{' '}
              {status.workspaceNames.join(', ')}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
