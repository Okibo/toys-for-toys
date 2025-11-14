/**
 * lib/service-worker.ts
 *
 * Service worker registration and management for Firebase Cloud Messaging
 * Handles registration, error handling, and lifecycle management
 *
 * This module is BROWSER-ONLY and should never be imported on the server.
 */

/**
 * Register the Firebase Cloud Messaging service worker
 * This must be called AFTER Firebase initialization but BEFORE requesting notification token
 *
 * @returns {Promise<ServiceWorkerRegistration | null>} The registered service worker, or null if registration failed
 * @throws {Error} If called outside of browser context
 *
 * @example
 * // In your app layout or main component
 * useEffect(() => {
 *   registerServiceWorker().catch(error => {
 *     console.error('Service worker registration failed:', error);
 *   });
 * }, []);
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Runtime check to prevent server-side execution
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('Service worker registration is only available in browser context');
  }

  try {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this browser');
      return null;
    }

    // Register the service worker for Firebase Messaging
    // The service worker must be in the public directory to be served correctly
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      // Scope limits the service worker to the entire app
      scope: '/',
    });

    console.info('Service worker registered successfully:', registration);
    return registration;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle common error cases
    if (errorMessage.includes('SecurityError')) {
      console.error(
        'Service worker registration failed: App must be served over HTTPS (or localhost for development)'
      );
    } else if (errorMessage.includes('TypeError')) {
      console.error(
        'Service worker registration failed: Invalid service worker script path or scope'
      );
    } else {
      console.error('Service worker registration failed:', error);
    }

    return null;
  }
}

/**
 * Unregister the service worker
 * Use this for cleanup or debugging purposes
 *
 * @returns {Promise<boolean>} True if unregistration was successful
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('Service worker unregistration is only available in browser context');
  }

  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      const unregistered = await registration.unregister();
      if (unregistered) {
        console.info('Service worker unregistered successfully');
        return true;
      }
    }

    console.warn('No service worker registration found to unregister');
    return false;
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Get the currently active service worker registration
 * Useful for checking registration status or updating the service worker
 *
 * @returns {Promise<ServiceWorkerRegistration | undefined>} The active registration, or undefined if none
 */
export async function getServiceWorkerRegistration(): Promise<
  ServiceWorkerRegistration | undefined
> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('Service worker check is only available in browser context');
  }

  try {
    if (!('serviceWorker' in navigator)) {
      return undefined;
    }

    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('Failed to get service worker registration:', error);
    return undefined;
  }
}

/**
 * Update the service worker (check for and install updates)
 * Useful for keeping the service worker up-to-date without requiring page reload
 *
 * @returns {Promise<void>}
 */
export async function updateServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('Service worker update is only available in browser context');
  }

  try {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    if (registration && registration.update) {
      await registration.update();
      console.info('Service worker update check completed');
    }
  } catch (error) {
    console.error('Service worker update failed:', error);
  }
}

/**
 * Listen for service worker updates
 * Call this to detect when a new version of the service worker is available
 *
 * @param {(registration: ServiceWorkerRegistration) => void} callback Called when an update is found
 * @returns {() => void} Unsubscribe function to stop listening
 */
export function onServiceWorkerUpdate(
  callback: (registration: ServiceWorkerRegistration) => void
): () => void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return () => {}; // No-op in non-browser environment
  }

  try {
    if (!('serviceWorker' in navigator)) {
      return () => {};
    }

    const handleControllerChange = () => {
      navigator.serviceWorker.ready.then((registration) => {
        callback(registration);
      });
    };

    // Listen for controller change (when new service worker takes over)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Return unsubscribe function
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  } catch (error) {
    console.error('Failed to set up service worker update listener:', error);
    return () => {};
  }
}

/**
 * Type definitions for convenience
 */
export type ServiceWorkerStatus =
  | 'installing'
  | 'installed'
  | 'activating'
  | 'activated'
  | 'redundant';

/**
 * Get the current status of the service worker
 * @returns {Promise<ServiceWorkerStatus | null>} The status, or null if no service worker
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus | null> {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return null;
    }

    if (registration.installing) {
      return 'installing';
    }
    if (registration.waiting) {
      return 'installed';
    }
    if (registration.active) {
      return 'activated';
    }

    return 'redundant';
  } catch (error) {
    console.error('Failed to get service worker status:', error);
    return null;
  }
}
