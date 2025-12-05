import apiClient from './client';
import type { User } from '../types';

interface UserWithCount extends User {
  _count?: {
    borrowings: number;
  };
}

export const usersApi = {
  getAll: async (): Promise<UserWithCount[]> => {
    const response = await apiClient.get<UserWithCount[]>('/users');
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },
};
