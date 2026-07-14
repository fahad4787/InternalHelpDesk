'use client';

import { useQuery } from '@tanstack/react-query';
import { Video } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ZoomMeetingList } from '@/components/shared/zoom-meeting-list';
import { ZoomMonthCalendar } from '@/components/shared/zoom-month-calendar';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { ZoomProfileCard } from '@/components/shared/zoom-profile-card';
import { zoomService } from '@/services/zoom.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DashboardWidgetCard } from '../dashboard-widget-card';

const ZOOM_MEETINGS_URL = 'https://zoom.us/meeting';

export function ZoomProfileDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['zoom-profile'],
    queryFn: () => zoomService.getProfile(),
  });

  const profile = data?.data?.profile ?? null;

  return (
    <DashboardWidgetCard
      source="Zoom"
      sourceLogo={<IntegrationIcon provider="ZOOM" />}
      title="Zoom Profile"
      deepLinkHref={ZOOM_MEETINGS_URL}
      deepLinkLabel="Open Zoom"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : profile ? (
        <ZoomProfileCard profile={profile} />
      ) : (
        <p className="text-sm text-muted">Profile unavailable.</p>
      )}
    </DashboardWidgetCard>
  );
}

export function ZoomCalendarDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['zoom-meetings', true],
    queryFn: () => zoomService.getMeetings(true),
  });

  const meetings = data?.data?.meetings ?? [];

  return (
    <DashboardWidgetCard
      source="Zoom"
      sourceLogo={<IntegrationIcon provider="ZOOM" />}
      title="Zoom Calendar"
      deepLinkHref={ZOOM_MEETINGS_URL}
      deepLinkLabel="Open Zoom"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={6} />
      ) : (
        <ZoomMonthCalendar meetings={meetings} />
      )}
    </DashboardWidgetCard>
  );
}

export function ZoomMeetingsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['zoom-meetings', false],
    queryFn: () => zoomService.getMeetings(false),
  });

  const meetings = (data?.data?.meetings ?? []).filter((meeting) => {
    const end = new Date(meeting.start).getTime() + meeting.duration * 60 * 1000;
    return end >= Date.now() - 5 * 60 * 1000;
  });

  return (
    <DashboardWidgetCard
      source="Zoom"
      sourceLogo={<IntegrationIcon provider="ZOOM" />}
      title="Upcoming Zoom meetings"
      deepLinkHref={ZOOM_MEETINGS_URL}
      deepLinkLabel="Open Zoom"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No upcoming Zoom meetings"
          description="Schedule a Zoom meeting to see it here"
        />
      ) : (
        <ZoomMeetingList meetings={meetings} />
      )}
    </DashboardWidgetCard>
  );
}
