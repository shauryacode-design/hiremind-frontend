import React, { useEffect, useState } from 'react';
import { resumesApi } from '../api/resumes';
import { ResumeAnalysis, ResumeListItem } from '../types';
import {
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle,
  X,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  TrendingUp,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const getErrorMessage = (error: any, fallback: string): string => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || 'Validation error')
      .join(', ');
  }

  return fallback;
};

const ResumesPage: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState<number | null>(null);

  const [uploadError, setUploadError] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [uploadedResumeId, setUploadedResumeId] = useState<number | null>(null);
  const [currentAnalysis, setCurrentAnalysis] =
    useState<ResumeAnalysis | null>(null);

  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);
  const [selectedAnalysisResume, setSelectedAnalysisResume] =
    useState<ResumeListItem | null>(null);

  // Load existing resumes when the page opens
  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    setIsLoadingResumes(true);

    try {
      const data = await resumesApi.getResumes();
      setResumes(data);
    } catch (err: any) {
      setUploadError(
        getErrorMessage(err, 'Failed to load resumes')
      );
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError('');
    setCurrentAnalysis(null);

    try {
      const response = await resumesApi.uploadResume(selectedFile);

      setUploadedResumeId(response.resume_id);
      setSelectedFile(null);

      // Refresh the list from the backend
      await loadResumes();
    } catch (err: any) {
      setUploadError(
        getErrorMessage(err, 'Failed to upload resume')
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async (resumeId: number) => {
    setIsAnalyzing(true);
    setAnalysisError('');
    setCurrentAnalysis(null);
    setUploadedResumeId(resumeId);

    try {
      const response = await resumesApi.analyzeResume(resumeId);

      const updatedResume: ResumeListItem = {
        ...resumes.find((resume) => resume.id === resumeId)!,
        analysis: response.analysis,
      };

      setCurrentAnalysis(response.analysis);
      setSelectedAnalysisResume(updatedResume);
      setIsAnalysisDrawerOpen(true);

      setResumes((currentResumes) =>
        currentResumes.map((resume) =>
          resume.id === resumeId
            ? updatedResume
            : resume
        )
      );
    } catch (err: any) {
      setAnalysisError(
        getErrorMessage(err, 'Failed to analyze resume')
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (resumeId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this resume?'
    );

    if (!confirmed) return;

    setDeletingResumeId(resumeId);
    setDeleteError('');

    try {
      await resumesApi.deleteResume(resumeId);

      setResumes((currentResumes) =>
        currentResumes.filter((resume) => resume.id !== resumeId)
      );

      if (uploadedResumeId === resumeId) {
        setUploadedResumeId(null);
        setCurrentAnalysis(null);
        setSelectedAnalysisResume(null);
        setIsAnalysisDrawerOpen(false);
      }
    } catch (err: any) {
      setDeleteError(
        getErrorMessage(err, 'Failed to delete resume')
      );
    } finally {
      setDeletingResumeId(null);
    }
  };

  const handleViewAnalysis = (resume: ResumeListItem) => {
    if (!resume.analysis) return;

    setUploadedResumeId(resume.id);
    setCurrentAnalysis(resume.analysis);
    setSelectedAnalysisResume(resume);
    setAnalysisError('');
    setIsAnalysisDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Resumes
          </h1>

          <p className="text-slate-600 mt-1">
            Upload and analyze your resume for personalized interviews
          </p>
        </div>

        <button
          onClick={loadResumes}
          disabled={isLoadingResumes}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh resumes"
        >
          <RefreshCw
            className={`w-5 h-5 text-slate-600 ${isLoadingResumes ? 'animate-spin' : ''
              }`}
          />
        </button>
      </div>

      {/* Upload Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Upload Resume
        </h2>

        {!selectedFile ? (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />

            <p className="text-slate-600 mb-4">
              Drag and drop your resume here, or click to browse
            </p>

            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
            />

            <label
              htmlFor="resume-upload"
              className="btn-primary inline-block cursor-pointer"
            >
              Select PDF File
            </label>

            <p className="text-sm text-slate-500 mt-2">
              PDF files only, max 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-slate-400" />

                <div>
                  <p className="font-medium text-slate-900">
                    {selectedFile.name}
                  </p>

                  <p className="text-sm text-slate-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

                <p className="text-sm text-red-800">
                  {uploadError}
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn-primary w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </div>
        )}
      </div>

      {/* Resume List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Your Resumes
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Select an analyzed resume when starting an interview
            </p>
          </div>
        </div>

        {deleteError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

            <p className="text-sm text-red-800">
              {deleteError}
            </p>
          </div>
        )}

        {isLoadingResumes ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />

            <p className="text-sm text-slate-500 mt-3">
              Loading resumes...
            </p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />

            <p className="font-medium text-slate-700">
              No resumes uploaded yet
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Upload your first resume above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-8 h-8 text-slate-400 flex-shrink-0" />

                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {resume.filename}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      {resume.analysis ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />

                          <span className="text-sm text-green-700">
                            Analyzed
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-amber-600">
                          Not analyzed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {resume.analysis ? (
                    <button
                      onClick={() => handleViewAnalysis(resume)}
                      className="px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      View Analysis
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAnalyze(resume.id)}
                      disabled={isAnalyzing}
                      className="btn-primary text-sm"
                    >
                      {isAnalyzing && uploadedResumeId === resume.id
                        ? 'Analyzing...'
                        : 'Analyze'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(resume.id)}
                    disabled={deletingResumeId === resume.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete resume"
                  >
                    {deletingResumeId === resume.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Error */}
      {analysisError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

          <p className="text-sm text-red-800">
            {analysisError}
          </p>
        </div>
      )}

      {/* Resume Analysis Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 transition-opacity duration-300 ${isAnalysisDrawerOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsAnalysisDrawerOpen(false)}
      />

      <aside
        className={`fixed top-0 right-0 z-50 h-screen w-full sm:w-[85vw] md:w-[60vw] lg:w-[45vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isAnalysisDrawerOpen
            ? 'translate-x-0'
            : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">

          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary-600 flex-shrink-0" />

                <h2 className="text-xl font-semibold text-slate-900 truncate">
                  Resume Analysis
                </h2>
              </div>

              {selectedAnalysisResume && (
                <p className="text-sm text-slate-500 mt-1 truncate">
                  {selectedAnalysisResume.filename}
                </p>
              )}
            </div>

            <button
              onClick={() => setIsAnalysisDrawerOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
              aria-label="Close analysis"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentAnalysis && (
              <div className="space-y-5">

                {/* Analysis status */}
                <div className="flex items-center gap-2 pb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />

                  <span className="text-sm font-medium text-green-700">
                    Resume Analysis Complete
                  </span>
                </div>

                {/* Professional Profile */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-primary-600" />

                    <h3 className="text-lg font-semibold text-slate-900">
                      Professional Profile
                    </h3>
                  </div>

                  <p className="text-slate-700 leading-relaxed">
                    {currentAnalysis.professional_profile}
                  </p>
                </div>

                {/* Technical Skills */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="w-5 h-5 text-primary-600" />

                    <h3 className="text-lg font-semibold text-slate-900">
                      Technical Skills
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentAnalysis.technical_skills.map(
                      (skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Education */}
                {currentAnalysis.education.length > 0 && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-5 h-5 text-primary-600" />

                      <h3 className="text-lg font-semibold text-slate-900">
                        Education
                      </h3>
                    </div>

                    <ul className="space-y-2">
                      {currentAnalysis.education.map(
                        (education, index) => (
                          <li
                            key={index}
                            className="p-3 bg-slate-50 rounded-lg text-slate-700"
                          >
                            {education}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Work Experience */}
                {currentAnalysis.work_experience.length > 0 && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="w-5 h-5 text-primary-600" />

                      <h3 className="text-lg font-semibold text-slate-900">
                        Work Experience
                      </h3>
                    </div>

                    <ul className="space-y-2">
                      {currentAnalysis.work_experience.map(
                        (experience, index) => (
                          <li
                            key={index}
                            className="p-3 bg-slate-50 rounded-lg text-slate-700"
                          >
                            {experience}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Projects */}
                {currentAnalysis.projects.length > 0 && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary-600" />

                      <h3 className="text-lg font-semibold text-slate-900">
                        Projects
                      </h3>
                    </div>

                    <ul className="space-y-2">
                      {currentAnalysis.projects.map(
                        (project, index) => (
                          <li
                            key={index}
                            className="p-3 bg-slate-50 rounded-lg text-slate-700"
                          >
                            {project}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Certifications */}
                {currentAnalysis.certifications.length > 0 && (
                  <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-primary-600" />

                      <h3 className="text-lg font-semibold text-slate-900">
                        Certifications
                      </h3>
                    </div>

                    <ul className="space-y-2">
                      {currentAnalysis.certifications.map(
                        (certification, index) => (
                          <li
                            key={index}
                            className="p-3 bg-slate-50 rounded-lg text-slate-700"
                          >
                            {certification}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Strengths */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />

                    <h3 className="text-lg font-semibold text-slate-900">
                      Strengths
                    </h3>
                  </div>

                  <ul className="space-y-2">
                    {currentAnalysis.strengths.map(
                      (strength, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />

                          <span className="text-slate-700">
                            {strength}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />

                    <h3 className="text-lg font-semibold text-slate-900">
                      Areas for Improvement
                    </h3>
                  </div>

                  <ul className="space-y-2">
                    {currentAnalysis.weaknesses.map(
                      (weakness, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />

                          <span className="text-slate-700">
                            {weakness}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Suitable Job Roles */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-primary-600" />

                    <h3 className="text-lg font-semibold text-slate-900">
                      Suitable Job Roles
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentAnalysis.suitable_job_roles.map(
                      (role, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                        >
                          {role}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Interview Focus Areas */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary-600" />

                    <h3 className="text-lg font-semibold text-slate-900">
                      Interview Focus Areas
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentAnalysis.interview_focus_areas.map(
                      (area, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          {area}
                        </span>
                      )
                    )}
                  </div>
                </div>

              </div>
            )}

            {!currentAnalysis && (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">
                  No analysis available.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ResumesPage;