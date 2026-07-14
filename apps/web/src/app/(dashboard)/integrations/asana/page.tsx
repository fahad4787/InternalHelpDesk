'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { AsanaProjectsSection } from '@/components/shared/asana-projects-section';
import { AsanaConnectionCard } from '@/components/shared/asana-connection-card';
import { AsanaPreferencesCard } from '@/components/shared/asana-preferences-card';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_ASANA_PREFERENCES,
  asanaService,
} from '@/services/asana.service';

export default function AsanaIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedProjectGid, setSelectedProjectGid] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['asana-status'],
    queryFn: () => asanaService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_ASANA_PREFERENCES;

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const project = searchParams.get('project');

    if (project) {
      setSelectedProjectGid(project);
    }

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['asana-status'] });
      queryClient.invalidateQueries({ queryKey: ['asana-projects'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/asana', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/asana', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMutation = useMutation({
    mutationFn: async () => {
      const latest = await asanaService.getStatus();
      if (latest.data.mockMode) {
        await asanaService.connectMock();
        return { type: 'mock' as const };
      }
      const auth = await asanaService.getAuthUrl();
      return { type: 'oauth' as const, url: auth.data.url };
    },
    onSuccess: (result) => {
      if (result.type === 'oauth') {
        window.location.href = result.url;
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['asana-status'] });
      queryClient.invalidateQueries({ queryKey: ['asana-projects'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => asanaService.disconnect(),
    onSuccess: () => {
      setSelectedProjectGid(null);
      queryClient.invalidateQueries({ queryKey: ['asana-status'] });
      queryClient.removeQueries({ queryKey: ['asana-projects'] });
      queryClient.removeQueries({ queryKey: ['asana-project'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending = connectMutation.isPending || disconnectMutation.isPending;
  const connectError =
    connectMutation.error != null
      ? getErrorMessage(connectMutation.error)
      : null;

  return (
    <PageContainer
      title="Asana"
      description="Projects and tasks from your linked Asana account"
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
        <AsanaConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending || statusLoading}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={() => connectMutation.mutate()}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <AsanaPreferencesCard preferences={preferences} />}

        {isConnected && preferences.showProjects && (
          <AsanaProjectsSection
            selectedProjectGid={selectedProjectGid}
            onSelectProject={setSelectedProjectGid}
          />
        )}
      </div>
    </PageContainer>
  );
}
