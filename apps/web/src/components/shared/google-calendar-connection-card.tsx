import { Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { GoogleCalendarStatus } from '@/services/google-calendar.service';

interface GoogleCalendarConnectionCardProps {
  status?: GoogleCalendarStatus;
  isLoading: boolean;
  isConnected: boolean;
  isPending: boolean;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
  authError: string | null;
  connectError: string | null;
  onConnect: () => void;
  onReconnect?: () => void;
  onDisconnect: () => void;
}

export function GoogleCalendarConnectionCard({
  status,
  isLoading,
  isConnected,
  isPending,
  isConnecting,
  isDisconnecting,
  authError,
  connectError,
  onConnect,
  onReconnect,
  onDisconnect,
}: GoogleCalendarConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="GOOGLE_CALENDAR"
      title="Google Account"
      disconnectedHint="Link your Google account for Calendar, Meet, Drive, Gmail, and Chat"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Google"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      onReconnect={onReconnect}
      needsReconnect={Boolean(status?.needsReconnect)}
      mapAuthError={(error) =>
        error === 'access_denied'
          ? 'Google access was denied. Add your Gmail as a test user in Google Cloud Console.'
          : error
      }
      banner={
        status?.needsReconnect ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Calendar permissions are outdated. Click <strong>Reconnect</strong> to
            allow Meet creation and Google Chat.
          </p>
        ) : null
      }
      connectedMeta={
        <>
          {status?.googleEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.googleEmail}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
          <p className="text-xs text-muted">
            Calendar, Meet, Drive, Gmail, and Chat use this connected Google account.
          </p>
        </>
      }
    />
  );
}
