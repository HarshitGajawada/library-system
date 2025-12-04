import apiClient from './client';
import type { Author, CreateAuthorData, UpdateAuthorData } from '../types';

export const authorsApi = {
  getAll: async (): Promise<Author[]> => {
    const response = await apiClient.get<Author[]>('/authors');
    return response.data;
  },

  getById: async (id: string): Promise<Author> => {
    const response = await apiClient.get<Author>(`/authors/${id}`);
    return response.data;
  },

  create: async (data: CreateAuthorData): Promise<Author> => {
    const response = await apiClient.post<Author>('/authors', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAuthorData): Promise<Author> => {
    const response = await apiClient.patch<Author>(`/authors/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/authors/${id}`);
  },
};
