import { apiClient, apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface TrelloPreferences {
  showBoards: boolean;
}

export interface TrelloStatus {
  connected: boolean;
  status: string;
  trelloEmail: string | null;
  trelloUsername: string | null;
  trelloFullName: string | null;
  lastSyncedAt: string | null;
  preferences: TrelloPreferences;
}

export interface TrelloBoard {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  closed: boolean;
  lastActivityAt: string | null;
}

export interface TrelloCardSummary {
  id: string;
  name: string;
  description: string | null;
  descriptionText: string | null;
  imageUrls: string[];
  coverUrl: string | null;
  url: string | null;
  dueAt: string | null;
  lastActivityAt: string | null;
}

export interface TrelloListWithCards {
  id: string;
  name: string;
  cards: TrelloCardSummary[];
}

export interface TrelloBoardDetail {
  id: string;
  name: string;
  url: string | null;
  lists: TrelloListWithCards[];
}

export const DEFAULT_TRELLO_PREFERENCES: TrelloPreferences = {
  showBoards: true,
};

export const trelloService = {
  getStatus: () => apiGet<TrelloStatus>('/integrations/trello/status'),

  getAuthUrl: () => apiGet<{ url: string }>('/integrations/trello/auth-url'),

  connect: (payload: { token: string; state: string }) =>
    apiPost('/integrations/trello/connect', payload),

  disconnect: () => apiPost('/integrations/trello/disconnect'),

  getBoards: () =>
    apiGet<{ connected: boolean; boards: TrelloBoard[] }>(
      '/integrations/trello/boards',
    ),

  getBoardDetail: (boardId: string) =>
    apiGet<{ connected: boolean; board: TrelloBoardDetail }>(
      `/integrations/trello/boards/${boardId}`,
    ),

  fetchMediaBlob: async (url: string) => {
    const response = await apiClient.get<Blob>('/integrations/trello/media', {
      params: { url },
      responseType: 'blob',
    });
    return response.data;
  },

  updatePreferences: (preferences: TrelloPreferences) =>
    apiPatch<TrelloPreferences>('/integrations/trello/preferences', preferences),
};
