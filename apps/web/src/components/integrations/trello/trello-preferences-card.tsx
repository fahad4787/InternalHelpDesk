'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrelloPreferences, trelloService } from '@/services/trello.service';

interface TrelloPreferencesCardProps {
  preferences: TrelloPreferences;
  disabled?: boolean;
}

export function TrelloPreferencesCard({
  preferences: serverPreferences,
  disabled,
}: TrelloPreferencesCardProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(serverPreferences);

  useEffect(() => {
    setPreferences(serverPreferences);
  }, [serverPreferences]);

  const mutation = useMutation({
    mutationFn: (next: TrelloPreferences) => trelloService.updatePreferences(next),
    onSuccess: (res) => {
      const next = res.data;
      setPreferences(next);
      queryClient.setQueryData(['trello-status'], (current: unknown) => {
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
      if (!next.showBoards) {
        queryClient.removeQueries({ queryKey: ['trello-boards'] });
        queryClient.removeQueries({ queryKey: ['trello-board'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['trello-boards'] });
      }
    },
    onError: () => {
      setPreferences(serverPreferences);
    },
  });

  const isPending = mutation.isPending || disabled;
  const checked = preferences.showBoards;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Preferences</CardTitle>
        <CardDescription>
          Choose what to show on this page and your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border-warm bg-white p-4">
          <div>
            <p className="font-medium text-ink">Boards</p>
            <p className="mt-0.5 text-sm text-muted">
              Show open boards you can access
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={isPending}
            onClick={() => {
              const next = { showBoards: !checked };
              setPreferences(next);
              mutation.mutate(next);
            }}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              checked ? 'bg-brand' : 'bg-border-warm'
            } ${isPending ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                checked ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
