'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Link2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { CalendlyEventList } from '@/components/shared/calendly-event-list';
import { CalendlyEventTypeList } from '@/components/shared/calendly-event-type-list';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { calendlyService } from '@/services/calendly.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function CalendlyEventTypesDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['calendly-event-types'],
    queryFn: () => calendlyService.getEventTypes(),
  });

  const eventTypes = data?.data?.eventTypes ?? [];

  return (
    <DashboardWidgetCard
      source="Calendly"
      sourceLogo={<IntegrationIcon provider="CALENDLY" />}
      title="Event types"
      deepLinkHref="/integrations/calendly"
      deepLinkLabel="Open Calendly"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : eventTypes.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No event types"
          description="Active Calendly event types will appear here"
        />
      ) : (
        <CalendlyEventTypeList eventTypes={eventTypes} />
      )}
    </DashboardWidgetCard>
  );
}

export function CalendlyUpcomingEventsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['calendly-events'],
    queryFn: () => calendlyService.getUpcomingEvents(),
  });

  const events = data?.data?.events ?? [];

  return (
    <DashboardWidgetCard
      source="Calendly"
      sourceLogo={<IntegrationIcon provider="CALENDLY" />}
      title="Upcoming events"
      deepLinkHref="/integrations/calendly"
      deepLinkLabel="Open Calendly"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No upcoming events"
          description="Booked Calendly meetings will appear here"
        />
      ) : (
        <CalendlyEventList events={events} />
      )}
    </DashboardWidgetCard>
  );
}
