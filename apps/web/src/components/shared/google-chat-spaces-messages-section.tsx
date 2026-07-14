'use client';

import { IntegrationIcon } from '@/components/shared/integration-icon';
import { GoogleChatMessenger } from '@/components/shared/google-chat-messenger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleChatMessenger } from '@/hooks/use-google-chat-messenger';

export function GoogleChatSpacesMessagesSection() {
  const messenger = useGoogleChatMessenger();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="widget-card-header pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <IntegrationIcon provider="GOOGLE_CALENDAR" />
          <div className="min-w-0">
            <CardTitle className="text-base">Google Chat</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[calc(100vh-18rem)] min-h-112 overflow-hidden border-t border-border-warm">
          <GoogleChatMessenger {...messenger} />
        </div>
      </CardContent>
    </Card>
  );
}
