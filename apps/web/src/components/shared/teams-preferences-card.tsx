'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TeamsPreferences,
  teamsService,
} from '@/services/teams.service';

interface TeamsPreferencesCardProps {
  preferences: TeamsPreferences;
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

export function TeamsPreferencesCard({
  preferences: serverPreferences,
  disabled,
}: TeamsPreferencesCardProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(serverPreferences);

  useEffect(() => {
    setPreferences(serverPreferences);
  }, [serverPreferences]);

  const mutation = useMutation({
    mutationFn: (next: TeamsPreferences) => teamsService.updatePreferences(next),
    onSuccess: (res) => {
      const next = res.data;
      setPreferences(next);
      queryClient.setQueryData(['teams-status'], (current: unknown) => {
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
      if (!next.showTeams) {
        queryClient.removeQueries({ queryKey: ['teams-joined'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['teams-joined'] });
      }
      if (!next.showChats) {
        queryClient.removeQueries({ queryKey: ['teams-chats'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['teams-chats'] });
      }
      if (!next.showProfile) {
        queryClient.removeQueries({ queryKey: ['teams-profile'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['teams-profile'] });
      }
    },
    onError: () => {
      setPreferences(serverPreferences);
    },
  });

  const update = (key: keyof TeamsPreferences, value: boolean) => {
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
          label="Teams profile"
          description="Show connected account name and email"
          checked={preferences.showProfile}
          disabled={isPending}
          onChange={(value) => update('showProfile', value)}
        />
        <ToggleRow
          label="Joined teams"
          description="Show teams you belong to"
          checked={preferences.showTeams}
          disabled={isPending}
          onChange={(value) => update('showTeams', value)}
        />
        <ToggleRow
          label="Recent chats"
          description="Show your recent Teams chats"
          checked={preferences.showChats}
          disabled={isPending}
          onChange={(value) => update('showChats', value)}
        />
      </CardContent>
    </Card>
  );
}
