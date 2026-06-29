import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamsMessage } from '@/services/teams.service';

interface TeamsChannelMessagesProps {
  channelName: string;
  teamName: string;
  messages: TeamsMessage[];
  isLoading: boolean;
  error: string | null;
}

export function TeamsChannelMessages({
  channelName,
  teamName,
  messages,
  isLoading,
  error,
}: TeamsChannelMessagesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-brand" />
          {channelName}
        </CardTitle>
        <p className="text-sm text-slate-500">{teamName}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading messages...</p>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages in this channel yet.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">
                    {message.userName ?? 'Unknown user'}
                  </p>
                  <p className="shrink-0 text-xs text-slate-400">
                    {format(new Date(message.timestamp), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>
                <p className="text-sm whitespace-pre-wrap text-slate-700">{message.text}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
