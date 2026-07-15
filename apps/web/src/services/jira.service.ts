import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface JiraPreferences {
  showAssignedIssues: boolean;
  showReportedIssues: boolean;
  showProjects: boolean;
}

export interface JiraStatus {
  connected: boolean;
  status: string;
  jiraEmail: string | null;
  jiraSiteUrl: string | null;
  lastSyncedAt: string | null;
  preferences: JiraPreferences;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string | null;
  issueType: string;
  assignee: string | null;
  reporter: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectType: string | null;
  webUrl: string | null;
}

export interface JiraProfile {
  accountId: string | null;
  email: string | null;
  displayName: string | null;
  siteUrl: string | null;
  siteName: string | null;
}

export const DEFAULT_JIRA_PREFERENCES: JiraPreferences = {
  showAssignedIssues: true,
  showReportedIssues: true,
  showProjects: true,
};

export const jiraService = {
  getStatus: () => apiGet<JiraStatus>('/integrations/jira/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/jira/auth-url'),

  disconnect: () => apiPost('/integrations/jira/disconnect'),

  getProfile: () =>
    apiGet<{ connected: boolean; profile: JiraProfile | null }>(
      '/integrations/jira/profile',
    ),

  getIssues: (type: 'assigned' | 'reported' = 'assigned') =>
    apiGet<{
      connected: boolean;
      jiraSiteUrl?: string | null;
      issues: JiraIssue[];
    }>(`/integrations/jira/issues?type=${type}`),

  getProjects: () =>
    apiGet<{
      connected: boolean;
      jiraSiteUrl?: string | null;
      projects: JiraProject[];
    }>('/integrations/jira/projects'),

  updatePreferences: (preferences: JiraPreferences) =>
    apiPatch<JiraPreferences>('/integrations/jira/preferences', preferences),
};
