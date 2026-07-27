import { Mail, User } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/integrations/common/integration-connection-card';
import { TrelloStatus } from '@/services/trello.service';

interface TrelloConnectionCardProps {
  status?: TrelloStatus;
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

export function TrelloConnectionCard({
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
}: TrelloConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="TRELLO"
      title="Trello Account"
      disconnectedHint="Link your Trello account to view boards and cards"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Trello"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Trello access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_token' || error === 'missing_state') {
          return 'Trello sign-in was interrupted. Refresh the page and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.trelloEmail ? (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.trelloEmail}
            </p>
          ) : status?.trelloFullName || status?.trelloUsername ? (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <User className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.trelloFullName ?? `@${status.trelloUsername}`}
            </p>
          ) : null}
          {status?.trelloUsername && (
            <p className="truncate text-xs text-muted">@{status.trelloUsername}</p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
