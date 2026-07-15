import { Link2, Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { CalendlyStatus } from '@/services/calendly.service';

interface CalendlyConnectionCardProps {
  status?: CalendlyStatus;
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

export function CalendlyConnectionCard({
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
}: CalendlyConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="CALENDLY"
      title="Calendly Account"
      disconnectedHint="Link your Calendly account to view event types and meetings"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Calendly"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Calendly access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Calendly sign-in was interrupted. Refresh and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.calendlyEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.calendlyEmail}
            </p>
          )}
          {status?.calendlyName && (
            <p className="truncate text-xs text-muted">{status.calendlyName}</p>
          )}
          {status?.schedulingUrl && (
            <a
              href={status.schedulingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 truncate text-xs text-brand hover:underline"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              {status.schedulingUrl}
            </a>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
