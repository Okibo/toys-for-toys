import { useState, useCallback } from 'react';
import { validateEmail } from '@/lib/auth/email-validator';
import type { LoginRequest, LoginResponse, LoginErrorResponse } from '@/lib/auth/types';

export interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFieldErrors {
  email?: string[];
  password?: string[];
}

export interface LoginSubmitResult {
  success: boolean;
  user_id?: string;
  error?: string;
}

export interface UseLoginReturn {
  formState: LoginFormState;
  errors: LoginFieldErrors;
  isLoading: boolean;
  isSuccess: boolean;
  apiError: string | null;
  updateField: (field: string, value: string | boolean) => void;
  validateForm: () => boolean;
  submit: () => Promise<LoginSubmitResult>;
  reset: () => void;
}

const INITIAL_STATE: LoginFormState = {
  email: '',
  password: '',
  rememberMe: false
};

/**
 * Custom hook for managing login form state and API integration
 * Handles form validation, submission, and error management
 */
export function useLogin(): UseLoginReturn {
  const [formState, setFormState] = useState<LoginFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Update a single form field
   */
  const updateField = useCallback((field: string, value: string | boolean) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear field errors when user starts typing
    if (field !== 'rememberMe') {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, []);

  /**
   * Validate the entire form before submission
   * Returns true if all validations pass
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: LoginFieldErrors = {};

    // Validate email
    const emailValidation = validateEmail(formState.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors;
    }

    // Validate password
    if (!formState.password || formState.password.trim().length === 0) {
      newErrors.password = ['Password is required'];
    } else if (formState.password.length < 6) {
      newErrors.password = ['Password must be at least 6 characters'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  /**
   * Submit login form to API
   */
  const submit = useCallback(async (): Promise<LoginSubmitResult> => {
    // Reset previous errors
    setApiError(null);
    setIsSuccess(false);

    // Validate form
    if (!validateForm()) {
      return { success: false, error: 'Please fix the errors above' };
    }

    setIsLoading(true);

    try {
      const request: LoginRequest = {
        email: formState.email,
        password: formState.password,
        rememberMe: formState.rememberMe
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const data: LoginResponse | LoginErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as LoginErrorResponse;
        const errorMessage =
          errorData.error ||
          (errorData.details && typeof errorData.details === 'string'
            ? errorData.details
            : 'Login failed');
        setApiError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const successData = data as LoginResponse;
      setIsSuccess(true);
      setFormState(INITIAL_STATE);

      return {
        success: true,
        user_id: successData.user_id
      };
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
  }, []);

  return {
    formState,
    errors,
    isLoading,
    isSuccess,
    apiError,
    updateField,
    validateForm,
    submit,
    reset
  };
}
