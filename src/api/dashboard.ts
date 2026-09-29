import apiClient from './client';
import { DashboardResponse } from '../types';

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiClient.get<DashboardResponse>('/dashboard/');
    return response.data;
  },
};