/**
 * app/auth/signup/SignupForm.tsx
 *
 * Signup form component with email, password, confirm password, and full name fields.
 * Includes password strength indicator and async email existence check.
 * Uses React Hook Form for state management and Zod for validation.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import {
  signupFormSchema,
  type SignupFormData,
  getPasswordStrength,
  getPasswordStrengthMessage,
  checkEmailExists,
} from '@/lib/auth-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignupContext } from '@/lib/signup-context';

export function SignupForm(): React.ReactNode {
  const router = useRouter();
  const { updateStep1Data } = useSignupContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    watch,
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    mode: 'onChange',
  });

  const email = watch('email');
  const password = watch('password');
  const agreeToTerms = watch('agreeToTerms');

  // Debounced email existence check
  useEffect(() => {
    if (!email || errors.email || !touchedFields.email) {
      setEmailExistsError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const exists = await checkEmailExists(email);
        if (exists) {
          setEmailExistsError('Email already registered');
          setError('email', {
            type: 'custom',
            message: 'Email already registered',
          });
        } else {
          setEmailExistsError(null);
          clearErrors('email');
        }
      } catch {
        setEmailExistsError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email, errors.email, touchedFields.email, setError, clearErrors]);

  // Update password strength as user types
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    }
  }, [password]);

  const isFormValid = isValid && !emailExistsError && agreeToTerms && email && password;

  const onSubmit = async (data: SignupFormData): Promise<void> => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // Save Step 1 data to context
      updateStep1Data({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        agreeToTerms: data.agreeToTerms,
      });

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setApiError(result.error || 'Signup failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Signup successful - redirect to next step (Step 2: Child Profiles)
      router.push('/auth/signup/step2');
    } catch (error) {
      setApiError('An error occurred. Please try again.');
      setIsSubmitting(false);
      console.error('Signup error:', error);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
        <p className="text-gray-600 dark:text-gray-400">Step 1 of 3</p>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-sm text-red-700 dark:text-red-200">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">
            Full Name
          </Label>
          <Input
            {...register('fullName')}
            id="fullName"
            type="text"
            placeholder="John Doe"
            disabled={isSubmitting}
            className={errors.fullName ? 'border-red-500 dark:border-red-500' : ''}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-sm text-red-500 dark:text-red-400">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
            Email Address
          </Label>
          <div className="relative">
            <Input
              {...register('email')}
              id="email"
              type="email"
              placeholder="you@example.com"
              disabled={isSubmitting}
              className={
                errors.email || emailExistsError ? 'border-red-500 dark:border-red-500' : ''
              }
              aria-describedby={errors.email || emailExistsError ? 'email-error' : undefined}
            />
            {isCheckingEmail && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <span className="inline-block animate-spin">⏳</span>
              </span>
            )}
          </div>
          {(errors.email || emailExistsError) && (
            <p id="email-error" className="text-sm text-red-500 dark:text-red-400">
              {errors.email?.message || emailExistsError}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
            Password
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

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 pt-2">
          <input
            {...register('agreeToTerms')}
            id="agreeToTerms"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 cursor-pointer"
            aria-describedby={errors.agreeToTerms ? 'terms-error' : undefined}
          />
          <label
            htmlFor="agreeToTerms"
            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
          >
            I agree to the{' '}
            <Link
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Terms of Service
            </Link>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p id="terms-error" className="text-sm text-red-500 dark:text-red-400">
            {errors.agreeToTerms.message}
          </p>
        )}

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
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
