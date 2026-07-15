import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface ClickUpPreferences {
  showLists: boolean;
}

export interface ClickUpStatus {
  connected: boolean;
  status: string;
  clickupEmail: string | null;
  clickupUsername: string | null;
  lastSyncedAt: string | null;
  preferences: ClickUpPreferences;
}

export interface ClickUpTask {
  id: string;
  name: string;
  status: string | null;
  dueDate: string | null;
  url: string | null;
  assignees: string[];
}

export interface ClickUpList {
  id: string;
  name: string;
  taskCount: number | null;
  spaceName: string | null;
  folderName: string | null;
  teamName: string | null;
}

export const DEFAULT_CLICKUP_PREFERENCES: ClickUpPreferences = {
  showLists: true,
};

export const clickupService = {
  getStatus: () => apiGet<ClickUpStatus>('/integrations/clickup/status'),

  getAuthUrl: () =>
    apiGet<{ url: string; state: string }>('/integrations/clickup/auth-url'),

  disconnect: () => apiPost('/integrations/clickup/disconnect'),

  getLists: () =>
    apiGet<{
      connected: boolean;
      lists: ClickUpList[];
    }>('/integrations/clickup/lists'),

  getListDetail: (listId: string) =>
    apiGet<{
      connected: boolean;
      list: ClickUpList;
      tasks: ClickUpTask[];
    }>(`/integrations/clickup/lists/${listId}`),

  updatePreferences: (preferences: ClickUpPreferences) =>
    apiPatch<ClickUpPreferences>('/integrations/clickup/preferences', preferences),
};
