import { Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { ZoomStatus } from '@/services/zoom.service';

interface ZoomConnectionCardProps {
  status?: ZoomStatus;
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

export function ZoomConnectionCard({
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
}: ZoomConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="ZOOM"
      title="Zoom Account"
      disconnectedHint="Link your Zoom account to view upcoming meetings"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Zoom"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Zoom access was denied. Approve the app in your Zoom account settings.';
        }
        if (
          error === 'missing_code_or_state' ||
          error === 'missing_state' ||
          error === 'missing_code'
        ) {
          return 'Zoom sign-in was interrupted. Refresh the page and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.zoomEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.zoomEmail}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
