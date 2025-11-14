import type { Metadata } from 'next';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Toys for Toys',
  description:
    'The Eco-Friendly, Cashless Toy Exchange Platform. Give a toy, get a ticket, take a toy.',
  keywords: ['toy-exchange', 'cashless', 'eco-friendly', 'marketplace'],
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
