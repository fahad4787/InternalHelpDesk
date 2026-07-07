'use client';

import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Ticket } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { JiraIssueList } from '@/components/shared/jira-issue-list';
import { JiraProfileCard } from '@/components/shared/jira-profile-card';
import { JiraProjectList } from '@/components/shared/jira-project-list';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { jiraService } from '@/services/jira.service';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function JiraProfileDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['jira-profile'],
    queryFn: () => jiraService.getProfile(),
  });

  const profile = data?.data?.profile ?? null;

  return (
    <DashboardWidgetCard
      source="Jira"
      sourceLogo={<IntegrationIcon provider="JIRA" />}
      title="Jira Profile"
      deepLinkHref="/integrations/jira"
      deepLinkLabel="Open Jira"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : profile ? (
        <JiraProfileCard profile={profile} />
      ) : (
        <p className="text-sm text-muted">Profile unavailable.</p>
      )}
    </DashboardWidgetCard>
  );
}

export function JiraAssignedDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['jira-issues', 'assigned'],
    queryFn: () => jiraService.getIssues('assigned'),
  });

  const issues = data?.data?.issues ?? [];

  return (
    <DashboardWidgetCard
      source="Jira"
      sourceLogo={<IntegrationIcon provider="JIRA" />}
      title="Assigned issues"
      deepLinkHref={data?.data?.jiraSiteUrl ?? '/integrations/jira'}
      deepLinkLabel="Open in Jira"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No assigned issues"
          description="Issues assigned to you in Jira will appear here"
        />
      ) : (
        <JiraIssueList issues={issues} />
      )}
    </DashboardWidgetCard>
  );
}

export function JiraReportedDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['jira-issues', 'reported'],
    queryFn: () => jiraService.getIssues('reported'),
  });

  const issues = data?.data?.issues ?? [];

  return (
    <DashboardWidgetCard
      source="Jira"
      sourceLogo={<IntegrationIcon provider="JIRA" />}
      title="Reported issues"
      deepLinkHref={data?.data?.jiraSiteUrl ?? '/integrations/jira'}
      deepLinkLabel="Open in Jira"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No reported issues"
          description="Issues you report in Jira will appear here"
        />
      ) : (
        <JiraIssueList issues={issues} />
      )}
    </DashboardWidgetCard>
  );
}

export function JiraProjectsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['jira-projects'],
    queryFn: () => jiraService.getProjects(),
  });

  const projects = data?.data?.projects ?? [];

  return (
    <DashboardWidgetCard
      source="Jira"
      sourceLogo={<IntegrationIcon provider="JIRA" />}
      title="Projects"
      deepLinkHref="/integrations/jira"
      deepLinkLabel="Open Jira"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Jira projects you can access will appear here"
        />
      ) : (
        <JiraProjectList projects={projects} />
      )}
    </DashboardWidgetCard>
  );
}
