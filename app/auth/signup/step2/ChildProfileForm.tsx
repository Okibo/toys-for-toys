/**
 * app/auth/signup/step2/ChildProfileForm.tsx
 *
 * Child profile form component for Step 2.
 * Allows adding/removing multiple children with validation.
 * Uses React Hook Form for form state and Zod for validation.
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import {
  signupStep2FormSchema,
  type SignupStep2FormData,
  CHILD_INTERESTS,
  calculateChildAge,
} from '@/lib/auth-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignupContext } from '@/lib/signup-context';

export function ChildProfileForm(): React.ReactNode {
  const router = useRouter();
  const { step2Data, updateStep2Data } = useSignupContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    control,
  } = useForm<SignupStep2FormData>({
    resolver: zodResolver(signupStep2FormSchema),
    mode: 'onChange',
    defaultValues: {
      children:
        step2Data.children.length > 0
          ? step2Data.children
          : [{ name: '', birthDate: '', interests: [], allergies: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });

  const childrenWatch = watch('children');

  const canAddChild = childrenWatch.length < 5 && isValid;

  const handleAddChild = useCallback(() => {
    if (canAddChild) {
      append({
        name: '',
        birthDate: '',
        interests: [],
        allergies: '',
      });
    }
  }, [append, canAddChild]);

  const handleRemoveChild = useCallback(
    (index: number) => {
      if (fields.length > 1) {
        remove(index);
      }
    },
    [remove, fields.length]
  );

  const onSubmit = async (data: SignupStep2FormData): Promise<void> => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // Update context with Step 2 data
      updateStep2Data({
        children: data.children,
      });

      // Call API to validate and store Step 2 data in session
      const response = await fetch('/api/auth/signup/step2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          children: data.children,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setApiError(result.error || 'Failed to save child profiles. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Redirect to Step 3
      router.push('/auth/signup/step3');
    } catch (error) {
      setApiError('An error occurred. Please try again.');
      setIsSubmitting(false);
      console.error('Step 2 submit error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Tell us about your children
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Step 2 of 3</p>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-sm text-red-700 dark:text-red-200">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Children Forms */}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4"
          >
            {/* Child Number */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Child {index + 1} of {fields.length}
              </h2>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveChild(index)}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  aria-label={`Remove child ${index + 1}`}
                >
                  Remove Child
                </button>
              )}
            </div>

            {/* Child Name */}
            <div className="space-y-2">
              <Label
                htmlFor={`children.${index}.name`}
                className="text-gray-700 dark:text-gray-300"
              >
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register(`children.${index}.name`)}
                id={`children.${index}.name`}
                type="text"
                placeholder="e.g., Emma Smith"
                disabled={isSubmitting}
                className={
                  errors.children?.[index]?.name ? 'border-red-500 dark:border-red-500' : ''
                }
                aria-describedby={
                  errors.children?.[index]?.name ? `child-${index}-name-error` : undefined
                }
                aria-required="true"
              />
              {errors.children?.[index]?.name && (
                <p
                  id={`child-${index}-name-error`}
                  className="text-sm text-red-500 dark:text-red-400"
                >
                  {errors.children[index]?.name?.message}
                </p>
              )}
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label
                htmlFor={`children.${index}.birthDate`}
                className="text-gray-700 dark:text-gray-300"
              >
                Birth Date <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                <Input
                  {...register(`children.${index}.birthDate`)}
                  id={`children.${index}.birthDate`}
                  type="date"
                  disabled={isSubmitting}
                  className={
                    errors.children?.[index]?.birthDate ? 'border-red-500 dark:border-red-500' : ''
                  }
                  aria-describedby={
                    errors.children?.[index]?.birthDate
                      ? `child-${index}-birthdate-error`
                      : undefined
                  }
                  aria-required="true"
                />
                {childrenWatch[index]?.birthDate && !errors.children?.[index]?.birthDate && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Age: {calculateChildAge(childrenWatch[index].birthDate)} years old
                  </p>
                )}
              </div>
              {errors.children?.[index]?.birthDate && (
                <p
                  id={`child-${index}-birthdate-error`}
                  className="text-sm text-red-500 dark:text-red-400"
                >
                  {errors.children[index]?.birthDate?.message}
                </p>
              )}
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <label className="text-gray-700 dark:text-gray-300">
                Interests <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CHILD_INTERESTS.map((interest) => (
                  <div key={interest.value} className="flex items-center">
                    <input
                      {...register(`children.${index}.interests`)}
                      type="checkbox"
                      value={interest.value}
                      id={`children-${index}-interests-${interest.value}`}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 cursor-pointer"
                    />
                    <label
                      htmlFor={`children-${index}-interests-${interest.value}`}
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {interest.label}
                    </label>
                  </div>
                ))}
              </div>
              {errors.children?.[index]?.interests && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {errors.children[index]?.interests?.message}
                </p>
              )}
            </div>

            {/* Allergies/Safety Notes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allergies / Safety Notes
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {(childrenWatch[index]?.allergies || '').length}/500
                </span>
              </div>
              <textarea
                {...register(`children.${index}.allergies`)}
                id={`children.${index}.allergies`}
                placeholder="e.g., peanut allergy, nut sensitivity"
                disabled={isSubmitting}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                  errors.children?.[index]?.allergies
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.children?.[index]?.allergies && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {errors.children[index]?.allergies?.message}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Add Another Child Button */}
        {fields.length < 5 && (
          <button
            type="button"
            onClick={handleAddChild}
            disabled={!canAddChild || isSubmitting}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            + Add Another Child
          </button>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">
                <span className="inline-block animate-spin">⏳</span>
              </span>
              Saving...
            </>
          ) : (
            'Continue to Consent'
          )}
        </Button>
      </form>

      {/* Back Link */}
      <div className="text-center">
        <Link
          href="/auth/signup"
          className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Back to Email Setup
        </Link>
      </div>
    </div>
  );
}
