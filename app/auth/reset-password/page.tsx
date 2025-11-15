'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

/**
 * Reset password page component
 * URL: /auth/reset-password?token=xxx&email=yyy
 * Provides form for completing password reset flow
 * Validates token before showing form
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  const token = searchParams?.get('token') || '';
  const email = searchParams?.get('email') || '';

  useEffect(() => {
    // Check if token and email are present in URL
    if (!token || !email) {
      router.push('/auth/forgot-password');
      return;
    }
    setIsReady(true);
  }, [token, email, router]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Toy for Toy</h1>
          <p className="text-gray-600">Exchange toys, share joy</p>
        </div>

        <ResetPasswordForm
          token={token}
          email={email}
          onSuccess={() => {
            // Redirect to login after successful password reset
            router.push('/auth/login?reset=success');
          }}
          onError={(error: string) => {
            // Error is already displayed in the form
            console.error('Reset password error:', error);
          }}
          className="bg-white rounded-lg shadow-md p-6"
        />
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Having trouble? Contact our support team for assistance.
        </p>
      </div>
    </div>
  );
}
