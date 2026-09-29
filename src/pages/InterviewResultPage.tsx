import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewsApi } from '../api/interviews';
import { InterviewDetails, InterviewResult } from '../types';
import {
  Award,
  TrendingUp,
  Brain,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ArrowLeft,
  Download,
  Share2,
  BarChart3,
} from 'lucide-react';

const InterviewResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviewDetails, setInterviewDetails] = useState<InterviewDetails | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);

  useEffect(() => {
    if (id) {
      loadInterviewResult(parseInt(id));
    }
  }, [id]);

  const loadInterviewResult = async (interviewId: number) => {
    try {
      const details = await interviewsApi.getInterviewDetails(interviewId);
      setInterviewDetails(details);
      if (details.result) {
        setResult(details.result);
      }
      setIsLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load interview result');
      setIsLoading(false);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Generating your interview report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Results</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <button onClick={() => navigate('/interviews')} className="btn-primary">
              Return to Interviews
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Results Not Available</h2>
            <p className="text-slate-600 mb-4">
              The interview results are not yet available. Please check back later.
            </p>
            <button onClick={() => navigate('/interviews')} className="btn-primary">
              Return to Interviews
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/interviews')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Interview Results</h1>
            <p className="text-slate-600 mt-1">
              {interviewDetails?.target_role} • {interviewDetails?.mode === 'mock' ? 'Mock Interview' : 'Answer Practice'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 mb-2">Overall Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold">{result.overall_score}</span>
              <span className="text-2xl text-primary-200">/100</span>
            </div>
          </div>
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <Award className="w-12 h-12 text-white" />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-primary-100 text-sm">Duration</p>
          <p className="text-xl font-semibold">
            {interviewDetails?.duration_minutes?.toFixed(1)} minutes
          </p>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-slate-900">Performance Breakdown</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreMetric
            label="Technical Knowledge"
            score={result.technical_knowledge}
            icon={Brain}
          />
          <ScoreMetric
            label="Problem Solving"
            score={result.problem_solving}
            icon={Lightbulb}
          />
          <ScoreMetric
            label="Communication"
            score={result.communication}
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {result.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-slate-900">Areas for Improvement</h3>
          </div>
          <ul className="space-y-2">
            {result.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Topics Covered */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-slate-900">Topics Covered</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.topics_covered.map((topic, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Final Feedback */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-slate-900">Final Feedback</h3>
        </div>
        <p className="text-slate-700 leading-relaxed">{result.final_feedback}</p>
      </div>

      {/* Recommendation */}
      <div className={`card border-l-4 ${
        result.recommendation.toLowerCase().includes('ready') || 
        result.recommendation.toLowerCase().includes('strong')
          ? 'border-l-green-500 bg-green-50'
          : 'border-l-amber-500 bg-amber-50'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            result.recommendation.toLowerCase().includes('ready') || 
            result.recommendation.toLowerCase().includes('strong')
              ? 'bg-green-100'
              : 'bg-amber-100'
          }`}>
            <Award className={`w-5 h-5 ${
              result.recommendation.toLowerCase().includes('ready') || 
              result.recommendation.toLowerCase().includes('strong')
                ? 'text-green-600'
                : 'text-amber-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Recommendation</h3>
            <p className="text-slate-700">{result.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/interviews/setup')}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Brain className="w-5 h-5" />
          Start New Interview
        </button>
        <button
          onClick={() => navigate('/interviews')}
          className="btn-secondary flex-1"
        >
          View All Interviews
        </button>
      </div>
    </div>
  );
};

interface ScoreMetricProps {
  label: string;
  score: number;
  icon: React.ElementType;
}

const ScoreMetric: React.FC<ScoreMetricProps> = ({ label, score, icon: Icon }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const scoreColor = getScoreColor(score);

  return (
    <div className="text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${scoreColor}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{score}/100</div>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            score >= 80 ? 'bg-green-600' : score >= 60 ? 'bg-amber-600' : 'bg-red-600'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default InterviewResultPage;