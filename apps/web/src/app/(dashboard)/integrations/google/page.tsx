'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { GoogleCalendarConnectionCard } from '@/components/shared/google-calendar-connection-card';
import { GoogleChatSpacesMessagesSection } from '@/components/shared/google-chat-spaces-messages-section';
import { GooglePreferencesCard } from '@/components/shared/google-preferences-card';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { ToastContainer } from '@/components/shared/toast';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import { googleCalendarService } from '@/services/google-calendar.service';
import { useGoogleWidgets } from '@/hooks/use-google-widgets';

export default function GoogleIntegrationPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { status, statusLoading, isConnected, preferences } = useGoogleWidgets();

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['google-gmail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['google-chat-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['google-chat-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    }
    if (error) {
      setAuthError(decodeURIComponent(error));
    }
  }, [searchParams, queryClient]);

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
      queryClient.invalidateQueries({ queryKey: ['google-chat-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['google-chat-messages'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending =
    connectGoogleMutation.isPending || disconnectMutation.isPending;

  const connectError = connectGoogleMutation.error
    ? getErrorMessage(connectGoogleMutation.error)
    : null;

  return (
    <PageContainer
      title="Google"
      description="Calendar, Google Meet, Drive, Gmail, and Chat from your linked Google account"
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
        <ToastContainer />
        <GoogleCalendarConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={authError}
          connectError={connectError}
          onConnect={() => connectGoogleMutation.mutate()}
          onReconnect={() => connectGoogleMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <GooglePreferencesCard preferences={preferences} />}

        {isConnected && preferences.showGoogleChat && (
          <GoogleChatSpacesMessagesSection />
        )}

        {isConnected && <IntegrationWidgetsSection provider="GOOGLE_CALENDAR" />}
      </div>
    </PageContainer>
  );
}
