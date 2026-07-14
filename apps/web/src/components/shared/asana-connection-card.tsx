import { format } from 'date-fns';
import { CheckCircle2, Mail, Unplug } from 'lucide-react';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectionCardSkeleton } from '@/components/shared/loading-state';
import { AsanaStatus } from '@/services/asana.service';

interface AsanaConnectionCardProps {
  status?: AsanaStatus;
  isLoading: boolean;
  isConnected: boolean;
  isPending: boolean;
  authError: string | null;
  connectError: string | null;
  awaitingCode?: boolean;
  authCode?: string;
  onAuthCodeChange?: (value: string) => void;
  onSubmitCode?: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function AsanaConnectionCard({
  status,
  isLoading,
  isConnected,
  isPending,
  authError,
  connectError,
  awaitingCode = false,
  authCode = '',
  onAuthCodeChange,
  onSubmitCode,
  onConnect,
  onDisconnect,
}: AsanaConnectionCardProps) {
  if (isLoading) {
    return <ConnectionCardSkeleton />;
  }

  const isMock = status?.mockMode === true;

  return (
    <Card className={isConnected ? 'connected-card overflow-hidden' : 'overflow-hidden'}>
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <IntegrationIcon
              provider="ASANA"
              size="lg"
              tile
              dimmed={!isConnected}
            />

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-ink">Asana Account</h2>
                <Badge variant={isConnected ? 'success' : 'secondary'}>
                  {isConnected ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    'Not Connected'
                  )}
                </Badge>
                {isConnected && isMock && <Badge variant="secondary">Mock</Badge>}
              </div>

              {status?.asanaEmail ? (
                <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
                  {status.asanaEmail}
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Link your Asana account to view projects and tasks
                </p>
              )}

              {status?.asanaName && (
                <p className="truncate text-xs text-muted">{status.asanaName}</p>
              )}

              {isConnected &&
                status?.workspaceNames &&
                status.workspaceNames.length > 0 && (
                  <p className="text-xs text-muted">
                    Workspace
                    {status.workspaceNames.length > 1 ? 's' : ''}:{' '}
                    {status.workspaceNames.join(', ')}
                  </p>
                )}

              {isConnected && status?.lastSyncedAt && (
                <p className="text-xs text-muted">
                  Last synced{' '}
                  {format(new Date(status.lastSyncedAt), 'MMM d, yyyy · h:mm a')}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:pl-4">
            {!isConnected ? (
              <Button onClick={onConnect} disabled={isPending} className="w-full sm:w-auto">
                {isMock ? 'Connect (Mock)' : 'Connect with Asana'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onDisconnect}
                disabled={isPending}
                className="w-full bg-white sm:w-auto"
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {awaitingCode && (
          <div className="space-y-3 border-t border-border-warm bg-canvas/50 px-5 py-4">
            <p className="text-sm text-ink">
              Asana opened in a new tab. Approve access, copy the authorization
              code, paste it below, then submit.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={authCode}
                onChange={(event) => onAuthCodeChange?.(event.target.value)}
                placeholder="Paste Asana authorization code"
                className="w-full rounded-xl border border-border-warm bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                disabled={isPending}
              />
              <Button
                onClick={onSubmitCode}
                disabled={isPending || !authCode.trim()}
                className="sm:w-auto"
              >
                Submit code
              </Button>
            </div>
          </div>
        )}

        {(authError || connectError) && (
          <div className="space-y-2 border-t border-border-warm bg-white/70 px-5 py-3">
            {authError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {authError === 'access_denied'
                  ? 'Asana access was denied. Approve the app when prompted.'
                  : authError === 'missing_code' || authError === 'missing_state'
                    ? 'Asana sign-in was interrupted. Refresh the page and connect again if needed.'
                    : authError}
              </p>
            )}
            {connectError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {connectError}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
