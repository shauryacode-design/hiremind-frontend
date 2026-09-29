import apiClient from './client';
import { ProfileResponse, UserUpdate } from '../types';

export const profileApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/profile/');
    return response.data;
  },

  updateProfile: async (data: UserUpdate): Promise<ProfileResponse> => {
    const response = await apiClient.put<ProfileResponse>('/profile/', data);
    return response.data;
  },
};