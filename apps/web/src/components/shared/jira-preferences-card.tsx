'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JiraPreferences, jiraService } from '@/services/jira.service';

interface JiraPreferencesCardProps {
  preferences: JiraPreferences;
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

export function JiraPreferencesCard({
  preferences: serverPreferences,
  disabled,
}: JiraPreferencesCardProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(serverPreferences);

  useEffect(() => {
    setPreferences(serverPreferences);
  }, [serverPreferences]);

  const mutation = useMutation({
    mutationFn: (next: JiraPreferences) => jiraService.updatePreferences(next),
    onSuccess: (res) => {
      const next = res.data;
      setPreferences(next);
      queryClient.setQueryData(['jira-status'], (current: unknown) => {
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
      if (!next.showAssignedIssues) {
        queryClient.removeQueries({ queryKey: ['jira-issues', 'assigned'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['jira-issues', 'assigned'] });
      }
      if (!next.showReportedIssues) {
        queryClient.removeQueries({ queryKey: ['jira-issues', 'reported'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['jira-issues', 'reported'] });
      }
      if (!next.showProjects) {
        queryClient.removeQueries({ queryKey: ['jira-projects'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['jira-projects'] });
      }
      if (!next.showProfile) {
        queryClient.removeQueries({ queryKey: ['jira-profile'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['jira-profile'] });
      }
    },
    onError: () => {
      setPreferences(serverPreferences);
    },
  });

  const update = (key: keyof JiraPreferences, value: boolean) => {
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
          label="Jira Profile"
          description="Show account name, email, and site"
          checked={preferences.showProfile}
          disabled={isPending}
          onChange={(value) => update('showProfile', value)}
        />
        <ToggleRow
          label="Assigned issues"
          description="Show issues assigned to you"
          checked={preferences.showAssignedIssues}
          disabled={isPending}
          onChange={(value) => update('showAssignedIssues', value)}
        />
        <ToggleRow
          label="Reported issues"
          description="Show issues you created"
          checked={preferences.showReportedIssues}
          disabled={isPending}
          onChange={(value) => update('showReportedIssues', value)}
        />
        <ToggleRow
          label="Projects"
          description="Show Jira projects you can access"
          checked={preferences.showProjects}
          disabled={isPending}
          onChange={(value) => update('showProjects', value)}
        />
      </CardContent>
    </Card>
  );
}
