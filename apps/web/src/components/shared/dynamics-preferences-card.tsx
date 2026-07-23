'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DynamicsPreferences,
  dynamicsService,
} from '@/services/dynamics.service';

interface DynamicsPreferencesCardProps {
  preferences: DynamicsPreferences;
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

export function DynamicsPreferencesCard({
  preferences: serverPreferences,
  disabled,
}: DynamicsPreferencesCardProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(serverPreferences);

  useEffect(() => {
    setPreferences(serverPreferences);
  }, [serverPreferences]);

  const mutation = useMutation({
    mutationFn: (next: DynamicsPreferences) =>
      dynamicsService.updatePreferences(next),
    onSuccess: (res) => {
      const next = res.data;
      setPreferences(next);
      queryClient.setQueryData(['dynamics-status'], (current: unknown) => {
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
      if (!next.showContacts) {
        queryClient.removeQueries({ queryKey: ['dynamics-contacts'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['dynamics-contacts'] });
      }
      if (!next.showAccounts) {
        queryClient.removeQueries({ queryKey: ['dynamics-accounts'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['dynamics-accounts'] });
      }
      if (!next.showOpportunities) {
        queryClient.removeQueries({ queryKey: ['dynamics-opportunities'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['dynamics-opportunities'] });
      }
    },
    onError: () => {
      setPreferences(serverPreferences);
    },
  });

  const update = (key: keyof DynamicsPreferences, value: boolean) => {
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
          label="Contacts"
          description="Show recent contacts from Dynamics 365"
          checked={preferences.showContacts}
          disabled={isPending}
          onChange={(value) => update('showContacts', value)}
        />
        <ToggleRow
          label="Accounts"
          description="Show recent accounts from Dynamics 365"
          checked={preferences.showAccounts}
          disabled={isPending}
          onChange={(value) => update('showAccounts', value)}
        />
        <ToggleRow
          label="Opportunities"
          description="Show recent opportunities from Dynamics 365 Sales"
          checked={preferences.showOpportunities}
          disabled={isPending}
          onChange={(value) => update('showOpportunities', value)}
        />
      </CardContent>
    </Card>
  );
}
