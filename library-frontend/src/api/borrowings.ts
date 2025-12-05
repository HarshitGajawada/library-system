import apiClient from './client';
import type { Borrowing } from '../types';

export const borrowingsApi = {
  borrow: async (bookId: string): Promise<Borrowing> => {
    const response = await apiClient.post<Borrowing>('/borrowings', { bookId });
    return response.data;
  },

  return: async (borrowingId: string): Promise<Borrowing> => {
    const response = await apiClient.patch<Borrowing>(`/borrowings/${borrowingId}/return`);
    return response.data;
  },

  extend: async (borrowingId: string): Promise<Borrowing> => {
    const response = await apiClient.patch<Borrowing>(`/borrowings/${borrowingId}/extend`);
    return response.data;
  },

  getMyBorrowings: async (): Promise<Borrowing[]> => {
    const response = await apiClient.get<Borrowing[]>('/borrowings/my');
    return response.data;
  },

  getAll: async (): Promise<Borrowing[]> => {
    const response = await apiClient.get<Borrowing[]>('/borrowings');
    return response.data;
  },

  getById: async (id: string): Promise<Borrowing> => {
    const response = await apiClient.get<Borrowing>(`/borrowings/${id}`);
    return response.data;
  },
};
