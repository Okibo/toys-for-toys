import React from 'react';

interface ResendButtonProps {
  onResend: () => Promise<void>;
  canResend: boolean;
  countdown: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * Resend verification code button with countdown timer
 * Shows countdown after click and disables button until timer expires
 */
export const ResendButton: React.FC<ResendButtonProps> = ({
  onResend,
  canResend,
  countdown,
  isLoading = false,
  className = ''
}) => {
  const isDisabled = !canResend || isLoading || countdown > 0;

  return (
    <button
      onClick={onResend}
      disabled={isDisabled}
      className={`
        inline-block px-4 py-2 text-sm font-medium text-center
        rounded-lg transition-colors
        ${
          isDisabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
        }
        ${className}
      `}
      aria-busy={isLoading}
    >
      {countdown > 0 ? (
        <span>
          Resend in {countdown}s
        </span>
      ) : (
        <span>
          {isLoading ? 'Sending...' : "Didn't receive code? Resend"}
        </span>
      )}
    </button>
  );
};

export default ResendButton;
