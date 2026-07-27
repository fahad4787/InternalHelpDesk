import { Globe, Mail } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/integrations/common/integration-connection-card';
import { SalesforceStatus } from '@/services/salesforce.service';

interface SalesforceConnectionCardProps {
  status?: SalesforceStatus;
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

export function SalesforceConnectionCard({
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
}: SalesforceConnectionCardProps) {
  return (
    <IntegrationConnectionCard
      provider="SALESFORCE"
      title="Salesforce Account"
      disconnectedHint="Link your Salesforce account to view contacts, accounts, and opportunities"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Salesforce"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Salesforce access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Salesforce sign-in was interrupted. Refresh and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {status?.salesforceEmail && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.salesforceEmail}
            </p>
          )}
          {status?.instanceUrl && (
            <p className="flex items-center gap-1.5 truncate text-xs text-muted">
              <Globe className="h-3.5 w-3.5 shrink-0 text-brand" />
              {status.instanceUrl}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
        </>
      }
    />
  );
}
