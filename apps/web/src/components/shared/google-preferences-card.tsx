'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GooglePreferences,
  googleCalendarService,
} from '@/services/google-calendar.service';

interface GooglePreferencesCardProps {
  preferences: GooglePreferences;
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

export function GooglePreferencesCard({
  preferences: serverPreferences,
  disabled,
}: GooglePreferencesCardProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(serverPreferences);

  useEffect(() => {
    setPreferences(serverPreferences);
  }, [serverPreferences]);

  const mutation = useMutation({
    mutationFn: (next: GooglePreferences) =>
      googleCalendarService.updatePreferences(next),
    onSuccess: (res) => {
      const next = res.data;
      setPreferences(next);
      queryClient.setQueryData(['google-calendar-status'], (current: unknown) => {
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
      if (!next.showUpcomingMeet) {
        queryClient.removeQueries({ queryKey: ['google-calendar-events'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      }
      if (!next.showGoogleDrive) {
        queryClient.removeQueries({ queryKey: ['google-drive-files'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
      }
      if (!next.showGmail) {
        queryClient.removeQueries({ queryKey: ['google-gmail-messages'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['google-gmail-messages'] });
      }
    },
    onError: () => {
      setPreferences(serverPreferences);
    },
  });

  const update = (key: keyof GooglePreferences, value: boolean) => {
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
          label="Upcoming Google Meet"
          description="Show video meetings from your calendar"
          checked={preferences.showUpcomingMeet}
          disabled={isPending}
          onChange={(value) => update('showUpcomingMeet', value)}
        />
        <ToggleRow
          label="Google Calendar"
          description="Show the weekly calendar embed"
          checked={preferences.showCalendarEmbed}
          disabled={isPending}
          onChange={(value) => update('showCalendarEmbed', value)}
        />
        <ToggleRow
          label="Google Drive"
          description="Show recent files from My Drive"
          checked={preferences.showGoogleDrive}
          disabled={isPending}
          onChange={(value) => update('showGoogleDrive', value)}
        />
        <ToggleRow
          label="Gmail"
          description="Show your last 10 inbox emails"
          checked={preferences.showGmail}
          disabled={isPending}
          onChange={(value) => update('showGmail', value)}
        />
      </CardContent>
    </Card>
  );
}
