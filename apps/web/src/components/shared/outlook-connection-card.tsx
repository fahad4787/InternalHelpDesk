import { Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { OutlookStatus } from '@/services/outlook.service';

interface OutlookConnectionCardProps {
  status?: OutlookStatus;
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

export function OutlookConnectionCard({
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
}: OutlookConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="OUTLOOK"
      title="Outlook Account"
      disconnectedHint="Link your Microsoft account to view inbox messages"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Microsoft"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Outlook access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Outlook sign-in was interrupted. Refresh the page and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.outlookEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.outlookEmail}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
