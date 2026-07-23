import { Globe, Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { DynamicsStatus } from '@/services/dynamics.service';

interface DynamicsConnectionCardProps {
  status?: DynamicsStatus;
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

export function DynamicsConnectionCard({
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
}: DynamicsConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="DYNAMICS_365"
      title="Dynamics 365 Account"
      disconnectedHint="Link your Dynamics 365 account to view contacts, accounts, and opportunities"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Dynamics 365"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Dynamics access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Dynamics sign-in was interrupted. Refresh and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.dynamicsEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.dynamicsEmail}
            </p>
          )}
          {status?.orgUrl && (
            <p className="flex items-center gap-1.5 truncate text-xs text-muted">
              <Globe className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.orgUrl}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
