'use client';

import { CalendarDays, FolderOpen, Mail, Video } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/integrations/common/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { MeetEventList } from '@/components/integrations/google/meet-event-list';
import { GoogleChatMessenger } from '@/components/integrations/google/google-chat-messenger';
import { GoogleDriveList } from '@/components/integrations/google/google-drive-list';
import { GoogleGmailList } from '@/components/integrations/google/google-gmail-list';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import { useGoogleChatMessenger } from '@/hooks/use-google-chat-messenger';
import { useGoogleWidgets } from '@/hooks/use-google-widgets';
import { DashboardWidgetCard } from '../dashboard-widget-card';

function buildGoogleCalendarEmbedUrl(email: string): string {
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
}

export function GoogleMeetDashboardWidget() {
  const { events, eventsLoading } = useGoogleWidgets({ features: ['meet'] });

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
  // Prefer dashboard-status email so we never blank the card waiting on a second status fetch.
  const { statuses } = useDashboardVisibleWidgets();
  const email = statuses.google?.googleEmail?.trim() || null;
  const embedUrl = email ? buildGoogleCalendarEmbedUrl(email) : null;

  return (
    <DashboardWidgetCard
      source="Google"
      sourceLogo={<IntegrationIcon provider="GOOGLE_CALENDAR" />}
      title="Google Calendar"
      deepLinkHref="https://calendar.google.com/calendar/u/0/r/week"
      deepLinkLabel="Open Calendar"
      fillContent
    >
      {embedUrl && email ? (
        <div className="h-[22rem] overflow-hidden rounded-xl border border-border-warm bg-white">
          <iframe
            title={`Google Calendar for ${email}`}
            src={embedUrl}
            className="h-full w-full border-0"
            loading="lazy"
          />
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Calendar unavailable"
          description="Reconnect Google so we can load your calendar email."
        />
      )}
    </DashboardWidgetCard>
  );
}

export function GoogleDriveDashboardWidget() {
  const { files, driveLoading } = useGoogleWidgets({ features: ['drive'] });

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
  const { messages, gmailLoading } = useGoogleWidgets({ features: ['gmail'] });

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

export function GoogleChatDashboardWidget({
  className,
}: {
  className?: string;
}) {
  const messenger = useGoogleChatMessenger();

  return (
    <DashboardWidgetCard
      source="Google"
      sourceLogo={<IntegrationIcon provider="GOOGLE_CALENDAR" />}
      title="Google Chat"
      deepLinkHref="/integrations/google"
      deepLinkLabel="Open Google"
      fillContent
      className={className}
    >
      <div className="h-[280px] overflow-hidden rounded-xl border border-border-warm">
        <GoogleChatMessenger {...messenger} />
      </div>
    </DashboardWidgetCard>
  );
}
