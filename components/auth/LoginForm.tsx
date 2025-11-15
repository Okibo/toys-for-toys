import React, { useState } from 'react';
import Link from 'next/link';
import { useLogin } from '@/lib/hooks/useLogin';

interface LoginFormProps {
  onSuccess?: (user_id: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Login form component with email/password fields and validation
 * Supports remember me functionality and error handling
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const {
    formState,
    errors,
    isLoading,
    isSuccess,
    apiError,
    updateField,
    submit
  } = useLogin();

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await submit();
      if (result.success && result.user_id && onSuccess) {
        onSuccess(result.user_id);
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Welcome Back!</h2>
          <p className="text-green-700">You have been successfully logged in.</p>
          <p className="text-sm text-green-600 mt-2">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`max-w-md mx-auto ${className}`}>
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
      <div className="mb-4">
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

      {/* Password Field */}
      <div className="mb-4">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
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
            placeholder="Enter your password"
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
        {errors.password && (
          <div id="password-error" className="mt-1 text-sm text-red-600">
            {errors.password.map((error, idx) => (
              <p key={idx}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Remember Me Checkbox */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formState.rememberMe}
            onChange={e => updateField('rememberMe', e.target.checked ? 'true' : 'false')}
            disabled={isLoading}
            className="w-4 h-4 border-gray-300 rounded focus:ring-blue-500"
            aria-label="Remember me for 7 days"
          />
          <span className="ml-2 text-sm text-gray-700">
            Remember me for 7 days
          </span>
        </label>
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
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>

      {/* Footer Links */}
      <div className="mt-6 space-y-2 text-center text-sm">
        <p>
          <Link
            href="/auth/forgot-password"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Can't access your account?
          </Link>
        </p>
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Create a new account
          </Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
