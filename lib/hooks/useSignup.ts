import { useState, useCallback } from 'react';
import { validateEmail, validatePassword } from '@/lib/auth/email-validator';
import { validatePassword as validatePasswordStrength } from '@/lib/auth/password-validator';
import type { SignupRequest, SignupResponse, SignupErrorResponse } from '@/lib/auth/types';

export interface SignupFormState {
  email: string;
  password: string;
  passwordConfirm: string;
  language: string;
}

export interface SignupFieldErrors {
  email?: string[];
  password?: string[];
  passwordConfirm?: string[];
}

export interface UseSignupReturn {
  formState: SignupFormState;
  errors: SignupFieldErrors;
  isLoading: boolean;
  isSuccess: boolean;
  successMessage: string;
  apiError: string | null;
  updateField: (field: keyof SignupFormState, value: string) => void;
  validateForm: () => boolean;
  submit: () => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: SignupFormState = {
  email: '',
  password: '',
  passwordConfirm: '',
  language: 'en'
};

/**
 * Custom hook for managing signup form state and API integration
 * Handles form validation, submission, and error management
 */
export function useSignup(): UseSignupReturn {
  const [formState, setFormState] = useState<SignupFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<SignupFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Update a single form field
   */
  const updateField = useCallback((field: keyof SignupFormState, value: string) => {
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
    const newErrors: SignupFieldErrors = {};

    // Validate email
    const emailValidation = validateEmail(formState.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors;
    }

    // Validate password
    const passwordValidation = validatePasswordStrength(formState.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors;
    }

    // Validate password confirmation
    if (formState.password !== formState.passwordConfirm) {
      newErrors.passwordConfirm = ['Passwords do not match'];
    } else if (formState.passwordConfirm.length === 0) {
      newErrors.passwordConfirm = ['Please confirm your password'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  /**
   * Submit signup form to API
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
      const payload: SignupRequest = {
        email: formState.email,
        password: formState.password,
        language: formState.language
      };

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as SignupResponse | SignupErrorResponse;

      if (!response.ok || !data.success) {
        const errorResponse = data as SignupErrorResponse;
        setApiError(errorResponse.error.message);
        return;
      }

      // Success
      setIsSuccess(true);
      setSuccessMessage('Verification email sent. Check your inbox.');
      // Store email for verification page
      sessionStorage.setItem('signupEmail', formState.email);
    } catch (error) {
      console.error('Signup error:', error);
      setApiError('An error occurred during signup. Please try again.');
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
