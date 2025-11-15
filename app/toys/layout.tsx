/**
 * Toys Section Layout
 * Provides layout structure for toy-related pages
 */

import { ReactNode } from 'react';

export const metadata = {
  title: 'Toys',
  description: 'Browse, list, and manage toys',
};

interface ToysLayoutProps {
  children: ReactNode;
}

export default function ToysLayout({ children }: ToysLayoutProps) {
  return <>{children}</>;
}
