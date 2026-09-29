import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  Play,
} from 'lucide-react';

interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start(): void;
  stop(): void;

  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

interface VoiceInterfaceProps {
  question?: string;
  onTranscript?: (text: string) => void;
  onRecordingStart?: () => void;
  onVoiceSubmit?: () => void;
  disabled?: boolean;
  autoSpeak?: boolean;
  comingSoon?: boolean;
  speakText?: string;
  onSpeechEnd?: () => void;
  recordButtonLabel?: string;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  question = '',
  onTranscript,
  onRecordingStart,
  onVoiceSubmit,
  disabled = false,
  autoSpeak = false,
  comingSoon = false,
  speakText = '',
  onSpeechEnd,
  recordButtonLabel = 'Speak Answer',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [error, setError] = useState('');

  const voiceSubmitLockRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sessionTranscriptRef = useRef('');

  /*
   * Keep the latest callbacks available to browser APIs so they do not
   * capture stale React state/callback references.
   */
  const onTranscriptRef = useRef(onTranscript);
  const onSpeechEndRef = useRef(onSpeechEnd);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  /*
   * Check whether the browser supports Speech Recognition.
   */
  useEffect(() => {
    const speechWindow = window as WindowWithSpeechRecognition;

    const Recognition =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);

    const recognition = new Recognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const cleanedTranscript = transcript.trim();

      if (cleanedTranscript) {
        sessionTranscriptRef.current = cleanedTranscript;
        onTranscriptRef.current?.(cleanedTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      setIsRecording(false);
      setIsProcessing(false);

      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setError(
            'Microphone permission was denied. Please allow microphone access in your browser.'
          );
          break;

        case 'no-speech':
          setError('No speech detected. Please try speaking again.');
          break;

        case 'audio-capture':
          setError(
            'No microphone was detected. Please check your microphone.'
          );
          break;

        case 'network':
          setError(
            'Speech recognition needs a network connection. Please try again.'
          );
          break;

        default:
          setError('Unable to recognize speech. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Recognition may already be stopped.
      }

      recognitionRef.current = null;
    };
  }, []);

  /*
   * Speak a supplied AI response.
   *
   * This is used by Candidate Questions. It is intentionally separate from
   * question TTS so onSpeechEnd only fires after an AI response finishes.
   */
  useEffect(() => {
    if (!speakText.trim() || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setError('');

    const utterance = new SpeechSynthesisUtterance(speakText);

    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
      onSpeechEndRef.current?.();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [speakText]);

  /*
   * Clean up speech synthesis when leaving the page.
   */
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  /*
   * Automatically speak a new interview question when requested.
   */
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    if (!autoSpeak || !question || !voiceSupported) {
      return;
    }

    const timer = window.setTimeout(() => {
      speakQuestion();
    }, 150);

    return () => {
      window.clearTimeout(timer);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [question, autoSpeak, voiceSupported]);

  /*
   * Speak the current AI question.
   */
  const speakQuestion = () => {
    if (!question.trim()) {
      return;
    }

    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    setError('');
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(question);

    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setError('Unable to play the question aloud.');
    };

    window.speechSynthesis.speak(utterance);
  };

  /*
   * Start microphone recording.
   */
  const startRecording = () => {
    if (disabled || isRecording) {
      return;
    }

    if (!recognitionRef.current) {
      setError(
        'Voice input is not supported in this browser. Please use Chrome or another supported browser.'
      );
      return;
    }

    setError('');
    setIsProcessing(false);

    // Start every answer/question with a completely fresh transcript.
    sessionTranscriptRef.current = '';
    onRecordingStart?.();

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);

      setIsRecording(false);

      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore cleanup error.
      }

      setError('Could not start voice input. Please try again.');
    }
  };

  /*
   * Stop microphone recording.
   */
  const stopRecording = () => {
    if (!recognitionRef.current || voiceSubmitLockRef.current) {
      return;
    }

    voiceSubmitLockRef.current = true;
    setIsProcessing(true);

    try {
      recognitionRef.current.stop();

      window.setTimeout(() => {
        setIsRecording(false);
        setIsProcessing(false);

        if (sessionTranscriptRef.current.trim()) {
          onVoiceSubmit?.();
        }

        window.setTimeout(() => {
          voiceSubmitLockRef.current = false;
        }, 500);
      }, 300);
    } catch {
      setIsRecording(false);
      setIsProcessing(false);
      voiceSubmitLockRef.current = false;
    }
  };

  /*
   * Stop either AI speech or microphone recording.
   */
  const stopAllVoice = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may already be stopped.
      }
    }

    setIsRecording(false);
    setIsProcessing(false);
  };

  /*
   * Preserve the old Coming Soon state when explicitly requested.
   */
  if (comingSoon) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3 text-slate-500">
          <MicOff className="w-5 h-5" />

          <div>
            <p className="text-sm font-medium">Voice input coming soon</p>

            <p className="text-xs text-slate-400 mt-0.5">
              You can continue using typed answers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Browser does not support Speech Recognition.
   */
  if (!voiceSupported) {
    return (
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />

          <div>
            <p className="text-sm font-medium">
              Voice input is not supported
            </p>

            <p className="text-xs text-amber-600 mt-1">
              Please use a browser with Speech Recognition support, such as
              Google Chrome.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voice controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Read question */}
        <button
          type="button"
          onClick={isSpeaking ? stopAllVoice : speakQuestion}
          disabled={disabled || !question.trim()}
          className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 transition-colors ${
            disabled || !question.trim()
              ? 'border-slate-200 text-slate-400 cursor-not-allowed'
              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-5 h-5" />
              Stop Question
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              Read Question
            </>
          )}
        </button>

        {/* Start / stop recording */}
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || isProcessing}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
              disabled || isProcessing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Mic className="w-5 h-5" />
            {recordButtonLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 transition-colors"
          >
            <MicOff className="w-5 h-5" />
            Stop Speaking
          </button>
        )}
      </div>

      {/* Recording / processing status */}
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>

          Listening... Speak your answer naturally.
        </div>
      )}

      {isProcessing && !isRecording && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing your speech...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />

          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Helpful voice note */}
      {!isRecording && !isProcessing && !error && (
        <div className="flex items-start gap-2 text-xs text-slate-400">
          <Play className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />

          <span>
            You can read the question aloud, speak your answer, and edit the
            transcript before submitting.
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;
