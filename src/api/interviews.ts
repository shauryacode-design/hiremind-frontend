import apiClient from './client';
import {
  Interview,
  InterviewCreate,
  InterviewDetails,
  InterviewStartResponse,
  InterviewAnswer,
  InterviewResponse,
  CandidateQuestion,
  CandidateQuestionResponse,
  InterviewCompleteResponse,
} from '../types';

export const interviewsApi = {
  createInterview: async (data: InterviewCreate): Promise<{
    message: string;
    interview_id: number;
    target_role: string;
    mode: string;
    status: string;
    interview_plan: any;
  }> => {
    const response = await apiClient.post('/interviews/', data);
    return response.data;
  },

  getInterviews: async (): Promise<{ message: string; interviews: Interview[] }> => {
    const response = await apiClient.get<{ message: string; interviews: Interview[] }>('/interviews/');
    return response.data;
  },

  getInterviewDetails: async (interviewId: number): Promise<InterviewDetails> => {
    const response = await apiClient.get<InterviewDetails>(`/interviews/${interviewId}`);
    return response.data;
  },

  startInterview: async (interviewId: number): Promise<InterviewStartResponse> => {
    const response = await apiClient.post<InterviewStartResponse>(`/interviews/${interviewId}/start`);
    return response.data;
  },

  submitAnswer: async (interviewId: number, answer: InterviewAnswer): Promise<InterviewResponse> => {
    const response = await apiClient.post<InterviewResponse>(`/interviews/${interviewId}/answer`, answer);
    return response.data;
  },

  submitCandidateQuestion: async (
    interviewId: number,
    question: CandidateQuestion
  ): Promise<CandidateQuestionResponse> => {
    const response = await apiClient.post<CandidateQuestionResponse>(
      `/interviews/${interviewId}/candidate-question`,
      question
    );
    return response.data;
  },

  deleteInterview: async (
    interviewId: number
  ): Promise<{ message: string; interview_id: number }> => {
    const response = await apiClient.delete<{
      message: string;
      interview_id: number;
    }>(`/interviews/${interviewId}`);

    return response.data;
  },

  completeInterview: async (interviewId: number): Promise<InterviewCompleteResponse> => {
    const response = await apiClient.post<InterviewCompleteResponse>(`/interviews/${interviewId}/complete`);
    return response.data;
  },
};