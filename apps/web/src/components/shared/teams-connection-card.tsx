import { Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { TeamsStatus } from '@/services/teams.service';

interface TeamsConnectionCardProps {
  status?: TeamsStatus;
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

export function TeamsConnectionCard({
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
}: TeamsConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="MICROSOFT_TEAMS"
      title="Microsoft Teams Account"
      disconnectedHint="Link a Microsoft 365 work or school account to view teams and chats"
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
          return 'Teams access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Teams sign-in was interrupted. Refresh the page and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.teamsEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.teamsEmail}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
