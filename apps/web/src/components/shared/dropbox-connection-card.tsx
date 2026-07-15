import { Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { DropboxStatus } from '@/services/dropbox.service';

interface DropboxConnectionCardProps {
  status?: DropboxStatus;
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

export function DropboxConnectionCard({
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
}: DropboxConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="DROPBOX"
      title="Dropbox Account"
      disconnectedHint="Link your Dropbox account to browse recent files"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Dropbox"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Dropbox access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Dropbox sign-in was interrupted. Refresh and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.dropboxEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.dropboxEmail}
            </p>
          )}
          {status?.dropboxDisplayName && (
            <p className="truncate text-xs text-muted">{status.dropboxDisplayName}</p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
