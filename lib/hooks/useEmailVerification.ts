import { useState, useCallback, useEffect } from 'react';
import type { VerifyEmailRequest, VerifyEmailResponse, VerifyEmailErrorResponse, ResendVerificationResponse, ResendVerificationErrorResponse } from '@/lib/auth/types';

export interface UseEmailVerificationReturn {
  code: string;
  email: string;
  isLoading: boolean;
  isSuccess: boolean;
  apiError: string | null;
  canResend: boolean;
  resendCountdown: number;
  updateCode: (value: string) => void;
  verifyCode: () => Promise<void>;
  resendCode: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing email verification flow
 * Handles code submission, resend logic, and rate limiting
 */
export function useEmailVerification(initialEmail?: string): UseEmailVerificationReturn {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);

  /**
   * Countdown timer for resend button
   */
  useEffect(() => {
    if (resendCountdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setResendCountdown(resendCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCountdown]);

  /**
   * Initialize email from session storage if not provided
   */
  useEffect(() => {
    if (!email) {
      const storedEmail = sessionStorage.getItem('signupEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [email]);

  /**
   * Update verification code (6 digits)
   */
  const updateCode = useCallback((value: string) => {
    // Only allow digits and limit to 6 characters
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setCode(sanitized);
    // Clear error when user types
    if (apiError) {
      setApiError(null);
    }
  }, [apiError]);

  /**
   * Verify the 6-digit code
   */
  const verifyCode = useCallback(async (): Promise<void> => {
    setApiError(null);
    setIsSuccess(false);

    // Validate code format
    if (code.length !== 6) {
      setApiError('Verification code must be 6 digits');
      return;
    }

    if (!email) {
      setApiError('Email address is required');
      return;
    }

    setIsLoading(true);

    try {
      const payload: VerifyEmailRequest = {
        code,
        email
      };

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as VerifyEmailResponse | VerifyEmailErrorResponse;

      if (!response.ok || !data.success) {
        const errorResponse = data as VerifyEmailErrorResponse;
        setApiError(errorResponse.error.message);
        return;
      }

      // Success
      setIsSuccess(true);
      // Clear stored email
      sessionStorage.removeItem('signupEmail');
    } catch (error) {
      console.error('Verification error:', error);
      setApiError('An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [code, email]);

  /**
   * Resend verification code
   * Rate limited to 3 per 24 hours
   */
  const resendCode = useCallback(async (): Promise<void> => {
    setApiError(null);

    if (!email) {
      setApiError('Email address is required');
      return;
    }

    setCanResend(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = (await response.json()) as ResendVerificationResponse | ResendVerificationErrorResponse;

      if (!response.ok || !data.success) {
        const errorResponse = data as ResendVerificationErrorResponse;
        setApiError(errorResponse.error.message);
        setCanResend(true);
        return;
      }

      // Success - start countdown (60 seconds before can resend again)
      setResendCountdown(60);
      setCode(''); // Clear previous code
    } catch (error) {
      console.error('Resend error:', error);
      setApiError('An error occurred. Please try again.');
      setCanResend(true);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setCode('');
    setIsLoading(false);
    setIsSuccess(false);
    setApiError(null);
    setCanResend(true);
    setResendCountdown(0);
  }, []);

  return {
    code,
    email,
    isLoading,
    isSuccess,
    apiError,
    canResend,
    resendCountdown,
    updateCode,
    verifyCode,
    resendCode,
    reset
  };
}
