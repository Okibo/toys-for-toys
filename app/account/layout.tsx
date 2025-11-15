/**
 * Account Section Layout
 * Provides layout structure for account-related pages
 */

import { ReactNode } from 'react';

export const metadata = {
  title: 'Account Settings',
  description: 'Manage your account settings and preferences',
};

interface AccountLayoutProps {
  children: ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return <>{children}</>;
}
