'use client';

import { useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { OutlookProfileCard } from '@/components/shared/outlook-profile-card';
import { OutlookMessageList } from '@/components/shared/outlook-message-list';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { outlookService } from '@/services/outlook.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function OutlookProfileDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['outlook-profile'],
    queryFn: () => outlookService.getProfile(),
  });

  const profile = data?.data?.profile ?? null;

  return (
    <DashboardWidgetCard
      source="Outlook"
      sourceLogo={<IntegrationIcon provider="OUTLOOK" />}
      title="Outlook profile"
      deepLinkHref="/integrations/outlook"
      deepLinkLabel="Open Outlook"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : profile ? (
        <OutlookProfileCard profile={profile} />
      ) : (
        <p className="text-sm text-muted">Profile unavailable.</p>
      )}
    </DashboardWidgetCard>
  );
}

export function OutlookInboxDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['outlook-messages'],
    queryFn: () => outlookService.getMessages(),
  });

  const messages = data?.data?.messages ?? [];

  return (
    <DashboardWidgetCard
      source="Outlook"
      sourceLogo={<IntegrationIcon provider="OUTLOOK" />}
      title="Inbox"
      deepLinkHref="/integrations/outlook"
      deepLinkLabel="Open Outlook"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No emails found"
          description="Your inbox has no emails to show"
        />
      ) : (
        <OutlookMessageList messages={messages} />
      )}
    </DashboardWidgetCard>
  );
}
