'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar, FolderOpen, Mail } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { EmptyState } from '@/components/shared/empty-state';
import { MeetEventList } from '@/components/shared/meet-event-list';
import { GoogleCalendarEmbed } from '@/components/shared/google-calendar-embed';
import { GoogleCalendarConnectionCard } from '@/components/shared/google-calendar-connection-card';
import { GooglePreferencesCard } from '@/components/shared/google-preferences-card';
import { GoogleDriveList, GoToDriveButton } from '@/components/shared/google-drive-list';
import { GoogleGmailList, GoToGmailButton } from '@/components/shared/google-gmail-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_GOOGLE_PREFERENCES,
  googleCalendarService,
} from '@/services/google-calendar.service';

export default function GoogleIntegrationPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: () => googleCalendarService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_GOOGLE_PREFERENCES;
  const showMeet = isConnected && preferences.showUpcomingMeet === true;
  const showDrive = isConnected && preferences.showGoogleDrive === true;
  const showGmail = isConnected && preferences.showGmail === true;
  const showCalendarEmbed =
    isConnected && preferences.showCalendarEmbed === true && !!status?.googleEmail;

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['google-calendar-events'],
    queryFn: () => googleCalendarService.getEvents(),
    enabled: showMeet,
  });

  const { data: driveData, isLoading: driveLoading } = useQuery({
    queryKey: ['google-drive-files'],
    queryFn: () => googleCalendarService.getDriveFiles(),
    enabled: showDrive,
  });

  const { data: gmailData, isLoading: gmailLoading } = useQuery({
    queryKey: ['google-gmail-messages'],
    queryFn: () => googleCalendarService.getGmailMessages(),
    enabled: showGmail,
  });

  const events = eventsData?.data?.events ?? [];
  const files = driveData?.data?.files ?? [];
  const messages = gmailData?.data?.messages ?? [];

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['google-gmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    }
    if (error) {
      setAuthError(decodeURIComponent(error));
    }
  }, [searchParams, queryClient]);

  const connectMockMutation = useMutation({
    mutationFn: () => googleCalendarService.connectMock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['google-gmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const connectGoogleMutation = useMutation({
    mutationFn: () => googleCalendarService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => googleCalendarService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['google-gmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending =
    connectMockMutation.isPending ||
    connectGoogleMutation.isPending ||
    disconnectMutation.isPending;

  const handleConnect = () => {
    if (status?.mockMode) {
      connectMockMutation.mutate();
    } else {
      connectGoogleMutation.mutate();
    }
  };

  const connectError =
    connectMockMutation.error || connectGoogleMutation.error
      ? getErrorMessage(connectMockMutation.error || connectGoogleMutation.error)
      : null;

  return (
    <PageContainer
      title="Google"
      description="Calendar, Google Meet, Drive, and Gmail from your linked Google account"
      actions={
        <Link href="/integrations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <GoogleCalendarConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={authError}
          connectError={connectError}
          onConnect={handleConnect}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && (
          <GooglePreferencesCard preferences={preferences} />
        )}

        {showMeet && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Upcoming Google Meet</CardTitle>
                  <CardDescription className="mt-1">
                    Video meetings with a Google Meet link from your calendar
                  </CardDescription>
                </div>
                {events.length > 0 && (
                  <Badge variant="success" className="w-fit">
                    {events.length} meeting{events.length === 1 ? '' : 's'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {eventsLoading ? (
                <p className="text-sm text-slate-500">Loading meetings...</p>
              ) : events.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming Google Meet meetings"
                  description="Only calendar events with a Google Meet link are shown"
                />
              ) : (
                <MeetEventList events={events} />
              )}
            </CardContent>
          </Card>
        )}

        {showDrive && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Google Drive</CardTitle>
                  <CardDescription className="mt-1">
                    Last 10 files from your My Drive
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {files.length > 0 && (
                    <Badge variant="success" className="w-fit">
                      {files.length} file{files.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                  <GoToDriveButton />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {driveLoading ? (
                <p className="text-sm text-slate-500">Loading files...</p>
              ) : files.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No files found"
                  description="Your My Drive folder has no files to show"
                />
              ) : (
                <GoogleDriveList files={files} />
              )}
            </CardContent>
          </Card>
        )}

        {showGmail && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Gmail</CardTitle>
                  <CardDescription className="mt-1">
                    Last 10 emails from your inbox
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <Badge variant="success" className="w-fit">
                      {messages.length} email{messages.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                  <GoToGmailButton />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {gmailLoading ? (
                <p className="text-sm text-slate-500">Loading emails...</p>
              ) : messages.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No emails found"
                  description="Your inbox has no emails to show"
                />
              ) : (
                <GoogleGmailList messages={messages} />
              )}
            </CardContent>
          </Card>
        )}

        {showCalendarEmbed && status?.googleEmail && (
          <GoogleCalendarEmbed
            email={status.googleEmail}
            description={`Weekly view for ${status.googleEmail}`}
          />
        )}
      </div>
    </PageContainer>
  );
}
