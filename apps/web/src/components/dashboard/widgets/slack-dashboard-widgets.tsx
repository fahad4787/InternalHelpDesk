'use client';

import { SlackMessenger } from '@/components/shared/slack-messenger';
import { SlackProfileCard } from '@/components/shared/slack-profile-card';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { useSlackMessenger } from '@/hooks/use-slack-messenger';
import { slackService } from '@/services/slack.service';
import { useQuery } from '@tanstack/react-query';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function SlackProfileDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['slack-profile'],
    queryFn: () => slackService.getProfile(),
  });

  const profile = data?.data?.profile ?? null;

  return (
    <DashboardWidgetCard
      source="Slack"
      sourceLogo={<IntegrationIcon provider="SLACK" />}
      title="Workspace profile"
      deepLinkHref="/integrations/slack"
      deepLinkLabel="Open Slack"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : (
        <SlackProfileCard profile={profile} isLoading={false} />
      )}
    </DashboardWidgetCard>
  );
}

export function SlackMessengerDashboardWidget({
  className,
}: {
  className?: string;
}) {
  const messenger = useSlackMessenger();

  return (
    <DashboardWidgetCard
      source="Slack"
      sourceLogo={<IntegrationIcon provider="SLACK" />}
      title="Channels & messages"
      deepLinkHref="/integrations/slack"
      deepLinkLabel="Open Slack"
      fillContent
      className={className}
    >
      <div className="h-[280px] overflow-hidden rounded-xl border border-border-warm">
        <SlackMessenger {...messenger} />
      </div>
    </DashboardWidgetCard>
  );
}
