/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles background push notifications from Firebase Cloud Messaging.
 * This service worker is registered by the client-side Firebase initialization
 * and receives notifications when the app is in the background or closed.
 *
 * Important:
 * - This is plain JavaScript, NOT TypeScript (runs in service worker context)
 * - Uses Firebase SDK v9+ compatibility mode (compat)
 * - No imports from npm/node_modules (CDN-based only)
 * - Runs in browser's service worker context, NOT Node.js
 *
 * Environment:
 * - Service Worker Context (not a regular browser window)
 * - Limited DOM access (no document manipulation)
 * - Has access to notifications API and service worker APIs
 */

// Import Firebase SDK from CDN
// Using v9+ compat mode for compatibility with Next.js client code
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

/**
 * Firebase configuration object
 * Same as client-side configuration in lib/firebase.ts
 * These values are publicly available and safe to expose
 *
 * IMPORTANT: In service worker context, environment variables are not available.
 * The Firebase configuration must be injected at build time via Next.js config,
 * or the main client code must initialize Firebase before service worker is used.
 *
 * Service worker receives configuration through:
 * 1. Main client context initialization (preferred)
 * 2. Build-time environment variable injection
 * 3. Runtime message passing from client
 *
 * SECURITY NOTE: No fallback values are provided here since they would be
 * outdated examples. Instead, the service worker relies on the client to be
 * properly initialized with correct credentials.
 */
let firebaseConfig = null;

/**
 * Initialize Firebase config in service worker
 * Called after receiving config from client via postMessage
 */
function initializeFirebaseConfig(config) {
  if (!config || !config.projectId) {
    console.error('[Firebase SW] Invalid Firebase configuration received');
    return false;
  }
  firebaseConfig = config;
  return true;
}

/**
 * Get Firebase configuration
 * Returns configuration if available, or null if not yet initialized
 */
function getFirebaseConfig() {
  if (!firebaseConfig) {
    console.warn(
      '[Firebase SW] Firebase configuration not yet initialized. ' +
        'Ensure client initializes Firebase before service worker is activated.'
    );
  }
  return firebaseConfig;
}

/**
 * Listen for configuration messages from client
 * Client sends configuration during initialization
 */
self.addEventListener('message', (event) => {
  try {
    if (event.data && event.data.type === 'INIT_FIREBASE_CONFIG') {
      const config = event.data.firebaseConfig;
      if (initializeFirebaseConfig(config)) {
        // Try to initialize Firebase now that we have config
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
          firebase.initializeApp(config);
          console.log('[Firebase SW] Firebase initialized in service worker');
        }
      }
    }
  } catch (error) {
    console.error('[Firebase SW] Error handling configuration message:', error);
  }
});

/**
 * Initialize Firebase in service worker context
 * First attempt: Use any existing config from client
 * Wrapped in try-catch for graceful error handling
 */
try {
  const config = getFirebaseConfig();
  if (config && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
    firebase.initializeApp(config);
    console.log('[Firebase SW] Firebase initialized with provided configuration');
  }
} catch (error) {
  console.error('[Firebase SW] Failed to initialize Firebase:', error);
}

/**
 * Handle background messages from Firebase Cloud Messaging
 * This handler is called when a message arrives while the app is:
 * - In the background (but not closed)
 * - Completely closed
 *
 * Foreground messages are handled separately in lib/firebase.ts by onMessage()
 */
try {
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    try {
      const notificationTitle = payload.notification?.title || 'Notification';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/icon-192.png',
        badge: payload.notification?.badge || '/badge-72.png',
        tag: 'firebase-notification', // Prevents duplicate notifications
        data: {
          ...(payload.data || {}),
          // Preserve the entire notification data for click handler
          notificationTitle,
        },
        // Additional options for better UX
        requireInteraction: false,
        vibrate: [200, 100, 200],
      };

      // Show system notification
      self.registration.showNotification(notificationTitle, notificationOptions);
    } catch (error) {
      console.error('[Firebase SW] Error displaying notification:', error);
    }
  });
} catch (error) {
  console.error('[Firebase SW] Failed to set up background message handler:', error);
}

/**
 * Handle notification clicks
 * Closes the notification and focuses/opens the app window
 */
self.addEventListener('notificationclick', (event) => {
  try {
    event.notification.close();

    // Optional: Navigate to specific page based on notification data
    const notificationData = event.notification.data || {};

    // Define URL to navigate to based on notification type
    let urlToOpen = '/'; // Default to home page

    if (notificationData.exchangeId) {
      urlToOpen = `/exchanges/${notificationData.exchangeId}`;
    } else if (notificationData.chatId) {
      urlToOpen = `/messages/${notificationData.chatId}`;
    } else if (notificationData.path) {
      urlToOpen = notificationData.path;
    }

    event.waitUntil(
      (async () => {
        try {
          // Check if app window is already open
          const clientList = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
          });

          // If a window is already open, focus it
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }

          // Otherwise, open a new window with the URL
          if (self.clients.openWindow) {
            return self.clients.openWindow(urlToOpen);
          }
        } catch (error) {
          console.error('[Firebase SW] Error handling notification click:', error);
        }
      })()
    );
  } catch (error) {
    console.error('[Firebase SW] Error in notification click handler:', error);
  }
});

/**
 * Handle notification close events (optional)
 * Could be used for analytics or cleanup
 */
self.addEventListener('notificationclose', (_event) => {
  try {
    // Could track notification dismissal here if needed for analytics
    // const notificationData = _event.notification.data || {};
    // console.log('[Firebase SW] Notification closed:', notificationData);
  } catch (error) {
    console.error('[Firebase SW] Error in notification close handler:', error);
  }
});

/**
 * Handle unhandled promise rejections in service worker
 * Prevents service worker from crashing silently
 */
self.addEventListener('unhandledrejection', (event) => {
  console.error('[Firebase SW] Unhandled promise rejection:', event.reason);
  // Allow the service worker to continue functioning
  event.preventDefault();
});

/**
 * Service worker lifecycle: Install
 * Pre-cache essential assets if needed
 */
self.addEventListener('install', (_event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

/**
 * Service worker lifecycle: Activate
 * Clean up old caches if using caching strategy
 */
self.addEventListener('activate', (_event) => {
  _event.waitUntil(self.clients.claim());
});
