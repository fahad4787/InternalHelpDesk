'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Mail } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { MeetEventList } from '@/components/shared/meet-event-list';
import { OutlookMessageList } from '@/components/shared/outlook-message-list';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { getErrorMessage } from '@/lib/api-client';
import { outlookService } from '@/services/outlook.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DashboardWidgetCard } from '../dashboard-widget-card';

const OUTLOOK_CALENDAR_URL = 'https://outlook.office.com/calendar/';

export function OutlookCalendarDashboardWidget() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['outlook-events'],
    queryFn: () => outlookService.getEvents(),
  });

  const events = data?.data?.events ?? [];

  return (
    <DashboardWidgetCard
      source="Outlook"
      sourceLogo={<IntegrationIcon provider="OUTLOOK" />}
      title="Outlook Calendar"
      deepLinkHref={OUTLOOK_CALENDAR_URL}
      deepLinkLabel="Open Calendar"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : isError ? (
        <p className="text-sm text-red-600">{getErrorMessage(error)}</p>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming events"
          description="Your Outlook calendar events for the next 30 days will appear here"
        />
      ) : (
        <MeetEventList events={events} />
      )}
    </DashboardWidgetCard>
  );
}

export function OutlookInboxDashboardWidget() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['outlook-messages'],
    queryFn: () => outlookService.getMessages(),
  });

  const messages = data?.data?.messages ?? [];

  return (
    <DashboardWidgetCard
      source="Outlook"
      sourceLogo={<IntegrationIcon provider="OUTLOOK" />}
      title="Inbox"
      deepLinkHref="https://outlook.office.com/mail/"
      deepLinkLabel="Open Outlook"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : isError ? (
        <p className="text-sm text-red-600">{getErrorMessage(error)}</p>
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
