/**
 * Authentication Section Layout
 * Provides layout structure for authentication pages
 */

import { ReactNode } from 'react';

export const metadata = {
  title: 'Authentication',
  description: 'Sign up, log in, and manage your authentication',
};

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <>{children}</>;
}
