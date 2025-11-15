import React, { useState, useRef, useEffect } from 'react';

interface CodeInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  onComplete?: (code: string) => void;
}

/**
 * 6-digit code input component with auto-advancing between digits
 * Supports paste, backspace, and auto-focus
 */
export const CodeInput: React.FC<CodeInputProps> = ({
  code,
  onCodeChange,
  length = 6,
  autoFocus = true,
  disabled = false,
  className = '',
  onComplete
}) => {
  const [inputs, setInputs] = useState<string[]>(code.split('').concat(Array(length - code.length).fill('')));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /**
   * Update inputs when code prop changes
   */
  useEffect(() => {
    const newInputs = code.split('').concat(Array(length - code.length).fill(''));
    setInputs(newInputs);
  }, [code, length]);

  /**
   * Auto-focus first input on mount
   */
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  /**
   * Handle single digit input
   */
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '');

    if (digit.length > 1) {
      // Paste event - distribute digits across inputs
      handlePaste(digit);
      return;
    }

    const newInputs = [...inputs];
    newInputs[index] = digit;
    setInputs(newInputs);

    const newCode = newInputs.join('');
    onCodeChange(newCode);

    // Auto-advance to next input if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger complete callback if all digits entered
    if (newCode.length === length && onComplete) {
      onComplete(newCode);
    }
  };

  /**
   * Handle backspace - move focus to previous input
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inputs[index] && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    // Allow arrow keys for navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle paste event - distribute digits across inputs
   */
  const handlePaste = (pastedData: string) => {
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, length);
    const newInputs = [...inputs];

    digits.forEach((digit, index) => {
      newInputs[index] = digit;
    });

    setInputs(newInputs);
    const newCode = newInputs.join('');
    onCodeChange(newCode);

    // Focus on appropriate input based on pasted content
    const nextIndex = Math.min(digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    // Trigger complete if all digits filled
    if (newCode.length === length && onComplete) {
      onComplete(newCode);
    }
  };

  /**
   * Prevent non-digit input
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {inputs.map((digit, index) => (
        <input
          key={index}
          ref={el => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className={`
            w-12 h-12 text-center text-lg font-semibold
            border-2 border-gray-300 rounded-lg
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors
          `}
          aria-label={`Verification code digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
};

export default CodeInput;
