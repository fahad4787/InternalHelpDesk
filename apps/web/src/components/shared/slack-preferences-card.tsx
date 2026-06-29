'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SlackPreferences, slackService } from '@/services/slack.service';

interface SlackPreferencesCardProps {
  preferences: SlackPreferences;
  disabled?: boolean;
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-slate-200'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function SlackPreferencesCard({
  preferences: serverPreferences,
  disabled,
}: SlackPreferencesCardProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(serverPreferences);

  useEffect(() => {
    setPreferences(serverPreferences);
  }, [serverPreferences]);

  const mutation = useMutation({
    mutationFn: (next: SlackPreferences) => slackService.updatePreferences(next),
    onSuccess: (res) => {
      const next = res.data;
      setPreferences(next);
      queryClient.setQueryData(['slack-status'], (current: unknown) => {
        if (!current || typeof current !== 'object' || !('data' in current)) {
          return current;
        }
        return {
          ...current,
          data: {
            ...(current as { data: Record<string, unknown> }).data,
            preferences: next,
          },
        };
      });
      if (!next.showChannels && !next.showDirectMessages) {
        queryClient.removeQueries({ queryKey: ['slack-channels'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['slack-channels'] });
      }
      if (!next.showProfile) {
        queryClient.removeQueries({ queryKey: ['slack-profile'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['slack-profile'] });
      }
    },
    onError: () => {
      setPreferences(serverPreferences);
    },
  });

  const update = (key: keyof SlackPreferences, value: boolean) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    mutation.mutate(next);
  };

  const isPending = mutation.isPending || disabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Preferences</CardTitle>
        <CardDescription>
          Choose what to show on this page and your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ToggleRow
          label="Workspace profile"
          description="Show connected workspace and user details"
          checked={preferences.showProfile}
          disabled={isPending}
          onChange={(value) => update('showProfile', value)}
        />
        <ToggleRow
          label="Channels"
          description="Show your Slack workspace channels"
          checked={preferences.showChannels}
          disabled={isPending}
          onChange={(value) => update('showChannels', value)}
        />
        <ToggleRow
          label="Direct messages"
          description="Show your Slack direct and group messages"
          checked={preferences.showDirectMessages}
          disabled={isPending}
          onChange={(value) => update('showDirectMessages', value)}
        />
      </CardContent>
    </Card>
  );
}
