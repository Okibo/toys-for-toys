import React, { useState } from 'react';
import Link from 'next/link';
import { useResetPassword } from '@/lib/hooks/useResetPassword';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

interface ResetPasswordFormProps {
  token: string;
  email: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Reset password form component for completing password reset flow
 * Validates token and allows user to set new password
 */
export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  email,
  onSuccess,
  onError,
  className = ''
}) => {
  const {
    formState,
    errors,
    isLoading,
    isSuccess,
    isValidatingToken,
    tokenError,
    apiError,
    updateField,
    submit
  } = useResetPassword(token, email);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

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

  // Show token validation error
  if (!isValidatingToken && tokenError) {
    return (
      <div className={`max-w-md mx-auto p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Invalid Reset Link</h2>
          <p className="text-red-700 mb-4">{tokenError}</p>
          <p className="text-sm text-red-600 mb-4">
            Reset links expire after 24 hours. Please request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-block px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state while validating token
  if (isValidatingToken) {
    return (
      <div className={`max-w-md mx-auto p-6 ${className}`}>
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
          <p className="mt-4 text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Show success message
  if (isSuccess) {
    return (
      <div className={`max-w-md mx-auto p-6 ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Password Reset Successful</h2>
          <p className="text-green-700 mb-4">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
        <p className="text-gray-600 text-sm">
          Create a strong password to secure your account
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

      {/* New Password Field */}
      <div className="mb-4">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formState.password}
            onChange={e => updateField('password', e.target.value)}
            disabled={isLoading}
            className={`
              w-full px-4 py-2 pr-10 border rounded-lg
              focus:outline-none focus:ring-2
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors
              ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="At least 8 characters"
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {/* Password strength indicator */}
        {formState.password && (
          <PasswordStrengthIndicator password={formState.password} />
        )}

        {errors.password && (
          <div id="password-error" className="mt-1 text-sm text-red-600">
            {errors.password.map((error, idx) => (
              <p key={idx}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="mb-6">
        <label
          htmlFor="passwordConfirm"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="passwordConfirm"
            type={showPasswordConfirm ? 'text' : 'password'}
            value={formState.passwordConfirm}
            onChange={e => updateField('passwordConfirm', e.target.value)}
            disabled={isLoading}
            className={`
              w-full px-4 py-2 pr-10 border rounded-lg
              focus:outline-none focus:ring-2
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors
              ${
                errors.passwordConfirm
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="Confirm your new password"
            required
            aria-invalid={!!errors.passwordConfirm}
            aria-describedby={errors.passwordConfirm ? 'passwordConfirm-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
            aria-pressed={showPasswordConfirm}
          >
            {showPasswordConfirm ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.passwordConfirm && (
          <div id="passwordConfirm-error" className="mt-1 text-sm text-red-600">
            {errors.passwordConfirm.map((error, idx) => (
              <p key={idx}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !formState.password || !formState.passwordConfirm}
        className={`
          w-full px-4 py-2 font-medium text-white rounded-lg
          transition-colors focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:ring-offset-2
          ${
            isLoading || !formState.password || !formState.passwordConfirm
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
          }
        `}
      >
        {isLoading ? 'Resetting Password...' : 'Reset Password'}
      </button>

      {/* Return to Login Link */}
      <p className="mt-4 text-center text-sm text-gray-600">
        <Link
          href="/auth/login"
          className="text-blue-500 hover:text-blue-600 font-medium"
        >
          Back to login
        </Link>
      </p>
    </form>
  );
};

export default ResetPasswordForm;
