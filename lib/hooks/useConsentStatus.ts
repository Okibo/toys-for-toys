import { useState, useCallback, useEffect } from 'react';
import type { ConsentRecord, UseConsentStatusReturn } from '@/lib/auth/consent-types';

/**
 * Custom hook for fetching and managing consent status
 * Retrieves current consent records for the authenticated user
 */
export function useConsentStatus(): UseConsentStatusReturn {
  const [consentStatus, setConsentStatus] = useState<ConsentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsentStatus = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/consent/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = (await response.json()) as any;

      if (!response.ok || !data.success) {
        setError(data.error?.message || 'Failed to fetch consent status');
        return;
      }

      setConsentStatus(data.data);
    } catch (err) {
      console.error('Failed to fetch consent status:', err);
      setError('An error occurred while fetching consent status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch consent status on mount
  useEffect(() => {
    fetchConsentStatus();
  }, [fetchConsentStatus]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchConsentStatus();
  }, [fetchConsentStatus]);

  return {
    consentStatus,
    isLoading,
    error,
    refetch
  };
}
