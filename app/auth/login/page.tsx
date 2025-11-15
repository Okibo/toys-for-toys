'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Login page component
 * URL: /auth/login
 * Provides login form with email/password authentication
 * Redirects to dashboard on successful login
 */
export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
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

        <LoginForm
          onSuccess={() => {
            // Redirect to dashboard after successful login
            router.push('/dashboard');
          }}
          onError={(error: string) => {
            // Error is already displayed in the form
            console.error('Login error:', error);
          }}
          className="bg-white rounded-lg shadow-md p-6"
        />
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          This is a secure platform for exchanging toys. Your data is protected.
        </p>
      </div>
    </div>
  );
}
