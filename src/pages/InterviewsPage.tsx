import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewsApi } from '../api/interviews';
import { Interview, InterviewStatus } from '../types';
import {
  MessageSquare,
  Plus,
  Calendar,
  Clock,
  Award,
  Filter,
  Search,
  AlertCircle,
  Trash2,
} from 'lucide-react';

const InterviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>('all');
  const [deletingInterviewId, setDeletingInterviewId] = useState<number | null>(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const response = await interviewsApi.getInterviews();
      setInterviews(response.interviews);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load interviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInterview = async (
    e: React.MouseEvent,
    interviewId: number
  ) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      'Are you sure you want to delete this interview? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setDeletingInterviewId(interviewId);
    setError('');

    try {
      await interviewsApi.deleteInterview(interviewId);

      setInterviews((currentInterviews) =>
        currentInterviews.filter(
          (interview) => interview.interview_id !== interviewId
        )
      );
    } catch (err: any) {
      const detail = err.response?.data?.detail;

      if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to delete interview');
      }
    } finally {
      setDeletingInterviewId(null);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.target_role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: InterviewStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-primary-100 text-primary-700';
      case 'candidate_questions':
        return 'bg-primary-50 text-primary-800';
      case 'created':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: InterviewStatus) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'candidate_questions':
        return 'Candidate Questions';
      case 'created':
        return 'Created';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Interviews</h1>
          <p className="text-slate-600 mt-1">View your interview history and results</p>
        </div>
        <button
          onClick={() => navigate('/interviews/setup')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Interview
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
              placeholder="Search interviews by role..."
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InterviewStatus | 'all')}
              className="input-field pl-10 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="candidate_questions">Candidate Questions</option>
              <option value="created">Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!error && interviews.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No interviews yet</h3>
          <p className="text-slate-600 mb-6">
            Start your first AI-powered interview to track your progress and improve your skills.
          </p>
          <button
            onClick={() => navigate('/interviews/setup')}
            className="btn-primary mx-auto"
          >
            Start Your First Interview
          </button>
        </div>
      )}

      {/* Interview List */}
      {!error && filteredInterviews.length > 0 && (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => (
            <div
              key={interview.interview_id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/interviews/${interview.interview_id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {interview.target_role}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(interview.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {interview.mode === 'mock' ? 'Mock Interview' : 'Answer Practice'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {interview.status === 'completed' && interview.overall_score !== undefined && (
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-600" />
                        <span className="text-lg font-bold text-slate-900">
                          {interview.overall_score}/100
                        </span>
                      </div>
                      {interview.duration_minutes && (
                        <p className="text-sm text-slate-600">
                          {interview.duration_minutes.toFixed(1)} min
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        interview.status
                      )}`}
                    >
                      {getStatusLabel(interview.status)}
                    </span>

                    <button
                      onClick={(e) =>
                        handleDeleteInterview(e, interview.interview_id)
                      }
                      disabled={deletingInterviewId === interview.interview_id}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete interview"
                    >
                      {deletingInterviewId === interview.interview_id ? (
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!error && interviews.length > 0 && filteredInterviews.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-slate-600">No interviews match your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default InterviewsPage;