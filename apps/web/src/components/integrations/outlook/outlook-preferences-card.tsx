'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  OutlookPreferences,
  outlookService,
} from '@/services/outlook.service';

interface OutlookPreferencesCardProps {
  preferences: OutlookPreferences;
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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border-warm bg-white p-4">
      <div>
        <p className="font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-border-warm'
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

export function OutlookPreferencesCard({
  preferences: serverPreferences,
  disabled,
}: OutlookPreferencesCardProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(serverPreferences);

  useEffect(() => {
    setPreferences(serverPreferences);
  }, [serverPreferences]);

  const mutation = useMutation({
    mutationFn: (next: OutlookPreferences) => outlookService.updatePreferences(next),
    onSuccess: (res) => {
      const next = res.data;
      setPreferences(next);
      queryClient.setQueryData(['outlook-status'], (current: unknown) => {
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
      if (!next.showInbox) {
        queryClient.removeQueries({ queryKey: ['outlook-messages'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['outlook-messages'] });
      }
      if (!next.showCalendar) {
        queryClient.removeQueries({ queryKey: ['outlook-events'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['outlook-events'] });
      }
    },
    onError: () => {
      setPreferences(serverPreferences);
    },
  });

  const update = (key: keyof OutlookPreferences, value: boolean) => {
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
          label="Outlook Calendar"
          description="Show upcoming calendar events"
          checked={preferences.showCalendar}
          disabled={isPending}
          onChange={(value) => update('showCalendar', value)}
        />
        <ToggleRow
          label="Inbox"
          description="Show the last 10 emails from your inbox"
          checked={preferences.showInbox}
          disabled={isPending}
          onChange={(value) => update('showInbox', value)}
        />
      </CardContent>
    </Card>
  );
}
