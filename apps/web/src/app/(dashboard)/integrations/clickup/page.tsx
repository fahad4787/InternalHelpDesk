'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { ClickUpListsSection } from '@/components/shared/clickup-lists-section';
import { ClickUpConnectionCard } from '@/components/shared/clickup-connection-card';
import { ClickUpPreferencesCard } from '@/components/shared/clickup-preferences-card';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_CLICKUP_PREFERENCES,
  clickupService,
} from '@/services/clickup.service';

export default function ClickUpIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['clickup-status'],
    queryFn: () => clickupService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_CLICKUP_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const list = searchParams.get('list');

    if (list) {
      setSelectedListId(list);
    }

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['clickup-status'] });
      queryClient.invalidateQueries({ queryKey: ['clickup-lists'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/clickup', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/clickup', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: () => clickupService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => clickupService.disconnect(),
    onSuccess: () => {
      setSelectedListId(null);
      queryClient.invalidateQueries({ queryKey: ['clickup-status'] });
      queryClient.removeQueries({ queryKey: ['clickup-lists'] });
      queryClient.removeQueries({ queryKey: ['clickup-list'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending = connectMutation.isPending || disconnectMutation.isPending;
  const connectError = connectMutation.error
    ? getErrorMessage(connectMutation.error)
    : null;

  const handleSelectList = (listId: string | null) => {
    setSelectedListId(listId);
    if (listId) {
      router.replace(`/integrations/clickup?list=${listId}`, { scroll: false });
    } else {
      router.replace('/integrations/clickup', { scroll: false });
    }
  };

  return (
    <PageContainer
      title="ClickUp"
      description="Lists and tasks from your linked ClickUp account"
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
        <ClickUpConnectionCard
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

        {isConnected && <ClickUpPreferencesCard preferences={preferences} />}

        {isConnected && preferences.showLists && (
          <ClickUpListsSection
            selectedListId={selectedListId}
            onSelectList={handleSelectList}
          />
        )}
      </div>
    </PageContainer>
  );
}
