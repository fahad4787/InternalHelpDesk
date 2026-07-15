import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface MondayPreferences {
  showBoards: boolean;
}

export interface MondayStatus {
  connected: boolean;
  status: string;
  mondayEmail: string | null;
  mondayName: string | null;
  mondayAccountName: string | null;
  mondayAccountSlug: string | null;
  lastSyncedAt: string | null;
  preferences: MondayPreferences;
}

export interface MondayItem {
  id: string;
  name: string;
  state: string | null;
  updatedAt: string | null;
  permalinkUrl: string | null;
  statusText: string | null;
}

export interface MondayBoard {
  id: string;
  name: string;
  description: string | null;
  boardKind: string | null;
  itemsCount: number;
  updatedAt: string | null;
  permalinkUrl: string | null;
}

export const DEFAULT_MONDAY_PREFERENCES: MondayPreferences = {
  showBoards: true,
};

export const mondayService = {
  getStatus: () => apiGet<MondayStatus>('/integrations/monday/status'),

  getAuthUrl: () =>
    apiGet<{ url: string; state: string }>('/integrations/monday/auth-url'),

  disconnect: () => apiPost('/integrations/monday/disconnect'),

  getBoards: () =>
    apiGet<{
      connected: boolean;
      boards: MondayBoard[];
    }>('/integrations/monday/boards'),

  getBoardDetail: (boardId: string) =>
    apiGet<{
      connected: boolean;
      board: MondayBoard;
      items: MondayItem[];
    }>(`/integrations/monday/boards/${boardId}`),

  updatePreferences: (preferences: MondayPreferences) =>
    apiPatch<MondayPreferences>('/integrations/monday/preferences', preferences),
};
