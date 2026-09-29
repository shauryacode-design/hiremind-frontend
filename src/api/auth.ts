import apiClient from './client';
import { AuthResponse, UserCreate, UserLogin, User } from '../types';

export const authApi = {
  signup: async (userData: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>('/signup', userData);
    return response.data;
  },

  login: async (credentials: UserLogin): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/me');
    return response.data;
  },
};