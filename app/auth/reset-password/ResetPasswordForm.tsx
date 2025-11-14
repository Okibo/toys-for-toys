/**
 * app/auth/reset-password/ResetPasswordForm.tsx
 *
 * Password reset request form component.
 * Users enter their email to request a password reset link.
 * Shows generic confirmation message to prevent email enumeration.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { passwordResetRequestSchema, type PasswordResetRequestData } from '@/lib/auth-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ResetPasswordForm(): React.ReactNode {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<PasswordResetRequestData>({
    resolver: zodResolver(passwordResetRequestSchema),
    mode: 'onChange',
  });

  const email = watch('email');
  const isFormValid = isValid && email;

  const onSubmit = async (data: PasswordResetRequestData): Promise<void> => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        setApiError('An error occurred. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Always show success message (prevent email enumeration)
      setIsSubmitted(true);
      setIsSubmitting(false);
    } catch (error) {
      setApiError('An error occurred. Please try again.');
      setIsSubmitting(false);
      console.error('Reset password error:', error);
    }
  };

  // If submitted, show confirmation message
  if (isSubmitted) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Check Your Email</h1>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4">
          <p className="text-sm text-green-700 dark:text-green-200">
            If an account exists with this email, a password reset link has been sent to your inbox.
            Please check your email and follow the instructions to reset your password.
          </p>
        </div>

        {/* Additional Help Text */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            If you don&apos;t receive an email within a few minutes, please check your spam folder.
          </p>
        </div>

        {/* Back to Login Link */}
        <Link
          href="/auth/login"
          className="block text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your email address to receive a password reset link
        </p>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-sm text-red-700 dark:text-red-200">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
            Email Address
          </Label>
          <Input
            {...register('email')}
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            className={errors.email ? 'border-red-500 dark:border-red-500' : ''}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500 dark:text-red-400">
              {errors.email.message}
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
              Sending...
            </>
          ) : (
            'Send Reset Link'
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
