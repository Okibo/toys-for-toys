'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConsentForm from '@/components/auth/ConsentForm';

/**
 * Consent page for parental/user consent and GDPR compliance
 * Path: /auth/consent
 * Displayed after email verification in the signup flow
 * Requires email verification to be completed first
 * Shows: Terms of Service, Privacy Policy, Behavioral Analytics
 */
export default function ConsentPage() {
  const router = useRouter();
  const [isEmailVerified, setIsEmailVerified] = useState(true); // TODO: Check actual verification status

  const handleConsentSuccess = () => {
    // Redirect to dashboard after successful consent
    router.push('/dashboard');
  };

  const handleConsentDecline = () => {
    // Redirect to login if user declines
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-8">
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
        <ConsentForm
          onSuccess={handleConsentSuccess}
          onDecline={handleConsentDecline}
        />

        {/* Footer */}
        <p className="mt-8 text-xs text-center text-gray-500">
          This page complies with GDPR and other privacy regulations. All your data is processed securely.
        </p>
      </div>
    </div>
  );
}
