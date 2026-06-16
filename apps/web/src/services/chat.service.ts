import { apiDelete, apiGet, apiPost } from '@/lib/api-client';
import { ChatMessage, ChatSession } from '@/types/api.types';

export const chatService = {
  getSessions: () => apiGet<ChatSession[]>('/chat/sessions'),

  getSession: (id: string) => apiGet<ChatSession>(`/chat/sessions/${id}`),

  deleteSession: (id: string) => apiDelete(`/chat/sessions/${id}`),

  sendMessage: (data: { content: string; sessionId?: string }) =>
    apiPost<{ sessionId: string; message: ChatMessage }>('/chat/messages', data),
};
