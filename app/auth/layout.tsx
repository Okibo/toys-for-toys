/**
 * app/auth/layout.tsx
 *
 * Shared layout for authentication pages.
 * Provides consistent styling and structure for login, signup, and password reset pages.
 */

import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
