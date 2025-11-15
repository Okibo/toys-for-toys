import { useState, useCallback, useEffect } from 'react';
import { validatePassword } from '@/lib/auth/password-validator';
import type { ResetPasswordRequest, ResetPasswordResponse, ResetPasswordErrorResponse } from '@/lib/auth/types';

export interface ResetPasswordFormState {
  password: string;
  passwordConfirm: string;
}

export interface ResetPasswordFieldErrors {
  password?: string[];
  passwordConfirm?: string[];
}

export interface ResetPasswordSubmitResult {
  success: boolean;
  error?: string;
}

export interface UseResetPasswordReturn {
  formState: ResetPasswordFormState;
  errors: ResetPasswordFieldErrors;
  isLoading: boolean;
  isSuccess: boolean;
  isValidatingToken: boolean;
  tokenError: string | null;
  apiError: string | null;
  updateField: (field: keyof ResetPasswordFormState, value: string) => void;
  validateForm: () => boolean;
  submit: () => Promise<ResetPasswordSubmitResult>;
  reset: () => void;
}

const INITIAL_STATE: ResetPasswordFormState = {
  password: '',
  passwordConfirm: ''
};

/**
 * Custom hook for managing reset password form state and API integration
 * Handles token validation, form validation, and password reset submission
 */
export function useResetPassword(token: string, email: string): UseResetPasswordReturn {
  const [formState, setFormState] = useState<ResetPasswordFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ResetPasswordFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Validate token on mount and when token/email changes
   */
  useEffect(() => {
    const validateToken = async () => {
      setIsValidatingToken(true);
      setTokenError(null);

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token, email })
        });

        if (!response.ok) {
          const data = await response.json();
          setTokenError(data.error || 'Invalid or expired reset token');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to validate token';
        setTokenError(errorMessage);
      } finally {
        setIsValidatingToken(false);
      }
    };

    if (token && email) {
      validateToken();
    }
  }, [token, email]);

  /**
   * Update a single form field
   */
  const updateField = useCallback((field: keyof ResetPasswordFormState, value: string) => {
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
    const newErrors: ResetPasswordFieldErrors = {};

    // Validate password
    const passwordValidation = validatePassword(formState.password);
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
   * Submit reset password form to API
   */
  const submit = useCallback(async (): Promise<ResetPasswordSubmitResult> => {
    // Reset previous errors
    setApiError(null);
    setIsSuccess(false);

    // Validate token first
    if (tokenError) {
      return { success: false, error: tokenError };
    }

    // Validate form
    if (!validateForm()) {
      return { success: false, error: 'Please fix the errors above' };
    }

    setIsLoading(true);

    try {
      const request: ResetPasswordRequest = {
        token,
        email,
        password: formState.password
      };

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const data: ResetPasswordResponse | ResetPasswordErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as ResetPasswordErrorResponse;
        const errorMessage =
          errorData.error ||
          (errorData.details && typeof errorData.details === 'string'
            ? errorData.details
            : 'Failed to reset password');
        setApiError(errorMessage);
        return { success: false, error: errorMessage };
      }

      setIsSuccess(true);
      setFormState(INITIAL_STATE);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setApiError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [token, email, formState, validateForm, tokenError]);

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
    isValidatingToken,
    tokenError,
    apiError,
    updateField,
    validateForm,
    submit,
    reset
  };
}
