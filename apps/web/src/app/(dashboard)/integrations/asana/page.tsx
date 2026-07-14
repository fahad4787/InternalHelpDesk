'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import {
  AsanaMyTasksSection,
  AsanaProjectsSection,
} from '@/components/shared/asana-projects-section';
import { AsanaConnectionCard } from '@/components/shared/asana-connection-card';
import { AsanaPreferencesCard } from '@/components/shared/asana-preferences-card';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_ASANA_PREFERENCES,
  asanaService,
} from '@/services/asana.service';

const ASANA_OAUTH_STATE_KEY = 'asana-oauth-state';

export default function AsanaIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedProjectGid, setSelectedProjectGid] = useState<string | null>(null);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [authCode, setAuthCode] = useState('');

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
      queryClient.invalidateQueries({ queryKey: ['asana-my-tasks'] });
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

  const invalidateAsana = () => {
    queryClient.invalidateQueries({ queryKey: ['asana-status'] });
    queryClient.invalidateQueries({ queryKey: ['asana-projects'] });
    queryClient.invalidateQueries({ queryKey: ['asana-my-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['integrations'] });
  };

  const connectMutation = useMutation({
    mutationFn: async () => {
      const latest = await asanaService.getStatus();
      if (latest.data.mockMode) {
        return asanaService.connectMock();
      }
      const auth = await asanaService.getAuthUrl();
      return auth.data;
    },
    onSuccess: (result) => {
      if (result && 'url' in result && result.url) {
        if (result.oobMode) {
          sessionStorage.setItem(ASANA_OAUTH_STATE_KEY, result.state);
          setAwaitingCode(true);
          setAuthCode('');
          window.open(result.url, '_blank', 'noopener,noreferrer');
          return;
        }
        window.location.href = result.url;
        return;
      }
      setAwaitingCode(false);
      invalidateAsana();
    },
  });

  const submitCodeMutation = useMutation({
    mutationFn: async () => {
      const state = sessionStorage.getItem(ASANA_OAUTH_STATE_KEY);
      if (!state) {
        throw new Error('Authorization expired. Click Connect with Asana again.');
      }
      const code = authCode.trim();
      if (!code) {
        throw new Error('Paste the authorization code from Asana.');
      }
      return asanaService.connectCode(code, state);
    },
    onSuccess: () => {
      sessionStorage.removeItem(ASANA_OAUTH_STATE_KEY);
      setAwaitingCode(false);
      setAuthCode('');
      setAuthError(null);
      invalidateAsana();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => asanaService.disconnect(),
    onSuccess: () => {
      setSelectedProjectGid(null);
      setAwaitingCode(false);
      setAuthCode('');
      sessionStorage.removeItem(ASANA_OAUTH_STATE_KEY);
      queryClient.invalidateQueries({ queryKey: ['asana-status'] });
      queryClient.removeQueries({ queryKey: ['asana-projects'] });
      queryClient.removeQueries({ queryKey: ['asana-project'] });
      queryClient.removeQueries({ queryKey: ['asana-my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending =
    connectMutation.isPending ||
    submitCodeMutation.isPending ||
    disconnectMutation.isPending;
  const connectError =
    connectMutation.error || submitCodeMutation.error
      ? getErrorMessage(connectMutation.error ?? submitCodeMutation.error)
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
          awaitingCode={awaitingCode && !isConnected}
          authCode={authCode}
          onAuthCodeChange={setAuthCode}
          onSubmitCode={() => submitCodeMutation.mutate()}
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

        {isConnected && preferences.showMyTasks && <AsanaMyTasksSection />}
      </div>
    </PageContainer>
  );
}
