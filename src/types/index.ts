// User types
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at?: string;
}

export interface UserCreate {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserUpdate {
  first_name: string;
  last_name: string;
}

// Auth types
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Resume types

export interface Resume {
  id: number;
  user_id: number;
  filename: string;
  file_path: string;
  extracted_text: string;
  analysis: ResumeAnalysis | null;
  created_at?: string;
}

export interface ResumeListItem {
  id: number;
  filename: string;
  analysis: ResumeAnalysis | null;
}

export interface ResumeAnalysis {
  professional_profile: string;
  technical_skills: string[];
  education: string[];
  work_experience: string[];
  projects: string[];
  certifications: string[];
  strengths: string[];
  weaknesses: string[];
  suitable_job_roles: string[];
  interview_focus_areas: string[];
}

// Interview types
export type InterviewMode = 'mock' | 'answer_practice';
export type InterviewStatus = 'created' | 'in_progress' | 'candidate_questions' | 'completed';

export interface InterviewCreate {
  resume_id: number;
  target_role: string;
  mode: InterviewMode;
}

export interface Interview {
  interview_id: number;
  target_role: string;
  mode: InterviewMode;
  status: InterviewStatus;
  overall_score?: number;
  duration_minutes?: number;
  created_at: string;
  result?: InterviewResult;
}

export interface InterviewDetails extends Interview {
  interview_plan?: InterviewPlan;
  conversation?: InterviewConversationTurn[];
}

export interface InterviewConversationTurn {
  type: 'interview' | 'candidate_question';
  question: string;
  answer: string;
  evaluation?: {
    score?: number;
    technical_knowledge?: number;
    problem_solving?: number;
    communication?: number;
    strengths?: string[];
    improvements?: string[];
    feedback?: string;
    [key: string]: any;
  } | null;
  question_index?: number;
  answered_at?: string;
  elapsed_seconds?: number;
}

export interface InterviewPlan {
  interview_strategy: string;
  questions: InterviewQuestion[];
}

export interface InterviewQuestion {
  question: string;
  topic: string;
  difficulty: string;
}

export interface InterviewAnswer {
  answer: string;
  request_id: string;
  question_index: number;
}

export interface InterviewEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
}

export interface InterviewResponse {
  message: string;
  interview_id: number;
  status: InterviewStatus;
  elapsed_minutes: number;
  action: 'follow_up' | 'new_topic' | 'wrap_up';
  question: string | null;
  topic: string | null;
  difficulty: string | null;
  question_number: number;
  evaluation: InterviewEvaluation;
  preferred_answer?: string;
  practice_note?: string;
}

export interface InterviewStartResponse {
  message: string;
  interview_id: number;
  status: string;
  question_number: number;
  question: string;
  topic: string;
  difficulty: string;
  preferred_answer?: string | null;
}

export interface CandidateQuestion {
  question: string;
  request_id: string;
}

export interface CandidateQuestionResponse {
  message: string;
  interview_id: number;
  answer: string;
}

export interface InterviewCompleteResponse {
  message: string;
  interview_id: number;
  status: InterviewStatus;
  duration_minutes: number;
  result: InterviewResult;
}

export interface InterviewResult {
  overall_score: number;
  technical_knowledge: number;
  problem_solving: number;
  communication: number;
  strengths: string[];
  improvements: string[];
  topics_covered: string[];
  final_feedback: string;
  recommendation: string;
}

// Dashboard types
export interface DashboardSummary {
  total_interviews: number;
  completed_interviews: number;
  average_score: number;
  best_score: number | null;
}

export interface DashboardResponse {
  message: string;
  summary: DashboardSummary;
}

// Profile types
export interface ProfileResponse {
  message: string;
  profile: User;
}

// API Error types
export interface ApiError {
  detail: string;
  status?: number;
}