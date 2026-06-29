'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FolderKanban, Ticket } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { EmptyState } from '@/components/shared/empty-state';
import { JiraConnectionCard } from '@/components/shared/jira-connection-card';
import { JiraPreferencesCard } from '@/components/shared/jira-preferences-card';
import { JiraProfileCard } from '@/components/shared/jira-profile-card';
import { JiraIssueList } from '@/components/shared/jira-issue-list';
import { JiraProjectList } from '@/components/shared/jira-project-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api-client';
import {
  DEFAULT_JIRA_PREFERENCES,
  jiraService,
} from '@/services/jira.service';

export default function JiraIntegrationPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['jira-status'],
    queryFn: () => jiraService.getStatus(),
  });

  const status = statusData?.data;
  const isConnected = status?.connected === true;
  const preferences = status?.preferences ?? DEFAULT_JIRA_PREFERENCES;
  const showProfile = isConnected && preferences.showProfile === true;
  const showAssigned = isConnected && preferences.showAssignedIssues === true;
  const showReported = isConnected && preferences.showReportedIssues === true;
  const showProjects = isConnected && preferences.showProjects === true;

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['jira-profile'],
    queryFn: () => jiraService.getProfile(),
    enabled: showProfile,
  });

  const {
    data: assignedData,
    isLoading: assignedLoading,
    error: assignedError,
    refetch: refetchAssigned,
    isFetching: assignedFetching,
  } = useQuery({
    queryKey: ['jira-issues', 'assigned'],
    queryFn: () => jiraService.getIssues('assigned'),
    enabled: showAssigned,
  });

  const {
    data: reportedData,
    isLoading: reportedLoading,
    error: reportedError,
    refetch: refetchReported,
    isFetching: reportedFetching,
  } = useQuery({
    queryKey: ['jira-issues', 'reported'],
    queryFn: () => jiraService.getIssues('reported'),
    enabled: showReported,
  });

  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
    isFetching: projectsFetching,
  } = useQuery({
    queryKey: ['jira-projects'],
    queryFn: () => jiraService.getProjects(),
    enabled: showProjects,
  });

  const profile = profileData?.data?.profile ?? null;
  const assignedIssues = assignedData?.data?.issues ?? [];
  const reportedIssues = reportedData?.data?.issues ?? [];
  const projects = projectsData?.data?.projects ?? [];

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['jira-status'] });
      queryClient.invalidateQueries({ queryKey: ['jira-profile'] });
      queryClient.invalidateQueries({ queryKey: ['jira-issues'] });
      queryClient.invalidateQueries({ queryKey: ['jira-projects'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      router.replace('/integrations/jira', { scroll: false });
      return;
    }

    if (error) {
      setAuthError(decodeURIComponent(error));
      router.replace('/integrations/jira', { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const displayAuthError = isConnected ? null : authError;

  const connectMockMutation = useMutation({
    mutationFn: () => jiraService.connectMock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-status'] });
      queryClient.invalidateQueries({ queryKey: ['jira-issues'] });
      queryClient.invalidateQueries({ queryKey: ['jira-projects'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const connectJiraMutation = useMutation({
    mutationFn: () => jiraService.getAuthUrl(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => jiraService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-status'] });
      queryClient.invalidateQueries({ queryKey: ['jira-issues'] });
      queryClient.invalidateQueries({ queryKey: ['jira-projects'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const isPending =
    connectMockMutation.isPending ||
    connectJiraMutation.isPending ||
    disconnectMutation.isPending;

  const handleConnect = () => {
    if (status?.mockMode) {
      connectMockMutation.mutate();
    } else {
      connectJiraMutation.mutate();
    }
  };

  const connectError =
    connectMockMutation.error || connectJiraMutation.error
      ? getErrorMessage(connectMockMutation.error || connectJiraMutation.error)
      : null;

  return (
    <PageContainer
      title="Jira"
      description="Issues, projects, and profile from your linked Jira account"
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
        <JiraConnectionCard
          status={status}
          isLoading={statusLoading}
          isConnected={isConnected}
          isPending={isPending}
          authError={displayAuthError}
          connectError={connectError}
          onConnect={handleConnect}
          onDisconnect={() => disconnectMutation.mutate()}
        />

        {isConnected && <JiraPreferencesCard preferences={preferences} />}

        {showProfile && (
          profileLoading ? (
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Loading Jira profile...</p>
              </CardContent>
            </Card>
          ) : profile ? (
            <JiraProfileCard profile={profile} />
          ) : null
        )}

        {showAssigned && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Assigned Issues</CardTitle>
                  <CardDescription className="mt-1">
                    Jira issues currently assigned to you
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {assignedIssues.length > 0 && (
                    <Badge variant="success" className="w-fit">
                      {assignedIssues.length} issue
                      {assignedIssues.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchAssigned()}
                    disabled={assignedFetching}
                  >
                    {assignedFetching ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {assignedError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {getErrorMessage(assignedError)}
                </div>
              )}
              {assignedLoading ? (
                <p className="text-sm text-slate-500">Loading issues...</p>
              ) : assignedIssues.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="No assigned issues"
                  description="Issues assigned to you in Jira will appear here"
                />
              ) : (
                <JiraIssueList issues={assignedIssues} />
              )}
            </CardContent>
          </Card>
        )}

        {showReported && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Reported Issues</CardTitle>
                  <CardDescription className="mt-1">
                    Jira issues you created or reported
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {reportedIssues.length > 0 && (
                    <Badge variant="success" className="w-fit">
                      {reportedIssues.length} issue
                      {reportedIssues.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchReported()}
                    disabled={reportedFetching}
                  >
                    {reportedFetching ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {reportedError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {getErrorMessage(reportedError)}
                </div>
              )}
              {reportedLoading ? (
                <p className="text-sm text-slate-500">Loading issues...</p>
              ) : reportedIssues.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="No reported issues"
                  description="Issues you report in Jira will appear here"
                />
              ) : (
                <JiraIssueList issues={reportedIssues} />
              )}
            </CardContent>
          </Card>
        )}

        {showProjects && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Projects</CardTitle>
                  <CardDescription className="mt-1">
                    Jira projects you can access
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {projects.length > 0 && (
                    <Badge variant="success" className="w-fit">
                      {projects.length} project
                      {projects.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchProjects()}
                    disabled={projectsFetching}
                  >
                    {projectsFetching ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {projectsError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {getErrorMessage(projectsError)}
                </div>
              )}
              {projectsLoading ? (
                <p className="text-sm text-slate-500">Loading projects...</p>
              ) : projects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects found"
                  description="Jira projects you can access will appear here"
                />
              ) : (
                <JiraProjectList projects={projects} />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
