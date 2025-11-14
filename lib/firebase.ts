/**
 * lib/firebase.ts
 *
 * Client-side Firebase Cloud Messaging (FCM) initialization
 * Handles FCM token management and push notification subscriptions
 *
 * SCOPE: Cloud Messaging (push notifications) ONLY
 * NOT for: Authentication, Database, or Storage (use Supabase for these)
 *
 * This module is BROWSER-ONLY and should never be imported on the server.
 * All functions perform runtime checks to prevent server-side execution.
 *
 * Environment Variables (NEXT_PUBLIC_* are available on client):
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  onMessage,
  getToken,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';

/**
 * Firebase Cloud Messaging configuration built from NEXT_PUBLIC_* environment variables
 * These are safe to expose on the client side and required ONLY for FCM
 *
 * NOTE: Firebase Auth, Database, and Storage are NOT used - use Supabase instead
 */
const getFirebaseConfig = () => ({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

/**
 * Initialize Firebase app with singleton pattern
 * Prevents multiple initializations of the same Firebase app
 *
 * @returns {FirebaseApp} The initialized Firebase app instance
 * @throws {Error} If Firebase app fails to initialize
 */
export function initializeFirebase(): FirebaseApp {
  // Check if app is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const config = getFirebaseConfig();

  // Validate that all required config fields for FCM are present
  const requiredFields = ['apiKey', 'projectId', 'messagingSenderId', 'appId'];

  for (const field of requiredFields) {
    if (!config[field as keyof typeof config]) {
      throw new Error(
        `Firebase Cloud Messaging config missing required field: NEXT_PUBLIC_FIREBASE_${field.toUpperCase()}`
      );
    }
  }

  try {
    return initializeApp(config);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

/**
 * Get the Firebase Messaging instance
 * Browser-only function that throws if called on server-side
 *
 * @returns {Messaging} The Firebase Messaging instance
 * @throws {Error} If called outside of browser context
 * @throws {Error} If Firebase app is not initialized
 */
export function getFirebaseMessaging(): Messaging {
  // Runtime check to prevent server-side execution
  if (typeof window === 'undefined') {
    throw new Error('Firebase Messaging is only available in browser context');
  }

  try {
    const app = initializeFirebase();
    return getMessaging(app);
  } catch (error) {
    console.error('Failed to get Firebase Messaging:', error);
    throw error;
  }
}

/**
 * Subscribe to foreground messages from Firebase Cloud Messaging
 * Handles messages that arrive while the app is in the foreground
 *
 * @param {(payload: MessagePayload) => void} callback Function to call when a message arrives
 * @returns {() => void} Unsubscribe function to stop listening to messages
 * @throws {Error} If called outside of browser context
 * @throws {Error} If subscription fails
 */
export function subscribeToMessages(callback: (payload: MessagePayload) => void): () => void {
  // Runtime check to prevent server-side execution
  if (typeof window === 'undefined') {
    throw new Error('Message subscription is only available in browser context');
  }

  try {
    const messaging = getFirebaseMessaging();

    // Register the foreground message handler
    const unsubscribe = onMessage(messaging, (payload) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to messages:', error);
    throw error;
  }
}

/**
 * Request device notification token from Firebase Cloud Messaging
 * Requires service worker to be registered and notification permission granted
 *
 * @returns {Promise<string | null>} The FCM device token, or null if permission denied
 * @throws {Error} If called outside of browser context
 * @throws {Error} If service worker is not available
 * @throws {Error} If VAPID key is not configured
 */
export async function requestNotificationToken(): Promise<string | null> {
  // Runtime check to prevent server-side execution
  if (typeof window === 'undefined') {
    throw new Error('Notification token request is only available in browser context');
  }

  try {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this browser');
      return null;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser');
      return null;
    }

    const messaging = getFirebaseMessaging();

    // VAPID key is the messaging sender ID from Firebase
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    if (!vapidKey) {
      throw new Error('Firebase Messaging Sender ID not configured');
    }

    try {
      // Request the token with VAPID key
      // Note: This will trigger browser permission dialog if needed
      const token = await getToken(messaging, { vapidKey });
      return token || null;
    } catch (error) {
      // Handle common error cases
      const errorMessage = (error as Error).message || String(error);

      if (errorMessage.includes('permission')) {
        // User denied notification permission
        console.info('User denied notification permissions');
        return null;
      }

      if (errorMessage.includes('not-supported')) {
        // Messaging not supported (e.g., HTTP in non-localhost, insecure context)
        console.warn('Messaging is not supported in this context:', errorMessage);
        return null;
      }

      // Re-throw other errors
      throw error;
    }
  } catch (error) {
    console.error('Failed to request notification token:', error);
    throw error;
  }
}

/**
 * Type definitions for Firebase messaging payloads
 * These are re-exported from firebase/messaging for convenience
 */
export type { MessagePayload };
