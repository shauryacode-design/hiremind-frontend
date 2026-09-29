import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewsApi } from '../api/interviews';
import { InterviewDetails, InterviewStatus } from '../types';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
  Target,
  Play,
  CheckCircle,
  AlertCircle,
  User,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const InterviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [expandedConversation, setExpandedConversation] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (id) {
      loadInterviewDetails(parseInt(id));
    }
  }, [id]);

  const loadInterviewDetails = async (interviewId: number) => {
    try {
      const details = await interviewsApi.getInterviewDetails(interviewId);
      setInterview(details);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load interview details');
      setIsLoading(false);
    }
  };

  const handleStartInterview = () => {
    if (id) {
      navigate(`/interviews/${id}/experience`);
    }
  };

  const handleViewResult = () => {
    if (id) {
      navigate(`/interviews/${id}/result`);
    }
  };

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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="card">
        <p className="text-slate-600">Interview not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/interviews')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{interview.target_role}</h1>
          <p className="text-slate-600 mt-1">
            {interview.mode === 'mock' ? 'Mock Interview' : 'Answer Practice'}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                  {getStatusLabel(interview.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(interview.created_at)}
                </span>
                {interview.duration_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {interview.duration_minutes.toFixed(1)} minutes
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {interview.status === 'created' && (
              <button
                onClick={handleStartInterview}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Interview
              </button>
            )}
            {interview.status === 'completed' && (
              <button
                onClick={handleViewResult}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                View Results
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interview Plan */}
      {interview.interview_plan && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900">Interview Plan</h2>
          </div>

          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2">Strategy</p>
            <p className="text-slate-900">{interview.interview_plan.interview_strategy}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-2">Planned Questions</p>
            <div className="space-y-2">
              {interview.interview_plan.questions.map((question, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-600">Q{index + 1}</span>
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                      {question.topic}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs">
                      {question.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-slate-900">{question.question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result Preview */}
      {interview.result && (
        <div className="card border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">Interview Completed</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{interview.result.overall_score}</div>
              <div className="text-xs text-slate-600">Overall Score</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{interview.result.technical_knowledge}</div>
              <div className="text-xs text-slate-600">Technical</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{interview.result.problem_solving}</div>
              <div className="text-xs text-slate-600">Problem Solving</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{interview.result.communication}</div>
              <div className="text-xs text-slate-600">Communication</div>
            </div>
          </div>

          <button
            onClick={handleViewResult}
            className="btn-primary w-full"
          >
            View Full Results
          </button>
        </div>
      )}
      {/* Interview Conversation */}
      {interview.conversation && interview.conversation.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Interview Conversation
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Review the questions asked and your responses during the interview.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {interview.conversation.map((turn, index) => {
              const isExpanded = expandedConversation === index;

              return (
                <div
                  key={index}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Question */}
                  <div className="p-5 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {turn.type === 'candidate_question'
                                ? 'Your Question'
                                : `Question ${index + 1}`}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-900 leading-relaxed">
                          {turn.question}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Answer */}
                  {turn.answer && (
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-slate-600" />
                        </div>

                        <div className="flex-1">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Your Answer
                          </span>

                          <p className="text-slate-700 leading-relaxed mt-2 whitespace-pre-wrap">
                            {turn.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evaluation */}
                  {turn.evaluation && (
                    <div className="border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedConversation(
                            isExpanded ? null : index
                          )
                        }
                        className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          View Evaluation
                        </span>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 bg-slate-50">
                          <div className="pt-4 space-y-4">

                            {/* Score */}
                            {turn.evaluation.score !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">
                                  Score
                                </span>

                                <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">
                                  {turn.evaluation.score}/10
                                </span>
                              </div>
                            )}

                            {/* Strengths */}
                            <div>
                              <h4 className="text-sm font-semibold text-green-700 mb-2">
                                Strengths
                              </h4>

                              {turn.evaluation.strengths &&
                                turn.evaluation.strengths.length > 0 ? (
                                <ul className="space-y-2">
                                  {turn.evaluation.strengths.map((strength, strengthIndex) => (
                                    <li
                                      key={strengthIndex}
                                      className="flex items-start gap-2 text-sm text-slate-600"
                                    >
                                      <span className="text-green-600 mt-0.5">✓</span>
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-slate-400">
                                  No specific strengths recorded.
                                </p>
                              )}
                            </div>

                            {/* Improvements */}
                            <div>
                              <h4 className="text-sm font-semibold text-amber-700 mb-2">
                                Areas to Improve
                              </h4>

                              {turn.evaluation.improvements &&
                                turn.evaluation.improvements.length > 0 ? (
                                <ul className="space-y-2">
                                  {turn.evaluation.improvements.map(
                                    (improvement, improvementIndex) => (
                                      <li
                                        key={improvementIndex}
                                        className="flex items-start gap-2 text-sm text-slate-600"
                                      >
                                        <span className="text-amber-600 mt-0.5">•</span>
                                        <span>{improvement}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                <p className="text-sm text-slate-400">
                                  No specific improvements recorded.
                                </p>
                              )}
                            </div>

                            {/* Feedback, if available */}
                            {turn.evaluation.feedback && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                  Feedback
                                </h4>

                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {turn.evaluation.feedback}
                                </p>
                              </div>
                            )}

                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewDetailPage;