'use client';

import { useQuery } from '@tanstack/react-query';
import { MessagesSquare, Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { TeamsChatList, TeamsTeamList } from '@/components/shared/teams-lists';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { getErrorMessage } from '@/lib/api-client';
import {
  isTeamsGraphUnsupportedError,
  TEAMS_WORK_ACCOUNT_MESSAGE,
} from '@/lib/teams-account';
import { teamsService } from '@/services/teams.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DashboardWidgetCard } from '../dashboard-widget-card';

const TEAMS_HOME_URL = 'https://teams.microsoft.com';

function TeamsWidgetError({ error }: { error: unknown }) {
  const message = getErrorMessage(error);
  return (
    <p className="text-sm text-amber-800">
      {isTeamsGraphUnsupportedError(message)
        ? TEAMS_WORK_ACCOUNT_MESSAGE
        : message}
    </p>
  );
}

export function TeamsJoinedDashboardWidget() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['teams-joined'],
    queryFn: () => teamsService.getTeams(),
    retry: false,
  });

  const teams = data?.data?.teams ?? [];

  return (
    <DashboardWidgetCard
      source="Teams"
      sourceLogo={<IntegrationIcon provider="MICROSOFT_TEAMS" />}
      title="Joined teams"
      deepLinkHref={TEAMS_HOME_URL}
      deepLinkLabel="Open Teams"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : isError ? (
        <TeamsWidgetError error={error} />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams found"
          description="You are not a member of any Microsoft Teams yet"
        />
      ) : (
        <TeamsTeamList teams={teams.slice(0, 6)} />
      )}
    </DashboardWidgetCard>
  );
}

export function TeamsChatsDashboardWidget() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['teams-chats'],
    queryFn: () => teamsService.getChats(),
    retry: false,
  });

  const chats = data?.data?.chats ?? [];

  return (
    <DashboardWidgetCard
      source="Teams"
      sourceLogo={<IntegrationIcon provider="MICROSOFT_TEAMS" />}
      title="Recent chats"
      deepLinkHref={TEAMS_HOME_URL}
      deepLinkLabel="Open Teams"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : isError ? (
        <TeamsWidgetError error={error} />
      ) : chats.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No chats found"
          description="Your recent Teams chats will appear here"
        />
      ) : (
        <TeamsChatList chats={chats.slice(0, 6)} />
      )}
    </DashboardWidgetCard>
  );
}
