import React from 'react';
import { Brain, Loader2 } from 'lucide-react';

interface AIInterviewerAvatarProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * AI Interviewer Avatar Component
 * 
 * This component represents the AI interviewer with visual states for:
 * - Thinking/processing state
 * - Speaking state (for future TTS)
 * - Idle state
 * 
 * The avatar is designed to be visually engaging while maintaining a professional appearance.
 * It can be enhanced with animations and more sophisticated visuals in the future.
 */
const AIInterviewerAvatar: React.FC<AIInterviewerAvatarProps> = ({
  isThinking = false,
  isSpeaking = false,
  size = 'medium',
}) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-32 h-32',
  };

  const iconSizes = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
      isThinking ? 'animate-pulse' : ''
    } ${isSpeaking ? 'scale-105' : ''}`}>
      {isThinking ? (
        <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
      ) : (
        <Brain className={`${iconSizes[size]} text-white`} />
      )}
    </div>
  );
};

export default AIInterviewerAvatar;