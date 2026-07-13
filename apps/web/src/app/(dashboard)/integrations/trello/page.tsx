'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { TrelloBoardsSection } from '@/components/shared/trello-boards-section';
import { TrelloConnectionCard } from '@/components/shared/trello-connection-card';
import { TrelloPreferencesCard } from '@/components/shared/trello-preferences-card';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_TRELLO_PREFERENCES,
  trelloService,
} from '@/services/trello.service';

function readTokenFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get('token');
}

export default function TrelloIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const connectingTokenRef = useRef(false);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['trello-status'],
    queryFn: () => trelloService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_TRELLO_PREFERENCES;

  const connectMutation = useMutation({
    mutationFn: (payload: { token: string; state: string }) =>
      trelloService.connect(payload),
    onSuccess: () => {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['trello-status'] });
      queryClient.invalidateQueries({ queryKey: ['trello-boards'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/trello', { scroll: false });
    },
    onError: (error) => {
      setAuthError(getErrorMessage(error));
      router.replace('/integrations/trello', { scroll: false });
    },
    onSettled: () => {
      connectingTokenRef.current = false;
    },
  });

  const connectTrelloMutation = useMutation({
    mutationFn: () => trelloService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => trelloService.disconnect(),
    onSuccess: () => {
      setSelectedBoardId(null);
      queryClient.invalidateQueries({ queryKey: ['trello-status'] });
      queryClient.removeQueries({ queryKey: ['trello-boards'] });
      queryClient.removeQueries({ queryKey: ['trello-board'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  useEffect(() => {
    const boardId = searchParams.get('board');
    if (boardId && !searchParams.get('state') && !searchParams.get('error')) {
      setSelectedBoardId(boardId);
    }
  }, [searchParams]);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/trello', { scroll: false });
      return;
    }

    const token = readTokenFromHash();
    const state = searchParams.get('state');

    if (!token && !state) return;

    if (!token || !state) {
      setAuthError(!token ? 'missing_token' : 'missing_state');
      router.replace('/integrations/trello', { scroll: false });
      return;
    }

    if (connectingTokenRef.current) return;
    connectingTokenRef.current = true;
    connectMutation.mutate({ token, state });
  }, [searchParams, router, connectMutation]);

  const displayAuthError = isConnected ? null : authError;

  const isPending =
    connectMutation.isPending ||
    connectTrelloMutation.isPending ||
    disconnectMutation.isPending;

  const connectError =
    connectTrelloMutation.error != null
      ? getErrorMessage(connectTrelloMutation.error)
      : null;

  const handleSelectBoard = (boardId: string | null) => {
    setSelectedBoardId(boardId);
    if (boardId) {
      router.replace(`/integrations/trello?board=${boardId}`, { scroll: false });
    } else {
      router.replace('/integrations/trello', { scroll: false });
    }
  };

  return (
    <PageContainer
      title="Trello"
      description="Boards and cards from your linked Trello account"
      actions={
        <Link href="/integrations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <TrelloConnectionCard
          status={status}
          isLoading={statusLoading || connectMutation.isPending}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectTrelloMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <TrelloPreferencesCard preferences={preferences} />}

        {isConnected && preferences.showBoards && (
          <TrelloBoardsSection
            selectedBoardId={selectedBoardId}
            onSelectBoard={handleSelectBoard}
          />
        )}
      </div>
    </PageContainer>
  );
}
