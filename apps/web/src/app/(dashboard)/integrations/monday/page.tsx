'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { MondayBoardsSection } from '@/components/shared/monday-boards-section';
import { MondayConnectionCard } from '@/components/shared/monday-connection-card';
import { MondayPreferencesCard } from '@/components/shared/monday-preferences-card';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_MONDAY_PREFERENCES,
  mondayService,
} from '@/services/monday.service';

export default function MondayIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['monday-status'],
    queryFn: () => mondayService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_MONDAY_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const board = searchParams.get('board');

    if (board) {
      setSelectedBoardId(board);
    }

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['monday-status'] });
      queryClient.invalidateQueries({ queryKey: ['monday-boards'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/monday', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/monday', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => mondayService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => mondayService.disconnect(),
    onSuccess: () => {
      setSelectedBoardId(null);
      queryClient.invalidateQueries({ queryKey: ['monday-status'] });
      queryClient.removeQueries({ queryKey: ['monday-boards'] });
      queryClient.removeQueries({ queryKey: ['monday-board'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending = connectMutation.isPending || disconnectMutation.isPending;
  const connectError = connectMutation.error
    ? getErrorMessage(connectMutation.error)
    : null;

  const handleSelectBoard = (boardId: string | null) => {
    setSelectedBoardId(boardId);
    if (boardId) {
      router.replace(`/integrations/monday?board=${boardId}`, { scroll: false });
    } else {
      router.replace('/integrations/monday', { scroll: false });
    }
  };

  return (
    <PageContainer
      title="Monday.com"
      description="Boards and items from your linked Monday.com account"
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
        <MondayConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending || statusLoading}
          isConnecting={connectMutation.isPending}
          isDisconnecting={disconnectMutation.isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <MondayPreferencesCard preferences={preferences} />}

        {isConnected && preferences.showBoards && (
          <MondayBoardsSection
            selectedBoardId={selectedBoardId}
            onSelectBoard={handleSelectBoard}
          />
        )}
      </div>
    </PageContainer>
  );
}
