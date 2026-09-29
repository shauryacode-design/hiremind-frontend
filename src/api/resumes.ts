import apiClient from './client';
import { ResumeAnalysis, ResumeListItem } from '../types';

export const resumesApi = {
  uploadResume: async (
    file: File
  ): Promise<{
    message: string;
    resume_id: number;
    filename: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{
      message: string;
      resume_id: number;
      filename: string;
    }>('/resume/upload', formData);

    return response.data;
  },

  getResumes: async (): Promise<ResumeListItem[]> => {
    const response = await apiClient.get<{
      message: string;
      resumes: ResumeListItem[];
    }>('/resume/');

    return response.data.resumes;
  },

  analyzeResume: async (
    resumeId: number
  ): Promise<{
    resume_id: number;
    analysis: ResumeAnalysis;
  }> => {
    const response = await apiClient.post<{
      resume_id: number;
      analysis: ResumeAnalysis;
    }>(`/resume/${resumeId}/analyze`);

    return response.data;
  },

  deleteResume: async (
    resumeId: number
  ): Promise<{
    message: string;
    resume_id: number;
  }> => {
    const response = await apiClient.delete<{
      message: string;
      resume_id: number;
    }>(`/resume/${resumeId}`);

    return response.data;
  },
};