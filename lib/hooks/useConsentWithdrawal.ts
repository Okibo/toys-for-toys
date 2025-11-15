import { useState, useCallback } from 'react';
import type { UseConsentWithdrawalReturn } from '@/lib/auth/consent-types';

/**
 * Custom hook for managing consent withdrawal (opt-out)
 * Allows users to withdraw consent for behavioral analytics
 */
export function useConsentWithdrawal(): UseConsentWithdrawalReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const withdraw = useCallback(
    async (consentType: 'behavioral_analytics'): Promise<void> => {
      // Reset previous states
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      setSuccessMessage('');

      try {
        const response = await fetch('/api/auth/consent/withdraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            consent_type: consentType
          })
        });

        const data = (await response.json()) as any;

        if (!response.ok || !data.success) {
          setError(data.error?.message || 'Failed to withdraw consent');
          setIsLoading(false);
          return;
        }

        // Success
        setIsSuccess(true);
        setSuccessMessage(data.data?.message || 'Consent withdrawn successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('Consent withdrawal error:', err);
        setError('An error occurred while withdrawing consent. Please try again.');
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    isSuccess,
    error,
    successMessage,
    withdraw
  };
}
