'use client';

import React from 'react';
import PrivacySettings from '@/components/account/PrivacySettings';

/**
 * Privacy Settings page for logged-in users
 * Path: /account/privacy-settings
 * Allows users to view and manage their consent preferences
 * Shows current consent status and allows analytics consent withdrawal
 * Displays consent history and legal document links
 */
export default function PrivacySettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl">
        <PrivacySettings />
      </div>
    </div>
  );
}
