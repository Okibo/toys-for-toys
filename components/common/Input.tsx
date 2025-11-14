import React from 'react';

/**
 * Input component - Form input field component
 * Extends HTML input element with styled wrapper
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input field type */
  type?: string;
  /** Whether field shows error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Custom className for wrapper */
  containerClassName?: string;
  /** Custom className for input element */
  inputClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  error = false,
  errorMessage,
  containerClassName = '',
  inputClassName = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-white';

  const normalState =
    'border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500';
  const errorState = 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500';

  return (
    <div className={containerClassName}>
      <input
        type={type}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${error ? errorState : normalState}
          ${inputClassName}
        `}
        {...props}
      />
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}
    </div>
  );
};

export default Input;
