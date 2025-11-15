import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ConsentFormState, ConsentFieldErrors, UseConsentReturn } from '@/lib/auth/consent-types';

const INITIAL_STATE: ConsentFormState = {
  privacy_policy: false,
  terms_of_service: false,
  behavioral_analytics: false
};

/**
 * Custom hook for managing consent form state and API integration
 * Handles form validation, submission, and error management
 * Validates required fields: privacy_policy, terms_of_service
 * Optional field: behavioral_analytics
 */
export function useConsent(): UseConsentReturn {
  const router = useRouter();
  const [formState, setFormState] = useState<ConsentFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ConsentFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Update a single form field (checkbox value)
   */
  const updateField = useCallback((field: keyof ConsentFormState, value: boolean) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear field errors when user makes changes
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  }, []);

  /**
   * Validate the entire form before submission
   * Returns true if all validations pass
   * Required: privacy_policy and terms_of_service must be checked
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: ConsentFieldErrors = {};

    // Validate required fields
    if (!formState.privacy_policy) {
      newErrors.privacy_policy = 'You must accept the Privacy Policy to continue';
    }

    if (!formState.terms_of_service) {
      newErrors.terms_of_service = 'You must accept the Terms of Service to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  /**
   * Submit consent form to API
   */
  const submit = useCallback(async (): Promise<void> => {
    // Reset previous errors
    setApiError(null);
    setIsSuccess(false);

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        privacy_policy: formState.privacy_policy,
        terms_of_service: formState.terms_of_service,
        behavioral_analytics: formState.behavioral_analytics
      };

      const response = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as any;

      if (!response.ok || !data.success) {
        setApiError(data.error?.message || 'Failed to submit consent');
        return;
      }

      // Success
      setIsSuccess(true);
      setSuccessMessage('Consent recorded successfully. Redirecting...');

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Consent submission error:', error);
      setApiError('An error occurred while submitting your consent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formState, validateForm, router]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setFormState(INITIAL_STATE);
    setErrors({});
    setIsLoading(false);
    setIsSuccess(false);
    setSuccessMessage('');
    setApiError(null);
  }, []);

  return {
    formState,
    errors,
    isLoading,
    isSuccess,
    successMessage,
    apiError,
    updateField,
    validateForm,
    submit,
    reset
  };
}
