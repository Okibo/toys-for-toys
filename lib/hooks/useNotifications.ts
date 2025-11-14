/**
 * lib/hooks/useNotifications.ts
 *
 * React hook for managing Firebase Cloud Messaging notifications
 * Handles service worker registration, token management, and message subscription
 *
 * Usage in a component:
 * ```typescript
 * export function MyComponent() {
 *   const { isSupported, isEnabled, isLoading, error, enableNotifications } = useNotifications();
 *
 *   return (
 *     <button onClick={enableNotifications} disabled={!isSupported || isLoading}>
 *       {isEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
 *     </button>
 *   );
 * }
 * ```
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  registerServiceWorker,
  getServiceWorkerStatus,
  type ServiceWorkerStatus,
} from '@/lib/service-worker';
import { requestNotificationToken, subscribeToMessages, type MessagePayload } from '@/lib/firebase';

/**
 * Notification state and handlers
 */
interface UseNotificationsResult {
  /** Whether notifications are supported in this browser */
  isSupported: boolean;

  /** Whether notifications are currently enabled */
  isEnabled: boolean;

  /** Whether notification setup is in progress */
  isLoading: boolean;

  /** Any error that occurred during setup */
  error: Error | null;

  /** Service worker status */
  serviceWorkerStatus: ServiceWorkerStatus | null;

  /** Function to enable notifications (requests permission) */
  enableNotifications: () => Promise<void>;

  /** Function to disable notifications */
  disableNotifications: () => Promise<void>;

  /** Latest foreground message received */
  lastMessage: MessagePayload | null;
}

/**
 * Hook for managing Firebase Cloud Messaging notifications
 *
 * Handles:
 * 1. Detecting browser support
 * 2. Registering service worker
 * 3. Requesting notification permission
 * 4. Managing FCM token
 * 5. Subscribing to foreground messages
 *
 * @returns {UseNotificationsResult} Notification state and handlers
 */
export function useNotifications(): UseNotificationsResult {
  // Check browser support once on mount
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'Notification' in window;
  });

  // State management
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<ServiceWorkerStatus | null>(null);
  const [lastMessage, setLastMessage] = useState<MessagePayload | null>(null);

  /**
   * Initialize notifications on component mount
   * Attempts to register service worker and restore notification state
   */
  useEffect(() => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }

    const initializeNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Register service worker
        const registration = await registerServiceWorker();
        if (!registration) {
          throw new Error('Failed to register service worker');
        }

        // Step 2: Get service worker status
        const status = await getServiceWorkerStatus();
        setServiceWorkerStatus(status);

        // Step 3: Check current notification permission
        if (window.Notification.permission === 'granted') {
          setIsEnabled(true);
        }

        // Step 4: Subscribe to foreground messages
        try {
          const unsubscribe = subscribeToMessages((payload) => {
            setLastMessage(payload);

            // Log message for debugging
            console.log('Foreground notification received:', payload);

            // Components can listen to lastMessage state change
            // and display in-app notifications
          });

          // Return cleanup function
          return unsubscribe;
        } catch (error) {
          // Foreground subscription is not critical; continue even if it fails
          console.warn('Failed to subscribe to foreground messages:', error);
          return () => {};
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setError(err);
        console.error('Notification initialization failed:', err);
        setIsLoading(false);
        return () => {};
      }
    };

    const unsubscribeFromMessages = initializeNotifications().catch(console.error);

    // Cleanup
    return () => {
      unsubscribeFromMessages.then((fn) => fn?.());
    };
  }, [isSupported]);

  /**
   * Enable notifications by requesting permission and getting token
   */
  const enableNotifications = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Ensure service worker is registered
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Service worker registration failed');
      }

      // Step 2: Request notification permission
      if (window.Notification.permission === 'default') {
        // Permission has not been requested yet
        const permission = await window.Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('User denied notification permission');
        }
      } else if (window.Notification.permission === 'denied') {
        throw new Error('Notifications are blocked. Please enable them in browser settings.');
      }

      // Step 3: Get FCM token
      const token = await requestNotificationToken();
      if (!token) {
        throw new Error('Failed to obtain notification token');
      }

      // Step 4: Send token to backend
      // This is where you'd call an API endpoint to save the token
      await saveNotificationTokenToBackend(token);

      setIsEnabled(true);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Disable notifications
   * Note: User must manually revoke notification permission in browser settings
   */
  const disableNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current token and revoke it on backend
      // Note: Cannot actually revoke browser notification permission from code
      // User must do this manually in browser settings

      // For now, just update local state
      setIsEnabled(false);

      // In Phase 2, add API call to backend to revoke token
      // await revokeNotificationTokenOnBackend();

      console.info('Notifications disabled. User can re-enable in browser settings.');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isEnabled,
    isLoading,
    error,
    serviceWorkerStatus,
    enableNotifications,
    disableNotifications,
    lastMessage,
  };
}

/**
 * Save notification token to backend
 * This is a placeholder function that should be implemented based on your API
 *
 * @param token FCM notification token
 * @throws Error if API call fails
 */
async function saveNotificationTokenToBackend(token: string): Promise<void> {
  // TODO: Implement in Phase 2
  // Should call API endpoint to save token to user profile
  // Example:
  // const response = await fetch('/api/notifications/token', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ token }),
  // });
  // if (!response.ok) throw new Error('Failed to save token');

  console.info('Notification token obtained (backend save not implemented in Phase 1):', token);
}
