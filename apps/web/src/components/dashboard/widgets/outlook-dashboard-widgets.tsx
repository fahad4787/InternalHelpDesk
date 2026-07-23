'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek } from 'date-fns';
import { Mail } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import {
  getOutlookWeekRange,
  OutlookWeekCalendar,
} from '@/components/shared/outlook-week-calendar';
import { OutlookMessageList } from '@/components/shared/outlook-message-list';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { getErrorMessage } from '@/lib/api-client';
import { outlookService } from '@/services/outlook.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DashboardWidgetCard } from '../dashboard-widget-card';

const OUTLOOK_CALENDAR_URL = 'https://outlook.office.com/calendar/';

export function OutlookCalendarDashboardWidget() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 }),
  );
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const range = useMemo(() => getOutlookWeekRange(weekStart), [weekStart]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['outlook-events', range.start, range.end],
    queryFn: () => outlookService.getEvents(range),
  });

  const events = data?.data?.events ?? [];

  return (
    <DashboardWidgetCard
      source="Outlook"
      sourceLogo={<IntegrationIcon provider="OUTLOOK" />}
      title="Outlook Calendar"
      deepLinkHref={OUTLOOK_CALENDAR_URL}
      deepLinkLabel="Open Calendar"
      fillContent
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={6} />
      ) : isError ? (
        <p className="text-sm text-red-600">{getErrorMessage(error)}</p>
      ) : (
        <OutlookWeekCalendar
          events={events}
          weekStart={weekStart}
          onWeekChange={setWeekStart}
          selectedDay={selectedDay}
          onSelectedDayChange={setSelectedDay}
        />
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
