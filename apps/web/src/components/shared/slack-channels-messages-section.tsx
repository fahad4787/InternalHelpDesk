'use client';

import { IntegrationIcon } from '@/components/shared/integration-icon';
import { SlackMessenger } from '@/components/shared/slack-messenger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSlackMessenger } from '@/hooks/use-slack-messenger';

export function SlackChannelsMessagesSection() {
  const messenger = useSlackMessenger();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="widget-card-header pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <IntegrationIcon provider="SLACK" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Slack
            </p>
            <CardTitle className="text-base">Channels & messages</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[calc(100vh-18rem)] min-h-112 overflow-hidden border-t border-border-warm">
          <SlackMessenger {...messenger} />
        </div>
      </CardContent>
    </Card>
  );
}
