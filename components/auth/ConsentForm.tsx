'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConsent } from '@/lib/hooks/useConsent';

interface ConsentFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onDecline?: () => void;
  className?: string;
}

/**
 * ConsentForm component for parental/user consent with GDPR compliance
 * Manages 3 consent checkboxes: Terms of Service, Privacy Policy, Behavioral Analytics
 * Required fields: privacy_policy, terms_of_service
 * Optional: behavioral_analytics
 */
export const ConsentForm: React.FC<ConsentFormProps> = ({
  onSuccess,
  onError,
  onDecline,
  className = ''
}) => {
  const router = useRouter();
  const {
    formState,
    errors,
    isLoading,
    isSuccess,
    successMessage,
    apiError,
    updateField,
    submit,
    reset
  } = useConsent();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    }
    router.push('/auth/login');
  };

  // Show success message
  if (isSuccess) {
    return (
      <div className={`max-w-2xl mx-auto p-6 ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Success!</h2>
          <p className="text-green-700">{successMessage}</p>
          <p className="text-sm text-green-600 mt-2">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Review & Accept Terms
        </h1>
        <p className="text-gray-600">
          Before you continue, please review and accept our terms and policies. All fields marked with * are required.
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium">{apiError}</p>
        </div>
      )}

      {/* Consent Sections */}
      <div className="space-y-4 mb-6">
        {/* Terms of Service - Required */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('terms')}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            aria-expanded={expandedSections['terms']}
            aria-controls="terms-content"
          >
            <div className="flex items-center gap-3 text-left">
              <input
                type="checkbox"
                id="terms_of_service"
                name="terms_of_service"
                checked={formState.terms_of_service}
                onChange={e => updateField('terms_of_service', e.target.checked)}
                disabled={isLoading}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer focus:ring-2 focus:ring-blue-500"
                aria-label="I accept the Terms of Service"
                aria-invalid={!!errors.terms_of_service}
                aria-describedby={errors.terms_of_service ? 'terms-error' : undefined}
              />
              <label
                htmlFor="terms_of_service"
                className="flex-1 text-sm font-medium text-gray-900 cursor-pointer"
              >
                I accept the Terms of Service
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedSections['terms'] ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>

          {/* Expanded content */}
          {expandedSections['terms'] && (
            <div
              id="terms-content"
              className="px-4 py-4 bg-white border-t border-gray-200 max-h-64 overflow-y-auto"
            >
              <div className="prose prose-sm max-w-none text-gray-700">
                <h3 className="text-lg font-semibold mb-2">Terms of Service</h3>
                <p className="mb-3">
                  By using Toy-for-Toy, you agree to these terms and conditions.
                </p>
                <h4 className="font-semibold mt-4 mb-2">1. License</h4>
                <p className="mb-3">
                  We grant you a limited, non-exclusive, non-transferable license to use our service.
                </p>
                <h4 className="font-semibold mt-4 mb-2">2. User Responsibilities</h4>
                <p className="mb-3">
                  You agree to use the service only for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use and enjoyment of the service.
                </p>
                <h4 className="font-semibold mt-4 mb-2">3. Content</h4>
                <p className="mb-3">
                  You are responsible for any content you post. We reserve the right to remove any content that violates these terms.
                </p>
              </div>
            </div>
          )}

          {errors.terms_of_service && (
            <div id="terms-error" className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-red-600 text-sm">{errors.terms_of_service}</p>
            </div>
          )}
        </div>

        {/* Privacy Policy - Required */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('privacy')}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            aria-expanded={expandedSections['privacy']}
            aria-controls="privacy-content"
          >
            <div className="flex items-center gap-3 text-left">
              <input
                type="checkbox"
                id="privacy_policy"
                name="privacy_policy"
                checked={formState.privacy_policy}
                onChange={e => updateField('privacy_policy', e.target.checked)}
                disabled={isLoading}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer focus:ring-2 focus:ring-blue-500"
                aria-label="I accept the Privacy Policy"
                aria-invalid={!!errors.privacy_policy}
                aria-describedby={errors.privacy_policy ? 'privacy-error' : undefined}
              />
              <label
                htmlFor="privacy_policy"
                className="flex-1 text-sm font-medium text-gray-900 cursor-pointer"
              >
                I accept the Privacy Policy
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedSections['privacy'] ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>

          {/* Expanded content */}
          {expandedSections['privacy'] && (
            <div
              id="privacy-content"
              className="px-4 py-4 bg-white border-t border-gray-200 max-h-64 overflow-y-auto"
            >
              <div className="prose prose-sm max-w-none text-gray-700">
                <h3 className="text-lg font-semibold mb-2">Privacy Policy</h3>
                <p className="mb-3">
                  Your privacy is important to us. This policy explains how we collect, use, and protect your data.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Data Collection</h4>
                <p className="mb-3">
                  We collect information you provide directly (account creation, profile) and automatically (usage data, device info).
                </p>
                <h4 className="font-semibold mt-4 mb-2">Data Protection</h4>
                <p className="mb-3">
                  We use industry-standard encryption and security measures to protect your data. Your data is stored securely in our database.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Your Rights</h4>
                <p className="mb-3">
                  Under GDPR, you have the right to access, correct, or delete your data. You can also withdraw consent at any time.
                </p>
              </div>
            </div>
          )}

          {errors.privacy_policy && (
            <div id="privacy-error" className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-red-600 text-sm">{errors.privacy_policy}</p>
            </div>
          )}
        </div>

        {/* Behavioral Analytics - Optional */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('analytics')}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            aria-expanded={expandedSections['analytics']}
            aria-controls="analytics-content"
          >
            <div className="flex items-center gap-3 text-left">
              <input
                type="checkbox"
                id="behavioral_analytics"
                name="behavioral_analytics"
                checked={formState.behavioral_analytics}
                onChange={e => updateField('behavioral_analytics', e.target.checked)}
                disabled={isLoading}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer focus:ring-2 focus:ring-blue-500"
                aria-label="Allow behavioral analytics"
              />
              <label
                htmlFor="behavioral_analytics"
                className="flex-1 text-sm font-medium text-gray-900 cursor-pointer"
              >
                Allow behavioral analytics (optional)
              </label>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedSections['analytics'] ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>

          {/* Expanded content */}
          {expandedSections['analytics'] && (
            <div
              id="analytics-content"
              className="px-4 py-4 bg-white border-t border-gray-200 max-h-64 overflow-y-auto"
            >
              <div className="prose prose-sm max-w-none text-gray-700">
                <h3 className="text-lg font-semibold mb-2">Behavioral Analytics</h3>
                <p className="mb-3">
                  We use analytics to understand how users interact with our platform and improve the experience.
                </p>
                <h4 className="font-semibold mt-4 mb-2">What We Track</h4>
                <p className="mb-3">
                  Page views, clicks, time spent on pages, device type, browser information, and general location (city level only).
                </p>
                <h4 className="font-semibold mt-4 mb-2">Purpose</h4>
                <p className="mb-3">
                  To improve our service, fix bugs, understand user behavior, and provide personalized recommendations.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Your Control</h4>
                <p className="mb-3">
                  You can withdraw this consent at any time in your account settings without affecting your ability to use the platform.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 mb-6">
        <button
          type="submit"
          disabled={isLoading || !formState.privacy_policy || !formState.terms_of_service}
          className={`
            flex-1 px-4 py-2 font-medium text-white rounded-lg
            transition-colors focus:outline-none focus:ring-2
            focus:ring-blue-500 focus:ring-offset-2
            ${
              isLoading || !formState.privacy_policy || !formState.terms_of_service
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
            }
          `}
          aria-label="I Accept & Continue - will submit consent forms"
        >
          {isLoading ? 'Processing...' : 'I Accept & Continue'}
        </button>

        <button
          type="button"
          onClick={handleDecline}
          disabled={isLoading}
          className={`
            flex-1 px-4 py-2 font-medium rounded-lg border
            transition-colors focus:outline-none focus:ring-2
            focus:ring-red-500 focus:ring-offset-2
            ${
              isLoading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-red-300 text-red-600 hover:bg-red-50 active:bg-red-100'
            }
          `}
          aria-label="Decline and exit - will redirect to login"
        >
          Decline and Exit
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-center text-gray-500">
        By accepting, you acknowledge that you have read and agree to our terms and policies.
        You can withdraw optional consents (analytics) in your account settings at any time.
      </p>
    </form>
  );
};

export default ConsentForm;
