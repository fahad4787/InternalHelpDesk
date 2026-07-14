import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface AsanaPreferences {
  showProjects: boolean;
  showMyTasks: boolean;
}

export interface AsanaStatus {
  connected: boolean;
  mockMode: boolean;
  needsReconnect?: boolean;
  status: string;
  asanaEmail: string | null;
  asanaName: string | null;
  lastSyncedAt: string | null;
  preferences: AsanaPreferences;
}

export interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  dueOn: string | null;
  assigneeName: string | null;
  projectName: string | null;
  permalinkUrl: string | null;
  modifiedAt: string | null;
}

export interface AsanaProject {
  gid: string;
  name: string;
  notes: string | null;
  color: string | null;
  archived: boolean;
  permalinkUrl: string | null;
  workspaceName: string | null;
  modifiedAt: string | null;
  taskCount: number;
}

export interface AsanaProjectDetail {
  project: AsanaProject;
  tasks: AsanaTask[];
}

export const DEFAULT_ASANA_PREFERENCES: AsanaPreferences = {
  showProjects: true,
  showMyTasks: true,
};

export const asanaService = {
  getStatus: () => apiGet<AsanaStatus>('/integrations/asana/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/asana/auth-url'),

  connectMock: () => apiPost('/integrations/asana/connect-mock'),

  disconnect: () => apiPost('/integrations/asana/disconnect'),

  getProjects: () =>
    apiGet<{
      connected: boolean;
      mockMode: boolean;
      projects: AsanaProject[];
    }>('/integrations/asana/projects'),

  getProjectDetail: (projectGid: string) =>
    apiGet<{
      connected: boolean;
      mockMode: boolean;
      project: AsanaProject;
      tasks: AsanaTask[];
    }>(`/integrations/asana/projects/${projectGid}`),

  getMyTasks: () =>
    apiGet<{
      connected: boolean;
      mockMode: boolean;
      tasks: AsanaTask[];
    }>('/integrations/asana/my-tasks'),

  updatePreferences: (preferences: AsanaPreferences) =>
    apiPatch<AsanaPreferences>('/integrations/asana/preferences', preferences),
};
