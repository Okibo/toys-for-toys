import React from 'react';
import { validatePassword } from '@/lib/auth/password-validator';

interface PasswordStrengthIndicatorProps {
  password: string;
  showLabel?: boolean;
  className?: string;
}

/**
 * Visual password strength indicator component
 * Shows progress bar and strength label (weak/fair/good/strong)
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showLabel = true,
  className = ''
}) => {
  const validation = validatePassword(password);
  const { score } = validation;

  // Map score to width percentage
  const scoreToWidth: Record<string, number> = {
    weak: 25,
    fair: 50,
    good: 75,
    strong: 100
  };

  // Map score to color
  const scoreToColor: Record<string, string> = {
    weak: 'bg-red-500',
    fair: 'bg-yellow-500',
    good: 'bg-blue-500',
    strong: 'bg-green-500'
  };

  // Map score to label color
  const scoreLabelColor: Record<string, string> = {
    weak: 'text-red-500',
    fair: 'text-yellow-600',
    good: 'text-blue-600',
    strong: 'text-green-600'
  };

  const width = scoreToWidth[score];
  const color = scoreToColor[score];
  const labelColor = scoreLabelColor[score];

  // No password - don't show indicator
  if (!password) {
    return null;
  }

  return (
    <div className={`mt-2 ${className}`}>
      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${width}%` }}
          role="progressbar"
          aria-valuenow={width}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${score}`}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <p className={`text-sm font-medium mt-1 ${labelColor} capitalize`}>
          {score}
        </p>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
