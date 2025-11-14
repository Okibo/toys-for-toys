/**
 * app/auth/login/page.tsx
 *
 * Login page component.
 * Renders the login form in the auth layout.
 */

import React from 'react';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Login | Toys for Toys',
  description: 'Sign in to your Toys for Toys account',
};

export default function LoginPage(): React.ReactNode {
  return <LoginForm />;
}
