import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewsApi } from '../api/interviews';
import { resumesApi } from '../api/resumes';
import {
  InterviewCreate,
  InterviewMode,
  ResumeListItem,
} from '../types';
import {
  Brain,
  FileText,
  Target,
  Play,
  AlertCircle,
  Info,
} from 'lucide-react';

const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [resumeId, setResumeId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [mode, setMode] = useState<InterviewMode>('mock');

  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    setIsLoadingResumes(true);
    setError('');

    try {
      const data = await resumesApi.getResumes();

      setResumes(data);

      // Automatically select the first analyzed resume
      const firstAnalyzedResume = data.find(
        (resume) => resume.analysis !== null
      );

      if (firstAnalyzedResume) {
        setResumeId(String(firstAnalyzedResume.id));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          'Failed to load your resumes'
      );
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    if (!resumeId) {
      setError('Please select an analyzed resume');
      return;
    }

    setIsLoading(true);

    try {
      const interviewData: InterviewCreate = {
        resume_id: Number(resumeId),
        target_role: targetRole,
        mode,
      };

      const response =
        await interviewsApi.createInterview(interviewData);

      navigate(
        `/interviews/${response.interview_id}/experience`
      );
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          'Failed to create interview'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const analyzedResumes = resumes.filter(
    (resume) => resume.analysis !== null
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-primary-600" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Setup Your Interview
        </h1>

        <p className="text-slate-600">
          Configure your AI-powered interview session with
          personalized questions
        </p>
      </div>

      <div className="card">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Resume Selection */}
          <div>
            <label className="input-label flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Select Resume
            </label>

            {isLoadingResumes ? (
              <div className="input-field text-slate-500">
                Loading resumes...
              </div>
            ) : analyzedResumes.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  You don't have any analyzed resumes yet.
                  Please upload and analyze a resume from the
                  Resumes page before starting an interview.
                </p>
              </div>
            ) : (
              <>
                <select
                  value={resumeId}
                  onChange={(e) =>
                    setResumeId(e.target.value)
                  }
                  className="input-field"
                  required
                >
                  <option value="">
                    Select an analyzed resume
                  </option>

                  {analyzedResumes.map((resume) => (
                    <option
                      key={resume.id}
                      value={resume.id}
                    >
                      {resume.filename}
                    </option>
                  ))}
                </select>

                <p className="text-sm text-slate-500 mt-1">
                  Select the resume you want the AI to use for
                  this interview.
                </p>
              </>
            )}
          </div>

          {/* Target Role */}
          <div>
            <label className="input-label flex items-center gap-2">
              <Target className="w-4 h-4" />
              Target Role
            </label>

            <input
              type="text"
              value={targetRole}
              onChange={(e) =>
                setTargetRole(e.target.value)
              }
              className="input-field"
              placeholder="e.g., Software Engineer, Data Analyst, Product Manager"
              required
            />

            <p className="text-sm text-slate-500 mt-1">
              The job role you're preparing for
            </p>
          </div>

          {/* Interview Mode */}
          <div>
            <label className="input-label mb-3">
              Interview Mode
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mock Interview */}
              <button
                type="button"
                onClick={() => setMode('mock')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'mock'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      mode === 'mock'
                        ? 'bg-primary-100'
                        : 'bg-slate-100'
                    }`}
                  >
                    <Play
                      className={`w-5 h-5 ${
                        mode === 'mock'
                          ? 'text-primary-600'
                          : 'text-slate-600'
                      }`}
                    />
                  </div>

                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900">
                      Mock Interview
                    </h3>

                    <p className="text-sm text-slate-600">
                      Standard professional interview
                    </p>
                  </div>
                </div>

                {mode === 'mock' && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-sm text-slate-700">
                      Experience a realistic interview where
                      the AI asks questions and evaluates your
                      responses naturally.
                    </p>
                  </div>
                )}
              </button>

              {/* Answer Practice */}
              <button
                type="button"
                onClick={() =>
                  setMode('answer_practice')
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'answer_practice'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      mode === 'answer_practice'
                        ? 'bg-primary-100'
                        : 'bg-slate-100'
                    }`}
                  >
                    <Info
                      className={`w-5 h-5 ${
                        mode === 'answer_practice'
                          ? 'text-primary-600'
                          : 'text-slate-600'
                      }`}
                    />
                  </div>

                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900">
                      Answer Practice
                    </h3>

                    <p className="text-sm text-slate-600">
                      Guided practice with hints
                    </p>
                  </div>
                </div>

                {mode === 'answer_practice' && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-sm text-slate-700">
                      Practice with guidance - see preferred
                      answers and detailed feedback for each
                      question.
                    </p>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

              <p className="text-sm text-red-800">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isLoading ||
              isLoadingResumes ||
              analyzedResumes.length === 0
            }
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Interview...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Interview
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />

            <div className="text-sm text-primary-800">
              <p className="font-medium mb-1">
                Before you start:
              </p>

              <ul className="space-y-1">
                <li>
                  • Make sure your resume is analyzed in the
                  Resumes section
                </li>

                <li>
                  • Choose a target role that matches your
                  career goals
                </li>

                <li>
                  • Find a quiet environment for the best
                  interview experience
                </li>

                <li>
                  • The interview is adaptive - questions will
                  change based on your answers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetupPage;