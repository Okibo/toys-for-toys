import React from 'react';
import Link from 'next/link';
import { useForgotPassword } from '@/lib/hooks/useForgotPassword';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Forgot password form component for initiating password reset flow
 * Sends reset link to provided email address
 */
export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const {
    formState,
    errors,
    isLoading,
    isSuccess,
    successMessage,
    apiError,
    updateField,
    submit
  } = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await submit();
      if (result.success && onSuccess) {
        onSuccess();
      } else if (!result.success && result.error && onError) {
        onError(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      if (onError) onError(errorMessage);
    }
  };

  // Show success message
  if (isSuccess) {
    return (
      <div className={`max-w-md mx-auto p-6 ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Check Your Email</h2>
          <p className="text-green-700 mb-2">{successMessage}</p>
          <p className="text-sm text-green-600">
            The password reset link will expire in 24 hours.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-4 py-2 text-blue-500 hover:text-blue-600 font-medium"
          >
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`max-w-md mx-auto ${className}`}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-gray-600 text-sm">
          Enter the email address associated with your account, and we'll send you a
          link to reset your password.
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <div
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <p className="text-red-800 text-sm font-medium">{apiError}</p>
        </div>
      )}

      {/* Email Field */}
      <div className="mb-6">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={formState.email}
          onChange={e => updateField('email', e.target.value)}
          disabled={isLoading}
          className={`
            w-full px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors
            ${
              errors.email
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }
          `}
          placeholder="you@example.com"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <div id="email-error" className="mt-1 text-sm text-red-600">
            {errors.email.map((error, idx) => (
              <p key={idx}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full px-4 py-2 font-medium text-white rounded-lg
          transition-colors focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:ring-offset-2
          ${
            isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
          }
        `}
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </button>

      {/* Return to Login Link */}
      <p className="mt-4 text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link
          href="/auth/login"
          className="text-blue-500 hover:text-blue-600 font-medium"
        >
          Return to login
        </Link>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;
