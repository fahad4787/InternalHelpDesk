import { Globe, Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { HubSpotStatus } from '@/services/hubspot.service';

interface HubSpotConnectionCardProps {
  status?: HubSpotStatus;
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

export function HubSpotConnectionCard({
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
}: HubSpotConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="HUBSPOT"
      title="HubSpot Account"
      disconnectedHint="Link your HubSpot account to view contacts and deals"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with HubSpot"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'HubSpot access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'HubSpot sign-in was interrupted. Refresh and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.hubspotEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.hubspotEmail}
            </p>
          )}
          {status?.hubDomain && (
            <p className="flex items-center gap-1.5 truncate text-xs text-muted">
              <Globe className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.hubDomain}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
