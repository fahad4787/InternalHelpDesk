'use client';

import { FolderOpen, Mail, Video } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { MeetEventList } from '@/components/shared/meet-event-list';
import { GoogleDriveList } from '@/components/shared/google-drive-list';
import { GoogleGmailList } from '@/components/shared/google-gmail-list';
import { useGoogleWidgets } from '@/hooks/use-google-widgets';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function GoogleMeetDashboardWidget() {
  const { events, eventsLoading } = useGoogleWidgets();

  return (
    <DashboardWidgetCard
      source="Google"
      sourceLogo={<IntegrationIcon provider="GOOGLE_MEET" />}
      title="Upcoming Google Meet"
      deepLinkHref="/integrations/google"
      deepLinkLabel="Open Google"
    >
      {eventsLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No upcoming Google Meet meetings"
          description="Only calendar events with a Google Meet link are shown"
        />
      ) : (
        <MeetEventList events={events} />
      )}
    </DashboardWidgetCard>
  );
}

export function GoogleCalendarEmbedDashboardWidget() {
  const { status, showCalendarEmbed } = useGoogleWidgets();
  const email = status?.googleEmail;

  if (!showCalendarEmbed || !email) return null;

  const embedUrl = (() => {
    const params = new URLSearchParams({
      src: email,
      ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      mode: 'WEEK',
      showTitle: '0',
      showNav: '1',
      showDate: '1',
      showPrint: '0',
      showTabs: '1',
      showCalendars: '0',
      bgcolor: '#ffffff',
      color: '#006600',
    });
    return `https://calendar.google.com/calendar/embed?${params.toString()}`;
  })();

  return (
    <DashboardWidgetCard
      source="Google"
      sourceLogo={<IntegrationIcon provider="GOOGLE_CALENDAR" />}
      title="Google Calendar"
      deepLinkHref="https://calendar.google.com/calendar/u/0/r/week"
      deepLinkLabel="Open Calendar"
      fillContent
    >
      <div className="h-full overflow-hidden rounded-xl border border-border-warm bg-white">
        <iframe
          title={`Google Calendar for ${email}`}
          src={embedUrl}
          className="h-full min-h-[240px] w-full border-0"
          loading="lazy"
        />
      </div>
    </DashboardWidgetCard>
  );
}

export function GoogleDriveDashboardWidget() {
  const { files, driveLoading } = useGoogleWidgets();

  return (
    <DashboardWidgetCard
      source="Google"
      sourceLogo={<IntegrationIcon provider="GOOGLE_DRIVE" />}
      title="Google Drive"
      deepLinkHref="https://drive.google.com"
      deepLinkLabel="Open Drive"
    >
      {driveLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No files found"
          description="Your My Drive folder has no files to show"
        />
      ) : (
        <GoogleDriveList files={files} />
      )}
    </DashboardWidgetCard>
  );
}

export function GoogleGmailDashboardWidget() {
  const { messages, gmailLoading } = useGoogleWidgets();

  return (
    <DashboardWidgetCard
      source="Google"
      sourceLogo={<IntegrationIcon provider="GMAIL" />}
      title="Gmail"
      deepLinkHref="https://mail.google.com"
      deepLinkLabel="Open Gmail"
    >
      {gmailLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No emails found"
          description="Your inbox has no emails to show"
        />
      ) : (
        <GoogleGmailList messages={messages} />
      )}
    </DashboardWidgetCard>
  );
}
