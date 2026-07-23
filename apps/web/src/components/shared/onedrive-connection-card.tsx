import { Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { OneDriveStatus } from '@/services/onedrive.service';

interface OneDriveConnectionCardProps {
  status?: OneDriveStatus;
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

export function OneDriveConnectionCard({
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
}: OneDriveConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="ONEDRIVE"
      title="OneDrive Account"
      disconnectedHint="Link your OneDrive account to browse recent files"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with OneDrive"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'OneDrive access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'OneDrive sign-in was interrupted. Refresh and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.onedriveEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.onedriveEmail}
            </p>
          )}
          {status?.onedriveDisplayName && (
            <p className="truncate text-xs text-muted">
              {status.onedriveDisplayName}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
