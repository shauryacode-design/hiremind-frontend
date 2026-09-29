import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { interviewsApi } from '../api/interviews';
import {
  InterviewStartResponse,
  InterviewMode,
} from '../types';
import {
  Clock,
  X,
  Send,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  Loader2,
  MessageSquare,
  Bot,
} from 'lucide-react';
import AIInterviewerAvatar from '../components/interview/AIInterviewerAvatar';
import VoiceInterface from '../components/interview/VoiceInterface';

const InterviewExperiencePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [interviewMode, setInterviewMode] = useState<string>('');
  const [interviewData, setInterviewData] =
    useState<InterviewStartResponse | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const [showEvaluation, setShowEvaluation] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<any>(null);
  const [preferredAnswer, setPreferredAnswer] = useState('');
  const [practiceNote, setPracticeNote] = useState('');

  // Frontend question history
  const [questionHistory, setQuestionHistory] = useState<
    Array<{
      question: string;
      answer: string;
    }>
  >([]);

  // Candidate questions phase
  const [isCandidateQuestionsPhase, setIsCandidateQuestionsPhase] =
    useState(false);
  const [candidateQuestion, setCandidateQuestion] = useState('');
  const [isSubmittingCandidateQuestion, setIsSubmittingCandidateQuestion] =
    useState(false);

  const [candidateConversation, setCandidateConversation] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [candidateAiSpeech, setCandidateAiSpeech] = useState('');
  const [candidatePromptSpeech, setCandidatePromptSpeech] = useState(
    'Do you have any questions for the interviewer?'
  );
  const [isCompleting, setIsCompleting] = useState(false);

  const startRequestRef = useRef<number | null>(null);
  const submitRequestRef = useRef(false);
  const candidateRequestRef = useRef(false);
  const completeRequestRef = useRef(false);

  const answerTransitionIdRef = useRef(0);
  const answerTransitionTimerRef = useRef<number | null>(null);
  const activeQuestionNumberRef = useRef(1);

  /*
   * Interview mode
   *
   * Answer Practice -> true
   * Mock Interview  -> false
   */
  const isAnswerPractice = interviewMode === 'answer_practice';

  useEffect(() => {
    if (location.state?.phase === 'candidate_questions') {
      setIsCandidateQuestionsPhase(true);
      setCandidatePromptSpeech(
        'Do you have any questions for the interviewer?'
      );
      setCandidateAiSpeech('');
      setIsLoading(false);
      return;
    }

    if (!id) return;

    const interviewId = parseInt(id);

    if (startRequestRef.current === interviewId) {
      return;
    }

    startRequestRef.current = interviewId;
    startInterview(interviewId);
  }, [id, location.state?.phase]);

  useEffect(() => {
    let interval: number;

    if (interviewData && !showEvaluation) {
      interval = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [interviewData, showEvaluation]);

  useEffect(() => {
    return () => {
      if (answerTransitionTimerRef.current !== null) {
        window.clearTimeout(answerTransitionTimerRef.current);
      }
    };
  }, []);

  const startInterview = async (interviewId: number) => {
    try {
      // 1. Get interview details first
      const details = await interviewsApi.getInterviewDetails(interviewId);

      setInterviewMode(details.mode as InterviewMode);

      // 2. Start the interview
      const response = await interviewsApi.startInterview(interviewId);

      setInterviewData(response);
      setCurrentQuestion(response.question);
      setTopic(response.topic);
      setDifficulty(response.difficulty);
      setQuestionNumber(response.question_number);
      activeQuestionNumberRef.current = response.question_number;

      // ⭐ ADD THIS
      setPreferredAnswer(
        details.mode === 'answer_practice'
          ? response.preferred_answer || ''
          : ''
      );

      // Optional: clear any old practice note
      setPracticeNote('');

      setIsLoading(false);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to start interview'
      );
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !id || submitRequestRef.current) {
      return;
    }

    const submittedAnswer = answer.trim();
    const submittedQuestionNumber =
      activeQuestionNumberRef.current;

    const transitionId =
      answerTransitionIdRef.current + 1;

    const requestId = crypto.randomUUID();

    answerTransitionIdRef.current = transitionId;
    submitRequestRef.current = true;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await interviewsApi.submitAnswer(
        parseInt(id),
        {
          answer: submittedAnswer,
          request_id: requestId,
          question_index: submittedQuestionNumber - 1,
        }
      );

      /*
       * Add the completed question/answer to frontend history
       * only after the backend successfully accepts the answer.
       */
      setQuestionHistory((currentHistory) => [
        ...currentHistory,
        {
          question: currentQuestion,
          answer: submittedAnswer,
        },
      ]);

      setLastEvaluation(response.evaluation);
      setShowEvaluation(true);

      if (response.preferred_answer) {
        setPreferredAnswer(response.preferred_answer);
      }

      if (response.practice_note) {
        setPracticeNote(response.practice_note);
      }

      /*
       * Interview has reached candidate questions.
       */
      if (response.status === 'candidate_questions') {
        answerTransitionTimerRef.current =
          window.setTimeout(() => {
            if (
              answerTransitionIdRef.current !==
              transitionId
            ) {
              return;
            }

            setIsCandidateQuestionsPhase(true);
            setShowEvaluation(false);
            submitRequestRef.current = false;

            answerTransitionTimerRef.current = null;
          }, 2000);
      } else {
        /*
         * Move to next question after evaluation.
         */
        answerTransitionTimerRef.current =
          window.setTimeout(() => {
            if (
              answerTransitionIdRef.current !==
              transitionId ||
              submittedQuestionNumber !==
              activeQuestionNumberRef.current ||
              response.question === null ||
              response.topic === null ||
              response.difficulty === null
            ) {
              return;
            }

            setCurrentQuestion(response.question);
            setTopic(response.topic);
            setDifficulty(response.difficulty);
            setQuestionNumber(response.question_number);

            activeQuestionNumberRef.current =
              response.question_number;

            setAnswer('');

            submitRequestRef.current = false;

            setShowEvaluation(false);

            /*
             * Clear previous question's practice guidance.
             * The backend will provide the next preferred answer
             * once that answer is available.
             */
            setPreferredAnswer(
              interviewMode === 'answer_practice'
                ? response.preferred_answer || ''
                : ''
            );
            setPracticeNote('');

            answerTransitionTimerRef.current = null;
          }, 3000);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'Failed to submit answer'
      );

      submitRequestRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    if (
      confirm(
        'Are you sure you want to exit the interview? Your progress will be lost.'
      )
    ) {
      navigate('/interviews');
    }
  };
  const isNoQuestionResponse = (text: string) => {
    const normalized = text
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .trim();

    const noQuestionPatterns = [
      'no',
      'no question',
      'no questions',
      'no questions for you',
      'i have no questions',
      'i dont have any questions',
      "i don't have any questions",
      'i have nothing to ask',
      'nothing from my side',
      'nothing else',
      'thats all',
      "that's all",
      'that is all',
      'im good',
      "i'm good",
      'no im good',
      "no i'm good",
      'no thank you',
      'no thanks',
      'thats it',
      "that's it",
      'that is it',
    ];

    return noQuestionPatterns.includes(normalized);
  };
  const handleCandidateQuestionSubmit = async () => {
    if (
      !candidateQuestion.trim() ||
      !id ||
      candidateRequestRef.current
    ) {
      return;
    }

    const submittedQuestion = candidateQuestion.trim();

    // Candidate has no more questions.
    if (isNoQuestionResponse(submittedQuestion)) {
      setCandidateQuestion('');
      await handleCompleteInterview(true);
      return;
    }

    candidateRequestRef.current = true;
    setIsSubmittingCandidateQuestion(true);
    setError('');

    try {
      const response = await interviewsApi.submitCandidateQuestion(
        parseInt(id),
        {
          question: submittedQuestion,
          request_id: crypto.randomUUID(),
        }
      );

      setCandidateConversation((currentConversation) => [
        ...currentConversation,
        {
          question: submittedQuestion,
          answer: response.answer,
        },
      ]);

      setCandidateQuestion('');

      // Speak the AI's response.
      setCandidateAiSpeech(response.answer);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to submit question'
      );
    } finally {
      candidateRequestRef.current = false;
      setIsSubmittingCandidateQuestion(false);
    }
  };

  const handleCompleteInterview = async (
    skipConfirmation = false
  ) => {
    if (!id || completeRequestRef.current) {
      return;
    }

    if (
      skipConfirmation ||
      confirm(
        'Are you sure you want to complete the interview? This will generate your final report.'
      )
    ) {
      completeRequestRef.current = true;
      setIsCompleting(true);

      try {
        await interviewsApi.completeInterview(parseInt(id));

        navigate(`/interviews/${id}/result`);
      } catch (err: any) {
        setError(
          err.response?.data?.detail ||
          'Failed to complete interview'
        );
      } finally {
        completeRequestRef.current = false;
        setIsCompleting(false);
      }
    }
  };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins
      .toString()
      .padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />

          <p className="text-slate-600">
            Starting your interview...
          </p>
        </div>
      </div>
    );
  }

  if (error && !isCandidateQuestionsPhase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="card max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />

            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Interview Error
            </h2>

            <p className="text-slate-600 mb-4">
              {error}
            </p>

            <button
              onClick={() => navigate('/interviews')}
              className="btn-primary"
            >
              Return to Interviews
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>

            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                HireMind Interview
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>
                  {isAnswerPractice
                    ? 'Answer Practice'
                    : 'Mock Interview'}
                </span>

                <span className="text-slate-300">
                  •
                </span>

                <span>
                  Question {questionNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-5 h-5" />

              <span className="font-mono text-lg">
                {formatTime(elapsedTime)}
              </span>
            </div>

            <button
              onClick={handleExit}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Exit Interview"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN
      ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* =======================================================
            CANDIDATE QUESTIONS PHASE
        ======================================================= */}
        {isCandidateQuestionsPhase ? (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-full">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Candidate Questions
                  </h2>

                  <p className="text-slate-600">
                    Do you have any questions for the interviewer?
                  </p>
                </div>
              </div>

              {/* Conversation History */}
              {candidateConversation.length > 0 && (
                <div className="space-y-4 mb-6">
                  {candidateConversation.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="space-y-3"
                      >
                        {/* Candidate */}
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary-700">
                              You
                            </span>
                          </div>

                          <div className="flex-1 p-3 bg-slate-50 rounded-lg">
                            <p className="text-slate-900">
                              {item.question}
                            </p>
                          </div>
                        </div>

                        {/* AI */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <AIInterviewerAvatar size="small" />
                          </div>

                          <div className="flex-1 p-3 bg-primary-50 rounded-lg border border-primary-200">
                            <p className="text-slate-900">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Candidate Question Input */}
              <div className="space-y-4">
                <div>
                  <label className="input-label">
                    Your Question
                  </label>

                  <textarea
                    value={candidateQuestion}
                    onChange={(e) =>
                      setCandidateQuestion(
                        e.target.value
                      )
                    }
                    className="input-field min-h-[100px] resize-none"
                    placeholder="Ask about the company, role, culture, or anything else..."
                    disabled={
                      isSubmittingCandidateQuestion
                    }
                  />
                  <VoiceInterface
                    question={candidatePromptSpeech}
                    onTranscript={setCandidateQuestion}
                    onRecordingStart={() => {
                      setCandidateQuestion('');
                    }}
                    onVoiceSubmit={handleCandidateQuestionSubmit}
                    disabled={isSubmittingCandidateQuestion || isCompleting}
                    autoSpeak={true}
                    speakText={candidateAiSpeech}
                    onSpeechEnd={() => {
                      setCandidateAiSpeech('');
                      setCandidatePromptSpeech(
                        'Do you have any other questions for me?'
                      );
                    }}
                    recordButtonLabel="Speak Question"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={
                      handleCandidateQuestionSubmit
                    }
                    disabled={
                      !candidateQuestion.trim() ||
                      isSubmittingCandidateQuestion
                    }
                    className="btn-primary flex items-center gap-2"
                  >
                    {isSubmittingCandidateQuestion ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Ask Question
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCompleteInterview()}
                    disabled={isCompleting}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />

                    {isCompleting
                      ? 'Completing...'
                      : 'Finish Interview'}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

                <p className="text-sm text-red-800">
                  {error}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* =====================================================
             NORMAL INTERVIEW
          ===================================================== */
          <div className="space-y-4">
            {/* ===================================================
                2 × 2 INTERVIEW GRID
            =================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[calc(100vh-150px)] lg:min-h-[650px]">

              {/* =================================================
                  TOP LEFT — AI VOICE
              ================================================= */}
              <section className="card min-h-[360px] lg:min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-primary-600" />

                      <h2 className="text-lg font-semibold text-slate-900">
                        AI Interviewer
                      </h2>
                    </div>

                    <p className="text-sm text-slate-500 mt-1">
                      {isSubmitting
                        ? 'Processing your answer...'
                        : 'AI is ready'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                      {topic}
                    </span>

                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                      {difficulty}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <AIInterviewerAvatar
                    isThinking={isSubmitting}
                    isSpeaking={false}
                    size="medium"
                  />

                  <div className="w-full mt-6">
                    <VoiceInterface
                      question={currentQuestion}
                      onTranscript={setAnswer}
                      onRecordingStart={() => {
                        setAnswer('');
                      }}
                      onVoiceSubmit={handleSubmitAnswer}
                      disabled={isSubmitting}
                      autoSpeak={true}
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  TOP RIGHT — PREFERRED ANSWER / CURRENT QUESTION
              ================================================= */}
              <section className="card min-h-[300px] lg:min-h-0 overflow-hidden">
                {isAnswerPractice ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Preferred Answer
                        </h2>

                        <p className="text-xs text-slate-500">
                          Guidance for practice
                        </p>
                      </div>
                    </div>

                    <div className="h-[calc(100%-70px)] overflow-y-auto">
                      {preferredAnswer ? (
                        <div className="space-y-4">
                          {practiceNote && (
                            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                              <p className="text-sm text-primary-800">
                                {practiceNote}
                              </p>
                            </div>
                          )}

                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                            <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                              {preferredAnswer}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-center">
                          <div>
                            <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-3" />

                            <p className="text-sm font-medium text-slate-500">
                              Preferred answer
                            </p>

                            <p className="text-xs text-slate-400 mt-1 max-w-xs">
                              Answer guidance will appear here when available.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-primary-600" />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Current Question
                        </h2>

                        <p className="text-xs text-slate-500">
                          Question {questionNumber}
                        </p>
                      </div>
                    </div>

                    <div className="h-[calc(100%-70px)] flex items-center">
                      <p className="text-xl font-medium leading-8 text-slate-800">
                        {currentQuestion}
                      </p>
                    </div>
                  </>
                )}
              </section>

              {/* =================================================
    BOTTOM LEFT — QUESTION HISTORY
================================================= */}
              <section className="card min-h-[320px] lg:min-h-0 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-slate-600" />

                    <h2 className="text-lg font-semibold text-slate-900">
                      Question History
                    </h2>
                  </div>

                  <span className="text-xs text-slate-500">
                    {questionHistory.length} answered
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">

                  {/* =============================================
        ANSWERED QUESTIONS
    ============================================= */}
                  {questionHistory.length > 0 && (
                    <>
                      {questionHistory.map((item, index) => (
                        <div
                          key={index}
                          className="space-y-3"
                        >
                          {/* AI question */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                                <Bot className="w-3.5 h-3.5 text-primary-600" />
                              </div>

                              <span className="text-xs font-semibold text-slate-500 uppercase">
                                AI
                              </span>

                              <span className="text-xs text-slate-400">
                                Q{index + 1}
                              </span>
                            </div>

                            <div className="ml-8 p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <p className="text-sm leading-6 text-slate-700">
                                {item.question}
                              </p>
                            </div>
                          </div>

                          {/* Candidate answer */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                                <span className="text-[10px] font-semibold text-white">
                                  YOU
                                </span>
                              </div>

                              <span className="text-xs font-semibold text-slate-500 uppercase">
                                You
                              </span>
                            </div>

                            <div className="ml-8 p-3 bg-primary-50 rounded-lg border border-primary-100">
                              <p className="text-sm leading-6 text-slate-700">
                                {item.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* =============================================
        CURRENT QUESTION
    ============================================= */}
                  {!showEvaluation && currentQuestion && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-primary-600" />
                        </div>

                        <span className="text-xs font-semibold text-primary-600 uppercase">
                          Current Question
                        </span>

                        <span className="text-xs text-slate-400">
                          Q{questionNumber}
                        </span>
                      </div>

                      <div className="ml-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                        <p className="text-sm leading-6 text-slate-800 font-medium">
                          {currentQuestion}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* =============================================
                      EMPTY STATE
                  ============================================= */}
                  {questionHistory.length === 0 && !currentQuestion && (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />

                        <p className="text-sm font-medium text-slate-500">
                          No question available
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Waiting for the interviewer...
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </section>

              {/* =================================================
                  BOTTOM RIGHT — ANSWER / EVALUATION
              ================================================= */}
              <section className="card min-h-[320px] lg:min-h-0 flex flex-col">
                {!showEvaluation ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Your Answer
                        </h2>

                        <p className="text-xs text-slate-500 mt-1">
                          Type your answer manually or use voice input later.
                        </p>
                      </div>

                    </div>

                    <textarea
                      value={answer}
                      onChange={(e) =>
                        setAnswer(e.target.value)
                      }
                      className="input-field flex-1 min-h-[180px] resize-none"
                      placeholder="Type your answer here..."
                      disabled={isSubmitting}
                    />

                    <div className="flex items-center justify-between mt-4 gap-4">
                      <p className="text-sm text-slate-500">
                        {answer.length} characters
                      </p>

                      <div className="flex items-center gap-3">

                        <button
                          onClick={handleSubmitAnswer}
                          disabled={
                            !answer.trim() ||
                            isSubmitting
                          }
                          className="btn-primary flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Evaluating...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Submit Answer
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* =================================================
                     EVALUATION
                  ================================================= */
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>

                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">
                            Answer Evaluated
                          </h2>

                          <p className="text-xs text-slate-500">
                            Review your performance
                          </p>
                        </div>
                      </div>

                      {lastEvaluation && (
                        <span className="text-2xl font-bold text-primary-600">
                          {lastEvaluation.score}/100
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-5">
                      {lastEvaluation && (
                        <>
                          {/* Score bar */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700">
                                Score
                              </span>

                              <span className="text-sm font-semibold text-primary-600">
                                {lastEvaluation.score}/100
                              </span>
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${lastEvaluation.score}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Strengths */}
                          {lastEvaluation.strengths
                            ?.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="w-4 h-4 text-green-600" />

                                  <span className="text-sm font-medium text-slate-700">
                                    Strengths
                                  </span>
                                </div>

                                <ul className="space-y-2">
                                  {lastEvaluation.strengths.map(
                                    (
                                      strength: string,
                                      index: number
                                    ) => (
                                      <li
                                        key={index}
                                        className="text-sm text-slate-600 flex items-start gap-2"
                                      >
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />

                                        <span>
                                          {strength}
                                        </span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Improvements */}
                          {lastEvaluation.improvements
                            ?.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Lightbulb className="w-4 h-4 text-amber-600" />

                                  <span className="text-sm font-medium text-slate-700">
                                    Areas for Improvement
                                  </span>
                                </div>

                                <ul className="space-y-2">
                                  {lastEvaluation.improvements.map(
                                    (
                                      improvement: string,
                                      index: number
                                    ) => (
                                      <li
                                        key={index}
                                        className="text-sm text-slate-600 flex items-start gap-2"
                                      >
                                        <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />

                                        <span>
                                          {improvement}
                                        </span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Practice guidance */}
                          {isAnswerPractice &&
                            preferredAnswer && (
                              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Lightbulb className="w-4 h-4 text-primary-600" />

                                  <span className="text-sm font-medium text-primary-900">
                                    Practice Guidance
                                  </span>
                                </div>

                                {practiceNote && (
                                  <p className="text-sm text-primary-800 mb-3">
                                    {practiceNote}
                                  </p>
                                )}

                                <div className="p-3 bg-white rounded border border-primary-200">
                                  <p className="text-sm leading-6 text-slate-700">
                                    {preferredAnswer}
                                  </p>
                                </div>
                              </div>
                            )}
                        </>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-center">
                      <p className="text-sm text-slate-600">
                        Preparing your next question...
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

                <p className="text-sm text-red-800">
                  {error}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default InterviewExperiencePage;