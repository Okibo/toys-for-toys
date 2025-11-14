/**
 * app/auth/reset-password/page.tsx
 *
 * Password reset request page.
 * Users can request a password reset email.
 */

import React from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata = {
  title: 'Reset Password | Toys for Toys',
  description: 'Request a password reset link',
};

export default function ResetPasswordPage(): React.ReactNode {
  return <ResetPasswordForm />;
}
