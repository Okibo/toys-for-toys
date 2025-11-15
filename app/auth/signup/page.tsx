'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SignupForm from '@/components/auth/SignupForm';

/**
 * Signup page
 * Path: /auth/signup
 * Handles user registration with email, password, and language preference
 */
export default function SignupPage() {
  const router = useRouter();

  const handleSignupSuccess = () => {
    // Redirect to email verification page after successful signup
    router.push('/auth/verify-email');
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
        <SignupForm onSuccess={handleSignupSuccess} />

        {/* Footer */}
        <p className="mt-8 text-xs text-center text-gray-500">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
