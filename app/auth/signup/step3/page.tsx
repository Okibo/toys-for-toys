/**
 * app/auth/signup/step3/page.tsx
 *
 * Signup Step 3: Explicit GDPR Consent
 * Collects parent's consent for storing child data.
 * Must explicitly check consent (no pre-checked boxes).
 */

import React from 'react';
import { ConsentForm } from './ConsentForm';

export const metadata = {
  title: 'Confirm your consent | Toys for Toys',
  description: 'Explicit GDPR consent for child data storage',
};

export default function SignupStep3Page(): React.ReactNode {
  return <ConsentForm />;
}
