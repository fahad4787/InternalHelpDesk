'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HubSpotPreferences, hubspotService } from '@/services/hubspot.service';

interface HubSpotPreferencesCardProps {
  preferences: HubSpotPreferences;
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

export function HubSpotPreferencesCard({
  preferences: serverPreferences,
  disabled,
}: HubSpotPreferencesCardProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(serverPreferences);

  useEffect(() => {
    setPreferences(serverPreferences);
  }, [serverPreferences]);

  const mutation = useMutation({
    mutationFn: (next: HubSpotPreferences) =>
      hubspotService.updatePreferences(next),
    onSuccess: (res) => {
      const next = res.data;
      setPreferences(next);
      queryClient.setQueryData(['hubspot-status'], (current: unknown) => {
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
        queryClient.removeQueries({ queryKey: ['hubspot-contacts'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['hubspot-contacts'] });
      }
      if (!next.showDeals) {
        queryClient.removeQueries({ queryKey: ['hubspot-deals'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['hubspot-deals'] });
      }
      if (!next.showTickets) {
        queryClient.removeQueries({ queryKey: ['hubspot-tickets'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['hubspot-tickets'] });
      }
    },
    onError: () => {
      setPreferences(serverPreferences);
    },
  });

  const update = (key: keyof HubSpotPreferences, value: boolean) => {
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
          description="Show recent contacts from your HubSpot CRM"
          checked={preferences.showContacts}
          disabled={isPending}
          onChange={(value) => update('showContacts', value)}
        />
        <ToggleRow
          label="Deals"
          description="Show recent deals from your HubSpot CRM"
          checked={preferences.showDeals}
          disabled={isPending}
          onChange={(value) => update('showDeals', value)}
        />
        <ToggleRow
          label="Tickets"
          description="Show recent support tickets from your HubSpot Service Hub"
          checked={preferences.showTickets}
          disabled={isPending}
          onChange={(value) => update('showTickets', value)}
        />
      </CardContent>
    </Card>
  );
}
