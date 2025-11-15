'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import EmailVerificationForm from '@/components/auth/EmailVerificationForm';

/**
 * Email verification page
 * Path: /auth/verify-email
 * Handles email verification with 6-digit code input
 * Supports auto-verification via URL parameter (?code=123456)
 */
export default function VerifyEmailPage() {
  const router = useRouter();

  const handleVerificationSuccess = () => {
    // Redirect to login after successful verification
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Toy-for-Toy
          </h1>
          <p className="text-gray-600">
            Exchange toys sustainably, no money needed!
          </p>
        </div>

        {/* Form */}
        <EmailVerificationForm onSuccess={handleVerificationSuccess} />

        {/* Footer */}
        <p className="mt-8 text-xs text-center text-gray-500">
          By verifying your email, you confirm you're the owner of this email address
        </p>
      </div>
    </div>
  );
}
