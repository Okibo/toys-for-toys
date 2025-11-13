/**
 * lib/firebase-admin.ts
 *
 * Server-side Firebase Admin SDK initialization and messaging utilities
 * Handles FCM token management and push notifications via Admin SDK
 *
 * This module is SERVER-ONLY and should never be imported on the client.
 * Uses FIREBASE_ADMIN_SDK_KEY environment variable (server-side only credential)
 *
 * Environment Variables (server-side only):
 * - FIREBASE_ADMIN_SDK_KEY (not prefixed with NEXT_PUBLIC_)
 */

import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { credential, type ServiceAccount as FirebaseServiceAccount } from 'firebase-admin';
import {
  getMessaging,
  type Messaging,
  type Message,
  type MulticastMessage,
} from 'firebase-admin/messaging';

/**
 * Type definition for service account credentials
 */
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Type guard for errors with a code property
 */
interface ErrorWithCode extends Error {
  code: string;
}

function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return error instanceof Error && 'code' in error;
}

/**
 * Type definition for push notification payload
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Type definition for batch send response
 */
export interface BatchSendResponse {
  success: number;
  failure: number;
  errors: Array<{
    token: string;
    error: string;
  }>;
}

/**
 * Load and parse service account credentials from environment variable
 * @private
 * @returns {ServiceAccount} Parsed service account object
 * @throws {Error} If FIREBASE_ADMIN_SDK_KEY is missing or invalid
 */
function getServiceAccount(): ServiceAccount {
  const adminSdkKey = process.env.FIREBASE_ADMIN_SDK_KEY;

  if (!adminSdkKey) {
    throw new Error(
      'FIREBASE_ADMIN_SDK_KEY environment variable is not set. Required for server-side Firebase Admin SDK.'
    );
  }

  try {
    const serviceAccount = JSON.parse(adminSdkKey) as ServiceAccount;

    // Validate required fields
    const requiredFields = [
      'type',
      'project_id',
      'private_key_id',
      'private_key',
      'client_email',
      'client_id',
      'auth_uri',
      'token_uri',
    ];

    for (const field of requiredFields) {
      if (!serviceAccount[field as keyof ServiceAccount]) {
        throw new Error(
          `Service account missing required field: ${field}`
        );
      }
    }

    // Validate service account type
    if (serviceAccount.type !== 'service_account') {
      throw new Error(
        `Invalid service account type. Expected 'service_account', got '${serviceAccount.type}'`
      );
    }

    return serviceAccount;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        'FIREBASE_ADMIN_SDK_KEY is not valid JSON. Service account must be a valid JSON string.'
      );
    }
    throw error;
  }
}

/**
 * Initialize Firebase Admin app with singleton pattern
 * Ensures the app is initialized only once
 *
 * @private
 * @returns {App} The initialized Firebase Admin app instance
 * @throws {Error} If initialization fails
 */
function initializeAdmin(): App {
  // Check if app is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  try {
    const serviceAccount = getServiceAccount();

    const app = initializeApp(
      {
        credential: credential.cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        } as FirebaseServiceAccount),
        projectId: serviceAccount.project_id,
      },
      'admin'
    );

    return app;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to initialize Firebase Admin SDK:', errorMessage);
    throw error;
  }
}

/**
 * Get the Firebase Admin Messaging instance
 * Initializes the admin app if not already initialized
 *
 * @returns {Messaging} The Firebase Admin Messaging instance
 * @throws {Error} If initialization fails
 */
export function getAdminMessaging(): Messaging {
  try {
    const app = initializeAdmin();
    return getMessaging(app);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to get Admin Messaging:', errorMessage);
    throw error;
  }
}

/**
 * Send a push notification to a single device token
 * Uses Firebase Cloud Messaging to deliver notifications
 *
 * @param {string} token - The FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body/message text
 * @param {Record<string, string>} [data] - Optional custom data payload
 * @returns {Promise<string>} The message ID on success
 * @throws {Error} If sending fails
 *
 * @example
 * await sendPushNotification(
 *   'device-token-123',
 *   'New Exchange Match',
 *   'Someone requested your toy!',
 *   { exchangeId: '456', type: 'exchange_match' }
 * );
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string> {
  // Validate inputs
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error('Invalid device token: token must be a non-empty string');
  }

  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new Error('Invalid notification title: must be a non-empty string');
  }

  if (!body || typeof body !== 'string' || body.trim() === '') {
    throw new Error('Invalid notification body: must be a non-empty string');
  }

  try {
    const messaging = getAdminMessaging();

    const message: Message = {
      notification: {
        title: title.trim(),
        body: body.trim(),
      },
      data: data || {},
      token: token.trim(),
    };

    const messageId = await messaging.send(message);

    // Log success without exposing credentials
    console.info(`Push notification sent successfully. Message ID: ${messageId}`);

    return messageId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle specific Firebase error cases
    if (errorMessage.includes('InvalidArgument')) {
      throw new Error('Invalid notification payload');
    }

    if (errorMessage.includes('NotFound')) {
      throw new Error('Invalid device token - registration token not found');
    }

    if (errorMessage.includes('InvalidRegistration')) {
      throw new Error('Invalid device token - invalid registration token');
    }

    if (errorMessage.includes('Unauthenticated')) {
      throw new Error('Authentication failed - unable to send message');
    }

    // Log error with code only (no credential exposure)
    if (isErrorWithCode(error)) {
      console.error(`Push notification failed with code: ${error.code}`);
    } else {
      console.error('Push notification failed - unknown error');
    }

    throw error;
  }
}

/**
 * Send push notifications to multiple device tokens
 * Uses batch send for efficiency
 *
 * @param {string[]} tokens - Array of FCM device tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body/message text
 * @param {Record<string, string>} [data] - Optional custom data payload
 * @returns {Promise<BatchSendResponse>} Object with success/failure counts and error details
 *
 * @example
 * const result = await sendMultiplePushNotifications(
 *   ['token1', 'token2', 'token3'],
 *   'New Message',
 *   'You have a new message',
 *   { chatId: '789' }
 * );
 * console.log(`Sent to ${result.success} users, ${result.failure} failed`);
 */
export async function sendMultiplePushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<BatchSendResponse> {
  // Validate inputs
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new Error('At least one device token must be provided');
  }

  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new Error('Invalid notification title: must be a non-empty string');
  }

  if (!body || typeof body !== 'string' || body.trim() === '') {
    throw new Error('Invalid notification body: must be a non-empty string');
  }

  // Filter out invalid tokens
  const validTokens = tokens.filter(
    (token) => token && typeof token === 'string' && token.trim() !== ''
  );

  if (validTokens.length === 0) {
    throw new Error('No valid device tokens provided');
  }

  try {
    const messaging = getAdminMessaging();

    const message: MulticastMessage = {
      notification: {
        title: title.trim(),
        body: body.trim(),
      },
      data: data || {},
      tokens: validTokens.map((t) => t.trim()),
    };

    const response = await messaging.sendEachForMulticast(message);

    // Collect errors for failed sends
    const errors: Array<{ token: string; error: string }> = [];

    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        const token = validTokens[index];
        const errorMessage = resp.error?.message || 'Unknown error';
        errors.push({ token, error: errorMessage });
      }
    });

    // Log batch send result
    console.info(
      `Batch notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`
    );

    return {
      success: response.successCount,
      failure: response.failureCount,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Batch push notification failed:', errorMessage);
    throw error;
  }
}
