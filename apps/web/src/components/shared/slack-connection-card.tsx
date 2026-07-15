'use client';

import { useQuery } from '@tanstack/react-query';
import { Mail, User } from 'lucide-react';
import {
  ConnectionSyncedAt,
  IntegrationConnectionCard,
} from '@/components/shared/integration-connection-card';
import { SlackStatus, slackService } from '@/services/slack.service';

interface SlackConnectionCardProps {
  status?: SlackStatus;
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

export function SlackConnectionCard({
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
}: SlackConnectionCardProps) {
  const { data: profileData } = useQuery({
    queryKey: ['slack-profile'],
    queryFn: () => slackService.getProfile(),
    enabled: isConnected,
    staleTime: 60_000,
  });

  const profile = profileData?.data?.profile ?? null;
  const teamName = status?.teamName ?? profile?.teamName;
  const email = status?.slackEmail ?? profile?.email;

  return (
    <IntegrationConnectionCard
      provider="SLACK"
      title="Slack Workspace"
      disconnectedHint="Connect Slack for notifications and channel access"
      isLoading={isLoading}
      isConnected={isConnected}
      isPending={isPending}
      isConnecting={isConnecting}
      isDisconnecting={isDisconnecting}
      connectLabel="Connect with Slack"
      authError={authError}
      connectError={connectError}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      mapAuthError={(error) => {
        if (error === 'access_denied') {
          return 'Slack access was denied. Approve the app when prompted.';
        }
        if (error === 'missing_code' || error === 'missing_state') {
          return 'Slack sign-in was interrupted. Refresh the page and connect again if needed.';
        }
        return error;
      }}
      connectedMeta={
        <>
          {teamName && (
            <p className="truncate text-sm font-medium text-ink">{teamName}</p>
          )}
          {profile?.displayName && (
            <p className="flex items-center gap-1.5 truncate text-sm text-ink">
              <User className="h-3.5 w-3.5 shrink-0 text-brand" />
              {profile.displayName}
            </p>
          )}
          {email && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {email}
            </p>
          )}
          <ConnectionSyncedAt value={status?.lastSyncedAt} />
          {profile?.teamId && (
            <p className="text-xs text-muted">Team ID: {profile.teamId}</p>
          )}
        </>
      }
    />
  );
}
