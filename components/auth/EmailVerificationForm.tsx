import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEmailVerification } from '@/lib/hooks/useEmailVerification';
import CodeInput from './CodeInput';
import ResendButton from './ResendButton';

interface EmailVerificationFormProps {
  initialEmail?: string;
  onSuccess?: () => void;
  className?: string;
}

/**
 * Email verification form with 6-digit code input
 * Supports auto-verification via URL parameter and code resend with countdown
 */
export const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  initialEmail,
  onSuccess,
  className = ''
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams?.get('code') || '';

  const {
    code,
    email,
    isLoading,
    isSuccess,
    apiError,
    canResend,
    resendCountdown,
    updateCode,
    verifyCode,
    resendCode
  } = useEmailVerification(initialEmail);

  /**
   * Auto-verify if code is in URL
   */
  useEffect(() => {
    if (codeFromUrl && codeFromUrl.length === 6) {
      updateCode(codeFromUrl);
      // Verify code after state updates
      const timer = setTimeout(() => {
        verifyCode();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [codeFromUrl, updateCode, verifyCode]);

  /**
   * Redirect to login on success
   */
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/auth/login');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router, onSuccess]);

  // Show success message
  if (isSuccess) {
    return (
      <div className={`max-w-md mx-auto p-6 ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Email Verified!</h2>
          <p className="text-green-700">
            Your email has been verified successfully. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
      <p className="text-gray-600 mb-6">
        Enter the 6-digit verification code sent to{' '}
        <span className="font-medium text-gray-900">{email}</span>
      </p>

      {/* API Error */}
      {apiError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium">{apiError}</p>
        </div>
      )}

      {/* Code Input */}
      <div className="mb-6 flex justify-center">
        <CodeInput
          code={code}
          onCodeChange={updateCode}
          onComplete={verifyCode}
          disabled={isLoading}
          length={6}
          autoFocus
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={verifyCode}
        disabled={isLoading || code.length !== 6}
        className={`
          w-full px-4 py-2 font-medium text-white rounded-lg
          transition-colors focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:ring-offset-2
          ${
            isLoading || code.length !== 6
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
          }
        `}
      >
        {isLoading ? 'Verifying...' : 'Verify'}
      </button>

      {/* Resend Button */}
      <div className="mt-4 text-center">
        <ResendButton
          onResend={resendCode}
          canResend={canResend}
          countdown={resendCountdown}
          isLoading={isLoading}
        />
      </div>

      {/* Help Text */}
      <p className="mt-6 text-center text-sm text-gray-600">
        Code expires in 24 hours. If you don't see the email, check your spam folder.
      </p>
    </div>
  );
};

export default EmailVerificationForm;
