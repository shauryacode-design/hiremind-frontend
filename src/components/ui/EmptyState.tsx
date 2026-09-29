import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="card text-center py-12">
      {Icon && (
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">{description}</p>
      
      <div className="flex gap-3 justify-center">
        {actionText && onAction && (
          <button onClick={onAction} className="btn-primary">
            {actionText}
          </button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <button onClick={onSecondaryAction} className="btn-secondary">
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;