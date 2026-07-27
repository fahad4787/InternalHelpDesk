'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ZohoCrmPreferences,
  zohoCrmService,
} from '@/services/zoho-crm.service';

interface ZohoCrmPreferencesCardProps {
  preferences: ZohoCrmPreferences;
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

export function ZohoCrmPreferencesCard({
  preferences: serverPreferences,
  disabled,
}: ZohoCrmPreferencesCardProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(serverPreferences);

  useEffect(() => {
    setPreferences(serverPreferences);
  }, [serverPreferences]);

  const mutation = useMutation({
    mutationFn: (next: ZohoCrmPreferences) =>
      zohoCrmService.updatePreferences(next),
    onSuccess: (res) => {
      const next = res.data;
      setPreferences(next);
      queryClient.setQueryData(['zoho-crm-status'], (current: unknown) => {
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
        queryClient.removeQueries({ queryKey: ['zoho-crm-contacts'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['zoho-crm-contacts'] });
      }
      if (!next.showDeals) {
        queryClient.removeQueries({ queryKey: ['zoho-crm-deals'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['zoho-crm-deals'] });
      }
      if (!next.showLeads) {
        queryClient.removeQueries({ queryKey: ['zoho-crm-leads'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['zoho-crm-leads'] });
      }
    },
    onError: () => {
      setPreferences(serverPreferences);
    },
  });

  const update = (key: keyof ZohoCrmPreferences, value: boolean) => {
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
          description="Show recent contacts from Zoho CRM"
          checked={preferences.showContacts}
          disabled={isPending}
          onChange={(value) => update('showContacts', value)}
        />
        <ToggleRow
          label="Deals"
          description="Show recent deals from Zoho CRM"
          checked={preferences.showDeals}
          disabled={isPending}
          onChange={(value) => update('showDeals', value)}
        />
        <ToggleRow
          label="Leads"
          description="Show recent leads from Zoho CRM"
          checked={preferences.showLeads}
          disabled={isPending}
          onChange={(value) => update('showLeads', value)}
        />
      </CardContent>
    </Card>
  );
}
