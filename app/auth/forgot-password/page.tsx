'use client';

import React from 'react';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

/**
 * Forgot password page component
 * URL: /auth/forgot-password
 * Provides form for initiating password reset flow
 * Sends reset link to user email
 */
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Toy for Toy</h1>
          <p className="text-gray-600">Exchange toys, share joy</p>
        </div>

        <ForgotPasswordForm
          onSuccess={() => {
            // Success message is shown in the form
            console.log('Password reset link sent');
          }}
          onError={(error: string) => {
            // Error is already displayed in the form
            console.error('Forgot password error:', error);
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
