'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { ZoomConnectionCard } from '@/components/shared/zoom-connection-card';
import { ZoomPreferencesCard } from '@/components/shared/zoom-preferences-card';
import { ScheduleZoomMeetingModal } from '@/components/shared/schedule-zoom-meeting-modal';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { Button } from '@/components/ui/button';
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
    connectZoomMutation.isPending || disconnectMutation.isPending;

  const connectError = connectZoomMutation.error
    ? getErrorMessage(connectZoomMutation.error)
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
          onConnect={() => connectZoomMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <ZoomPreferencesCard preferences={preferences} />}

        {isConnected && <IntegrationWidgetsSection provider="ZOOM" />}
      </div>
    </PageContainer>
  );
}
