/**
 * app/auth/signup/step2/page.tsx
 *
 * Signup Step 2: Child Profile Creation
 * Allows parent to add multiple children (up to 5) with name, age, interests, and allergies.
 */

import React from 'react';
import { ChildProfileForm } from './ChildProfileForm';

export const metadata = {
  title: 'Tell us about your children | Toys for Toys',
  description: 'Create child profiles for toy matching',
};

export default function SignupStep2Page(): React.ReactNode {
  return <ChildProfileForm />;
}
