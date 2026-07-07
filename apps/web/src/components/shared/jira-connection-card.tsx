import { format } from 'date-fns';
import { CheckCircle2, Mail, Unplug } from 'lucide-react';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectionCardSkeleton } from '@/components/shared/loading-state';
import { JiraStatus } from '@/services/jira.service';

interface JiraConnectionCardProps {
  status?: JiraStatus;
  isLoading: boolean;
  isConnected: boolean;
  isPending: boolean;
  authError: string | null;
  connectError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function JiraConnectionCard({
  status,
  isLoading,
  isConnected,
  isPending,
  authError,
  connectError,
  onConnect,
  onDisconnect,
}: JiraConnectionCardProps) {
  if (isLoading) {
    return <ConnectionCardSkeleton />;
  }

  return (
    <Card
      className={
        isConnected
          ? 'connected-card overflow-hidden'
          : 'overflow-hidden'
      }
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <IntegrationIcon
              provider="JIRA"
              size="lg"
              tile
              dimmed={!isConnected}
            />

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-ink">
                  Jira Account
                </h2>
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
              </div>

              {status?.jiraEmail ? (
                <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
                  {status.jiraEmail}
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Link your Jira account to view issues and projects
                </p>
              )}

              {status?.jiraSiteUrl && (
                <p className="truncate text-xs text-muted">{status.jiraSiteUrl}</p>
              )}

              {isConnected && status?.lastSyncedAt && (
                <p className="text-xs text-muted">
                  Last synced {format(new Date(status.lastSyncedAt), 'MMM d, yyyy · h:mm a')}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:pl-4">
            {!isConnected ? (
              <Button onClick={onConnect} disabled={isPending} className="w-full sm:w-auto">
                {status?.mockMode ? 'Connect (Mock)' : 'Connect with Jira'}
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

        {(status?.mockMode || authError || connectError) && (
          <div className="space-y-2 border-t border-border-warm bg-white/70 px-5 py-3">
            {status?.mockMode && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Mock mode is enabled. Configure JIRA_MODE=live and Jira OAuth credentials to use live authentication.
              </p>
            )}
            {authError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {authError === 'access_denied'
                  ? 'Jira access was denied. Approve the app when prompted.'
                  : authError === 'missing_code_or_state' ||
                      authError === 'missing_state' ||
                      authError === 'missing_code'
                    ? 'Jira sign-in was interrupted. Refresh the page and connect again if needed.'
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
