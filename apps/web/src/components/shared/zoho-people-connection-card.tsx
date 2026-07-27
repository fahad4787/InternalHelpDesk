import { Globe, Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { ZohoPeopleStatus } from '@/services/zoho-people.service';

interface ZohoPeopleConnectionCardProps {
  status?: ZohoPeopleStatus;
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

export function ZohoPeopleConnectionCard({
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
}: ZohoPeopleConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="ZOHO"
      title="Zoho People Account"
      disconnectedHint="Link your Zoho People account to view employees and leave"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Zoho People"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Zoho People access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Zoho People sign-in was interrupted. Refresh and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.zohoEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.zohoEmail}
            </p>
          )}
          {status?.apiDomain && (
            <p className="flex items-center gap-1.5 truncate text-xs text-muted">
              <Globe className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.apiDomain.replace(/^https?:\/\//, '')}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
