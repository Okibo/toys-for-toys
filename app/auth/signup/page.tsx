/**
 * app/auth/signup/page.tsx
 *
 * Signup page component (Step 1 of 3).
 * Renders the signup form in the auth layout.
 */

import React from 'react';
import { SignupForm } from './SignupForm';

export const metadata = {
  title: 'Sign Up | Toys for Toys',
  description: 'Create a new Toys for Toys account',
};

export default function SignupPage(): React.ReactNode {
  return <SignupForm />;
}
