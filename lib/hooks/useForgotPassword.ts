import { useState, useCallback } from 'react';
import { validateEmail } from '@/lib/auth/email-validator';
import type { ForgotPasswordRequest, ForgotPasswordResponse, ForgotPasswordErrorResponse } from '@/lib/auth/types';

export interface ForgotPasswordFormState {
  email: string;
}

export interface ForgotPasswordFieldErrors {
  email?: string[];
}

export interface ForgotPasswordSubmitResult {
  success: boolean;
  error?: string;
}

export interface UseForgotPasswordReturn {
  formState: ForgotPasswordFormState;
  errors: ForgotPasswordFieldErrors;
  isLoading: boolean;
  isSuccess: boolean;
  successMessage: string;
  apiError: string | null;
  updateField: (field: keyof ForgotPasswordFormState, value: string) => void;
  validateForm: () => boolean;
  submit: () => Promise<ForgotPasswordSubmitResult>;
  reset: () => void;
}

const INITIAL_STATE: ForgotPasswordFormState = {
  email: ''
};

/**
 * Custom hook for managing forgot password form state and API integration
 * Handles email validation and password reset request submission
 */
export function useForgotPassword(): UseForgotPasswordReturn {
  const [formState, setFormState] = useState<ForgotPasswordFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ForgotPasswordFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Update a single form field
   */
  const updateField = useCallback((field: keyof ForgotPasswordFormState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear field errors when user starts typing
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  }, []);

  /**
   * Validate the entire form before submission
   * Returns true if all validations pass
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: ForgotPasswordFieldErrors = {};

    // Validate email
    const emailValidation = validateEmail(formState.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  /**
   * Submit forgot password form to API
   */
  const submit = useCallback(async (): Promise<ForgotPasswordSubmitResult> => {
    // Reset previous errors
    setApiError(null);
    setIsSuccess(false);

    // Validate form
    if (!validateForm()) {
      return { success: false, error: 'Please fix the errors above' };
    }

    setIsLoading(true);

    try {
      const request: ForgotPasswordRequest = {
        email: formState.email
      };

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const data: ForgotPasswordResponse | ForgotPasswordErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as ForgotPasswordErrorResponse;
        const errorMessage =
          errorData.error ||
          (errorData.details && typeof errorData.details === 'string'
            ? errorData.details
            : 'Failed to send reset link');
        setApiError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const successData = data as ForgotPasswordResponse;
      setIsSuccess(true);
      setSuccessMessage(
        successData.message || `Password reset link sent to ${formState.email}`
      );
      setFormState(INITIAL_STATE);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setApiError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [formState, validateForm]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setFormState(INITIAL_STATE);
    setErrors({});
    setApiError(null);
    setIsSuccess(false);
    setSuccessMessage('');
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
