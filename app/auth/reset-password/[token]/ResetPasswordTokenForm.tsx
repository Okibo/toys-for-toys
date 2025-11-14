/**
 * app/auth/reset-password/[token]/ResetPasswordTokenForm.tsx
 *
 * Password reset confirmation form component.
 * Users enter their new password after clicking the reset link from email.
 * Validates token and handles password reset.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import {
  passwordResetConfirmSchema,
  type PasswordResetConfirmData,
  getPasswordStrength,
  getPasswordStrengthMessage,
} from '@/lib/auth-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResetPasswordTokenFormProps {
  token?: string;
}

export function ResetPasswordTokenForm({ token }: ResetPasswordTokenFormProps): React.ReactNode {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<PasswordResetConfirmData>({
    resolver: zodResolver(passwordResetConfirmSchema),
    mode: 'onChange',
    defaultValues: {
      token: token || '',
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Validate token on mount
  useEffect(() => {
    if (!token || token.length < 20) {
      setTokenError('Invalid password reset link');
      setIsValidatingToken(false);
    } else {
      setIsValidatingToken(false);
    }
  }, [token]);

  // Update password strength as user types
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    }
  }, [password]);

  const isFormValid = isValid && password && confirmPassword && !tokenError;

  const onSubmit = async (data: PasswordResetConfirmData): Promise<void> => {
    if (!token) {
      setApiError('Missing reset token');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: data.password,
          token,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Check if it's a token error
        if (result.error?.includes('expired') || result.error?.includes('invalid')) {
          setTokenError(result.error || 'Your password reset link has expired');
        } else {
          setApiError(result.error || 'Password reset failed. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      // Reset successful
      setIsSuccess(true);

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error) {
      setApiError('An error occurred. Please try again.');
      setIsSubmitting(false);
      console.error('Reset password confirm error:', error);
    }
  };

  // Show loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Validating reset link...</p>
      </div>
    );
  }

  // Show token error
  if (tokenError) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
        </div>

        {/* Error Message */}
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-700 dark:text-red-200 mb-4">{tokenError}</p>
          <Link
            href="/auth/reset-password"
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium underline"
          >
            Request a new password reset link
          </Link>
        </div>
      </div>
    );
  }

  // Show success message
  if (isSuccess) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Password Reset</h1>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4">
          <p className="text-sm text-green-700 dark:text-green-200">
            Password reset successfully. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  const getStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
        <p className="text-gray-600 dark:text-gray-400">Enter your new password</p>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-sm text-red-700 dark:text-red-200">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
            New Password
          </Label>
          <Input
            {...register('password')}
            id="password"
            type="password"
            placeholder="••••••••"
            disabled={isSubmitting}
            className={errors.password ? 'border-red-500 dark:border-red-500' : ''}
            aria-describedby={errors.password ? 'password-error' : 'password-strength'}
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getStrengthColor(passwordStrength)}`}
                    style={{
                      width:
                        passwordStrength === 'weak'
                          ? '33%'
                          : passwordStrength === 'medium'
                            ? '66%'
                            : '100%',
                    }}
                  />
                </div>
                <span className="text-xs font-medium capitalize text-gray-600 dark:text-gray-400">
                  {passwordStrength}
                </span>
              </div>
              <p id="password-strength" className="text-xs text-gray-500 dark:text-gray-400">
                {getPasswordStrengthMessage(passwordStrength)}
              </p>
            </div>
          )}

          {errors.password && (
            <p className="text-sm text-red-500 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
            Confirm Password
          </Label>
          <Input
            {...register('confirmPassword')}
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            disabled={isSubmitting}
            className={errors.confirmPassword ? 'border-red-500 dark:border-red-500' : ''}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-red-500 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">
                <span className="inline-block animate-spin">⏳</span>
              </span>
              Resetting password...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>

      {/* Back to Login Link */}
      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
