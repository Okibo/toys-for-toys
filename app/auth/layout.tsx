/**
 * app/auth/layout.tsx
 *
 * Shared layout for authentication pages.
 * Provides consistent styling and structure for login, signup, and password reset pages.
 * Wraps signup flow with SignupProvider for multi-step state management.
 */

import React from 'react';
import { SignupProvider } from '@/lib/signup-context';

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <SignupProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </SignupProvider>
  );
}
