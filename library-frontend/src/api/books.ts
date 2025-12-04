import apiClient from './client';
import type { Book, CreateBookData, UpdateBookData, BookFilters } from '../types';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const booksApi = {
  getAll: async (filters?: BookFilters): Promise<Book[]> => {
    const params = new URLSearchParams();
    if (filters?.authorId) params.append('authorId', filters.authorId);
    if (filters?.available !== undefined) params.append('available', String(filters.available));
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<PaginatedResponse<Book>>('/books', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Book> => {
    const response = await apiClient.get<Book>(`/books/${id}`);
    return response.data;
  },

  create: async (data: CreateBookData): Promise<Book> => {
    const response = await apiClient.post<Book>('/books', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBookData): Promise<Book> => {
    const response = await apiClient.patch<Book>(`/books/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/books/${id}`);
  },
};
