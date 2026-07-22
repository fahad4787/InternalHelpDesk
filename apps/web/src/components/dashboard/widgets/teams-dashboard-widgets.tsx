'use client';

import { useQuery } from '@tanstack/react-query';
import { MessagesSquare, Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { TeamsProfileCard } from '@/components/shared/teams-profile-card';
import { TeamsChatList, TeamsTeamList } from '@/components/shared/teams-lists';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { teamsService } from '@/services/teams.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function TeamsProfileDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['teams-profile'],
    queryFn: () => teamsService.getProfile(),
  });

  const profile = data?.data?.profile ?? null;

  return (
    <DashboardWidgetCard
      source="Teams"
      sourceLogo={<IntegrationIcon provider="MICROSOFT_TEAMS" />}
      title="Teams profile"
      deepLinkHref="/integrations/teams"
      deepLinkLabel="Open Teams"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : profile ? (
        <TeamsProfileCard profile={profile} />
      ) : (
        <p className="text-sm text-muted">Profile unavailable.</p>
      )}
    </DashboardWidgetCard>
  );
}

export function TeamsJoinedDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['teams-joined'],
    queryFn: () => teamsService.getTeams(),
  });

  const teams = data?.data?.teams ?? [];

  return (
    <DashboardWidgetCard
      source="Teams"
      sourceLogo={<IntegrationIcon provider="MICROSOFT_TEAMS" />}
      title="Joined teams"
      deepLinkHref="/integrations/teams"
      deepLinkLabel="Open Teams"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
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
  const { data, isLoading } = useQuery({
    queryKey: ['teams-chats'],
    queryFn: () => teamsService.getChats(),
  });

  const chats = data?.data?.chats ?? [];

  return (
    <DashboardWidgetCard
      source="Teams"
      sourceLogo={<IntegrationIcon provider="MICROSOFT_TEAMS" />}
      title="Recent chats"
      deepLinkHref="/integrations/teams"
      deepLinkLabel="Open Teams"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
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
