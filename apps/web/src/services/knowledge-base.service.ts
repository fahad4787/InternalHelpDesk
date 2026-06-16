import { apiClient, apiDelete, apiGet, apiPatch } from '@/lib/api-client';
import { Document } from '@/types/api.types';

export interface DocumentPreview extends Document {
  content: string;
}

export const knowledgeBaseService = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiGet<Document[]>('/knowledge-base', params),

  getById: (id: string) => apiGet<Document>(`/knowledge-base/${id}`),

  getPreview: (id: string) =>
    apiGet<DocumentPreview>(`/knowledge-base/${id}/preview`),

  upload: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return apiClient
      .post('/knowledge-base/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  updateTitle: (id: string, title: string) =>
    apiPatch<Document>(`/knowledge-base/${id}`, { title }),

  delete: (id: string) => apiDelete(`/knowledge-base/${id}`),
};
