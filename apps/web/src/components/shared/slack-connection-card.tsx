import { format } from 'date-fns';
import { CheckCircle2, Hash, Mail, Unplug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SlackStatus } from '@/services/slack.service';

interface SlackConnectionCardProps {
  status?: SlackStatus;
  isLoading: boolean;
  isConnected: boolean;
  isPending: boolean;
  authError: string | null;
  connectError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function SlackConnectionCard({
  status,
  isLoading,
  isConnected,
  isPending,
  authError,
  connectError,
  onConnect,
  onDisconnect,
}: SlackConnectionCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-slate-500">Loading connection...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={
        isConnected
          ? 'overflow-hidden border-brand-muted bg-gradient-to-r from-brand-light/50 via-white to-white'
          : 'overflow-hidden'
      }
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                isConnected
                  ? 'border-brand-muted bg-white text-brand shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              <Hash className="h-6 w-6" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Slack Workspace
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

              {status?.teamName ? (
                <p className="truncate text-sm font-medium text-slate-700">
                  {status.teamName}
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Connect Slack for notifications and channel access
                </p>
              )}

              {status?.slackEmail && (
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-600">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
                  {status.slackEmail}
                </p>
              )}

              {isConnected && status?.lastSyncedAt && (
                <p className="text-xs text-slate-400">
                  Last synced {format(new Date(status.lastSyncedAt), 'MMM d, yyyy · h:mm a')}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:pl-4">
            {!isConnected ? (
              <Button onClick={onConnect} disabled={isPending} className="w-full sm:w-auto">
                {status?.mockMode ? 'Connect (Mock)' : 'Connect with Slack'}
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
          <div className="space-y-2 border-t border-slate-100 bg-white/70 px-5 py-3">
            {status?.mockMode && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Mock mode is enabled. Configure SLACK_MODE=live and Slack OAuth credentials to use live authentication.
              </p>
            )}
            {authError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {authError === 'access_denied'
                  ? 'Slack access was denied. Approve the app when prompted.'
                  : authError === 'missing_code' || authError === 'missing_state'
                    ? 'Slack sign-in was interrupted. Refresh the page and connect again if needed.'
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
