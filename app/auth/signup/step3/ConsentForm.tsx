/**
 * app/auth/signup/step3/ConsentForm.tsx
 *
 * Consent form component for Step 3 (explicit GDPR consent).
 * Displays child summary and requires explicit consent checkboxes.
 * Uses React Hook Form for form state and Zod for validation.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import {
  signupStep3FormSchema,
  type SignupStep3FormData,
  getConsentTextPl,
  calculateChildAge,
} from '@/lib/auth-validation';
import { Button } from '@/components/ui/button';
import { useSignupContext } from '@/lib/signup-context';

export function ConsentForm(): React.ReactNode {
  const router = useRouter();
  const { step2Data, step3Data, updateStep3Data, resetSignup } = useSignupContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignupStep3FormData>({
    resolver: zodResolver(signupStep3FormSchema),
    mode: 'onChange',
    defaultValues: {
      mainConsent: step3Data.mainConsent,
      marketingConsent: step3Data.marketingConsent,
      language: 'pl' as const,
    },
  });

  const mainConsent = watch('mainConsent');

  const consentText = getConsentTextPl();
  const isFormValid = isValid && mainConsent === true;

  const onSubmit = async (data: SignupStep3FormData): Promise<void> => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // Update context with Step 3 data
      updateStep3Data({
        mainConsent: data.mainConsent,
        marketingConsent: data.marketingConsent,
        language: data.language,
      });

      // Call API to complete signup
      const response = await fetch('/api/auth/signup/step3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mainConsent: data.mainConsent,
          marketingConsent: data.marketingConsent,
          language: data.language,
          consentText,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setApiError(result.error || 'Failed to create account. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Reset signup context for future signups
      resetSignup();

      // Redirect to dashboard
      router.push('/app/dashboard');
    } catch (error) {
      setApiError('An error occurred. Please try again.');
      setIsSubmitting(false);
      console.error('Step 3 submit error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Confirm your consent</h1>
        <p className="text-gray-600 dark:text-gray-400">Step 3 of 3</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          One more step to activate your account
        </p>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-sm text-red-700 dark:text-red-200">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Child Summary */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            You have added {step2Data.children.length} child
            {step2Data.children.length !== 1 ? 'ren' : ''}:
          </h2>

          <ul className="space-y-2">
            {step2Data.children.map((child, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                • {child.name} (age {calculateChildAge(child.birthDate)})
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">
              Here&apos;s what happens next:
            </p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• Your account will be activated</li>
              <li>• You can start listing toys</li>
              <li>• Your children will receive personalized recommendations</li>
              <li>• You&apos;ll receive notifications about toy matches</li>
            </ul>
          </div>
        </div>

        {/* Main Consent Checkbox */}
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-start gap-4">
            <input
              {...register('mainConsent')}
              id="mainConsent"
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 cursor-pointer"
              aria-describedby={errors.mainConsent ? 'consent-error' : undefined}
              aria-required="true"
            />
            <label
              htmlFor="mainConsent"
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
            >
              <span className="font-medium">
                I confirm I am the parent/guardian of the child(ren) listed above and consent to
                Toy-for-Toy storing their profile for toy matching, age-appropriate recommendations,
                and our service features. I understand their data will be stored securely and
                handled according to our{' '}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>
          {errors.mainConsent && (
            <p id="consent-error" className="text-sm text-red-500 dark:text-red-400 ml-9">
              {errors.mainConsent.message}
            </p>
          )}
        </div>

        {/* Marketing Consent Checkbox */}
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <input
              {...register('marketingConsent')}
              id="marketingConsent"
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 cursor-pointer"
            />
            <label
              htmlFor="marketingConsent"
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              I&apos;d like to receive news, offers, and product updates by email
            </label>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
          <p>
            By proceeding, you agree to our{' '}
            <Link
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
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
              Creating account...
            </>
          ) : (
            'Create Account & Activate'
          )}
        </Button>
      </form>

      {/* Back Link */}
      <div className="text-center">
        <Link
          href="/auth/signup/step2"
          className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Back to Children Setup
        </Link>
      </div>
    </div>
  );
}
