import { Hash, Lock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SlackChannel } from '@/services/slack.service';

interface SlackChannelListProps {
  channels: SlackChannel[];
  isLoading: boolean;
  selectedChannelId: string | null;
  onSelectChannel: (channel: SlackChannel) => void;
}

export function SlackChannelList({
  channels,
  isLoading,
  selectedChannelId,
  onSelectChannel,
}: SlackChannelListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-slate-500">Loading channels...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Channels</CardTitle>
        <CardDescription>Click a channel to view recent messages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {channels.length === 0 ? (
          <p className="text-sm text-slate-500">No channels found.</p>
        ) : (
          channels.map((channel) => {
            const isSelected = selectedChannelId === channel.id;

            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel(channel)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'border-brand-muted bg-brand-light/40'
                    : 'border-slate-200 bg-white hover:border-brand-muted hover:bg-slate-50'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {channel.isPrivate ? (
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <Hash className="h-4 w-4 shrink-0 text-brand" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">#{channel.name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="h-3 w-3" />
                      {channel.memberCount} members
                    </p>
                  </div>
                </div>
                {channel.isPrivate && <Badge variant="secondary">Private</Badge>}
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
