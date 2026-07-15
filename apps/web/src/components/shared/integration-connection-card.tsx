'use client';

import type { ReactNode } from 'react';
import { CheckCircle2, Loader2, Unplug } from 'lucide-react';
import {
  IntegrationIcon,
  isIntegrationIconProvider,
  type IntegrationIconProvider,
} from '@/components/shared/integration-icon';
import { ConnectionCardSkeleton } from '@/components/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface IntegrationConnectionCardProps {
  provider: IntegrationIconProvider | string;
  title: string;
  disconnectedHint: string;
  isLoading: boolean;
  isConnected: boolean;
  isPending: boolean;
  /** True while connect/auth URL request is in flight */
  isConnecting?: boolean;
  /** True while disconnect request is in flight */
  isDisconnecting?: boolean;
  /** Label shown while connect is in flight (defaults to Connecting…) */
  connectingLabel?: string;
  connectLabel?: string;
  authError: string | null;
  connectError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnect?: () => void;
  needsReconnect?: boolean;
  connectedMeta?: ReactNode;
  /** Extra footer banner (e.g. reconnect hint) shown above errors */
  banner?: ReactNode;
  mapAuthError?: (error: string) => string;
}

function defaultMapAuthError(error: string): string {
  if (error === 'access_denied') {
    return 'Access was denied. Approve the app when prompted.';
  }
  if (
    error === 'missing_code' ||
    error === 'missing_state' ||
    error === 'missing_code_or_state' ||
    error === 'missing_token'
  ) {
    return 'Sign-in was interrupted. Refresh the page and connect again if needed.';
  }
  return error;
}

export function IntegrationConnectionCard({
  provider,
  title,
  disconnectedHint,
  isLoading,
  isConnected,
  isPending,
  isConnecting,
  isDisconnecting,
  connectLabel,
  connectingLabel = 'Connecting…',
  authError,
  connectError,
  onConnect,
  onDisconnect,
  onReconnect,
  needsReconnect,
  connectedMeta,
  banner,
  mapAuthError = defaultMapAuthError,
}: IntegrationConnectionCardProps) {
  if (isLoading) {
    return <ConnectionCardSkeleton />;
  }

  const iconProvider = isIntegrationIconProvider(provider) ? provider : 'JIRA';
  const connecting = Boolean(isConnecting ?? (isPending && !isConnected));
  const disconnecting = Boolean(isDisconnecting ?? (isPending && isConnected));
  const busy = isPending || connecting || disconnecting;

  return (
    <Card className={isConnected ? 'connected-card overflow-hidden' : 'overflow-hidden'}>
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <IntegrationIcon
              provider={iconProvider}
              size="lg"
              tile
              dimmed={!isConnected}
            />

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-ink">{title}</h2>
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

              {isConnected ? (
                connectedMeta
              ) : (
                <p className="text-sm text-muted">{disconnectedHint}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:pl-4">
            {!isConnected ? (
              <Button
                onClick={onConnect}
                disabled={busy}
                className="w-full sm:w-auto"
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {connectingLabel}
                  </>
                ) : (
                  connectLabel ?? `Connect with ${title.replace(/ Account$/i, '')}`
                )}
              </Button>
            ) : (
              <>
                {needsReconnect && onReconnect && (
                  <Button
                    onClick={onReconnect}
                    disabled={busy}
                    className="w-full sm:w-auto"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reconnecting…
                      </>
                    ) : (
                      'Reconnect'
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={onDisconnect}
                  disabled={busy}
                  className="w-full bg-white sm:w-auto"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disconnecting…
                    </>
                  ) : (
                    <>
                      <Unplug className="mr-2 h-4 w-4" />
                      Disconnect
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {(banner || authError || connectError) && (
          <div className="space-y-2 border-t border-border-warm bg-white/70 px-5 py-3">
            {banner}
            {authError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {mapAuthError(authError)}
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

export function ConnectionSyncedAt({ value }: { value?: string | null }) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return (
    <p className="text-xs text-muted">
      Last synced{' '}
      {date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}
    </p>
  );
}
