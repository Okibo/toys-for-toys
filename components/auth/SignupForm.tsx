import React, { useState } from 'react';
import Link from 'next/link';
import { useSignup } from '@/lib/hooks/useSignup';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

interface SignupFormProps {
  onSuccess?: () => void;
  className?: string;
}

/**
 * Signup form component with validation, password strength indicator, and error handling
 * Supports language preference selection
 */
export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
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
  } = useSignup();

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
    if (onSuccess) {
      onSuccess();
    }
  };

  // Show success message
  if (isSuccess) {
    return (
      <div className={`max-w-md mx-auto p-6 ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Success!</h2>
          <p className="text-green-700">{successMessage}</p>
          <p className="text-sm text-green-600 mt-2">
            Check your email for the verification code. The code expires in 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`max-w-md mx-auto ${className}`}>
      {/* API Error */}
      {apiError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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

      {/* Password Confirmation Field */}
      <div className="mb-4">
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
            placeholder="Confirm your password"
            required
            aria-invalid={!!errors.passwordConfirm}
            aria-describedby={errors.passwordConfirm ? 'passwordConfirm-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
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

      {/* Language Preference */}
      <div className="mb-6">
        <label
          htmlFor="language"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Language Preference
        </label>
        <select
          id="language"
          value={formState.language}
          onChange={e => updateField('language', e.target.value)}
          disabled={isLoading}
          className={`
            w-full px-4 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors
          `}
        >
          <option value="en">English</option>
          <option value="pl">Polish (Polski)</option>
          <option value="de">German (Deutsch)</option>
        </select>
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
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>

      {/* Sign In Link */}
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="text-blue-500 hover:text-blue-600 font-medium"
        >
          Log in
        </Link>
      </p>
    </form>
  );
};

export default SignupForm;
