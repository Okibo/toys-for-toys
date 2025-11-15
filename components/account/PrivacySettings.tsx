'use client';

import React, { useState } from 'react';
import { useConsentStatus } from '@/lib/hooks/useConsentStatus';
import { useConsentWithdrawal } from '@/lib/hooks/useConsentWithdrawal';

interface PrivacySettingsProps {
  userId?: string;
  onWithdraw?: () => void;
  className?: string;
}

/**
 * PrivacySettings component for managing user consent
 * Shows current consent status and allows withdrawal of behavioral analytics consent
 * Displays consent history with dates and timestamps
 */
export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  userId,
  onWithdraw,
  className = ''
}) => {
  const { consentStatus, isLoading, error, refetch } = useConsentStatus();
  const {
    isLoading: withdrawalLoading,
    isSuccess: withdrawalSuccess,
    error: withdrawalError,
    successMessage,
    withdraw
  } = useConsentWithdrawal();

  const [showWithdrawalConfirm, setShowWithdrawalConfirm] = useState(false);

  const handleWithdrawAnalytics = async () => {
    await withdraw('behavioral_analytics');
    setShowWithdrawalConfirm(false);
    if (onWithdraw) {
      onWithdraw();
    }
    // Refresh consent status after withdrawal
    setTimeout(() => {
      refetch();
    }, 500);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={`max-w-2xl mx-auto p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading consent settings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-2xl mx-auto p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm font-medium">Error: {error}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Privacy Settings
        </h1>
        <p className="text-gray-600">
          Manage your consent preferences and privacy settings. All changes are applied immediately.
        </p>
      </div>

      {/* Success Message */}
      {withdrawalSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{successMessage}</p>
          <p className="text-sm text-green-700 mt-1">
            Analytics collection has been stopped. Your previous analytics data will be retained but no new data will be collected.
          </p>
        </div>
      )}

      {/* Error Message */}
      {withdrawalError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium">Error: {withdrawalError}</p>
        </div>
      )}

      {/* Consent Status Section */}
      {consentStatus && (
        <div className="space-y-6">
          {/* Current Consents */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current Consent Status
            </h2>

            <div className="space-y-4">
              {/* Terms of Service */}
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {consentStatus.terms_of_service ? (
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">Terms of Service</h3>
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">
                      Required
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Accepted on {formatDateTime(consentStatus.created_at)}
                  </p>
                </div>
              </div>

              {/* Privacy Policy */}
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {consentStatus.privacy_policy ? (
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">Privacy Policy</h3>
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">
                      Required
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Accepted on {formatDateTime(consentStatus.created_at)}
                  </p>
                </div>
              </div>

              {/* Behavioral Analytics */}
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {consentStatus.behavioral_analytics && !consentStatus.analytics_withdrawn_at ? (
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">Behavioral Analytics</h3>
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded">
                      Optional
                    </span>
                  </div>
                  {consentStatus.behavioral_analytics && !consentStatus.analytics_withdrawn_at ? (
                    <>
                      <p className="text-sm text-gray-600">
                        Enabled since {formatDateTime(consentStatus.created_at)}
                      </p>
                      <button
                        onClick={() => setShowWithdrawalConfirm(true)}
                        disabled={withdrawalLoading}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {withdrawalLoading ? 'Processing...' : 'Withdraw consent'}
                      </button>
                    </>
                  ) : consentStatus.analytics_withdrawn_at ? (
                    <p className="text-sm text-gray-600">
                      Withdrawn on {formatDateTime(consentStatus.analytics_withdrawn_at)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">Not accepted</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Created */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h2>
            <p className="text-sm text-gray-600">
              Account created on {formatDate(consentStatus.created_at)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Last updated on {formatDate(consentStatus.updated_at)}
            </p>
          </div>

          {/* Legal Links */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Legal Documents
            </h2>
            <div className="space-y-2">
              <a
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Terms of Service
              </a>
              <a
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Privacy Policy
              </a>
              <a
                href="/legal/analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Analytics Policy
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Confirmation Modal */}
      {showWithdrawalConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Withdraw Analytics Consent?
            </h3>
            <p className="text-gray-600 mb-4">
              You are about to withdraw your consent for behavioral analytics collection. This action cannot be undone immediately, but you can re-enable it anytime.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawalConfirm(false)}
                disabled={withdrawalLoading}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawAnalytics}
                disabled={withdrawalLoading}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawalLoading ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySettings;
