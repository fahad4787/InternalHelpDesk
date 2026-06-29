'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Video } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { EmptyState } from '@/components/shared/empty-state';
import { ZoomMeetingList } from '@/components/shared/zoom-meeting-list';
import { ZoomConnectionCard } from '@/components/shared/zoom-connection-card';
import { ZoomPreferencesCard } from '@/components/shared/zoom-preferences-card';
import { ZoomProfileCard } from '@/components/shared/zoom-profile-card';
import { ZoomMonthCalendar } from '@/components/shared/zoom-month-calendar';
import { ScheduleZoomMeetingModal } from '@/components/shared/schedule-zoom-meeting-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_ZOOM_PREFERENCES,
  zoomService,
} from '@/services/zoom.service';

export default function ZoomIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['zoom-status'],
    queryFn: () => zoomService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_ZOOM_PREFERENCES;
  const showMeetings =
    isConnected && preferences.showUpcomingMeetings === true;
  const showProfile = isConnected && preferences.showProfile === true;
  const showCalendar =
    isConnected && preferences.showCalendarView === true;
  const shouldLoadMeetings = showMeetings || showCalendar;

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['zoom-profile'],
    queryFn: () => zoomService.getProfile(),
    enabled: showProfile,
  });

  const profile = profileData?.data?.profile ?? null;

  const {
    data: meetingsData,
    isLoading: meetingsLoading,
    error: meetingsError,
    refetch: refetchMeetings,
    isFetching: meetingsFetching,
  } = useQuery({
    queryKey: ['zoom-meetings', showCalendar],
    queryFn: () => zoomService.getMeetings(showCalendar),
    enabled: shouldLoadMeetings,
  });

  const meetings = meetingsData?.data?.meetings ?? [];
  const upcomingMeetings = meetings.filter((meeting) => {
    const end =
      new Date(meeting.start).getTime() + meeting.duration * 60 * 1000;
    return end >= Date.now() - 5 * 60 * 1000;
  });
  const meetingsLoadError = meetingsError
    ? getErrorMessage(meetingsError)
    : null;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['zoom-status'] });
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/zoom', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/zoom', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMockMutation = useMutation({
    mutationFn: () => zoomService.connectMock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-status'] });
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const connectZoomMutation = useMutation({
    mutationFn: () => zoomService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => zoomService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-status'] });
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending =
    connectMockMutation.isPending ||
    connectZoomMutation.isPending ||
    disconnectMutation.isPending;

  const handleConnect = () => {
    if (status?.mockMode) {
      connectMockMutation.mutate();
    } else {
      connectZoomMutation.mutate();
    }
  };

  const connectError =
    connectMockMutation.error || connectZoomMutation.error
      ? getErrorMessage(connectMockMutation.error || connectZoomMutation.error)
      : null;

  return (
    <PageContainer
      title="Zoom"
      description="Profile, calendar, and meetings from your linked Zoom account"
      actions={
        <div className="flex items-center gap-2">
          {isConnected && (
            <Button size="sm" onClick={() => setScheduleOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule New Meeting
            </Button>
          )}
          <Link href="/integrations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      }
    >
      <ScheduleZoomMeetingModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
      <div className="space-y-6">
        <ZoomConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={handleConnect}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <ZoomPreferencesCard preferences={preferences} />}

        {showProfile && (
          profileLoading ? (
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Loading Zoom profile...</p>
              </CardContent>
            </Card>
          ) : profile ? (
            <ZoomProfileCard profile={profile} />
          ) : null
        )}

        {showMeetings && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Upcoming Zoom Meetings</CardTitle>
                  <CardDescription className="mt-1">
                    Scheduled meetings from your Zoom account
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {upcomingMeetings.length > 0 && (
                    <Badge variant="success" className="w-fit">
                      {upcomingMeetings.length} meeting
                      {upcomingMeetings.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchMeetings()}
                    disabled={meetingsFetching}
                  >
                    {meetingsFetching ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {meetingsLoadError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {meetingsLoadError.includes('scope') ||
                  meetingsLoadError.includes('reconnect')
                    ? meetingsLoadError
                    : `${meetingsLoadError} Disconnect and reconnect your Zoom account to refresh permissions.`}
                </div>
              )}
              {meetingsLoading ? (
                <p className="text-sm text-slate-500">Loading meetings...</p>
              ) : upcomingMeetings.length === 0 ? (
                <EmptyState
                  icon={Video}
                  title="No upcoming Zoom meetings"
                  description="Schedule a Zoom meeting to see it here"
                  actionLabel="Schedule New Meeting"
                  onAction={() => setScheduleOpen(true)}
                />
              ) : (
                <ZoomMeetingList meetings={upcomingMeetings} />
              )}
            </CardContent>
          </Card>
        )}

        {showCalendar && (
          meetingsLoading ? (
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Loading calendar...</p>
              </CardContent>
            </Card>
          ) : (
            <ZoomMonthCalendar
              meetings={meetings}
              email={status?.zoomEmail ?? profile?.email}
            />
          )
        )}
      </div>
    </PageContainer>
  );
}
