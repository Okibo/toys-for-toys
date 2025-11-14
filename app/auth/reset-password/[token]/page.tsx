/**
 * app/auth/reset-password/[token]/page.tsx
 *
 * Password reset confirmation page.
 * Users can reset their password using the token from the email link.
 */

'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordTokenForm } from './ResetPasswordTokenForm';

export default function ResetPasswordTokenPage(): React.ReactNode {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  return <ResetPasswordTokenForm token={token} />;
}
