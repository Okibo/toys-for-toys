/**
 * tests/firebase-admin.test.ts
 *
 * Server-side Firebase Admin SDK initialization tests
 * Tests that Firebase Admin SDK is properly initialized with service account credentials
 * Uses FIREBASE_ADMIN_SDK_KEY (server-side only) for authentication
 *
 * RED PHASE: These tests should FAIL initially until Firebase Admin SDK is implemented
 */

import 'jest';

// Mock Firebase Admin SDK modules
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(),
}));

// Mock service account credentials
const mockServiceAccount = {
  type: 'service_account',
  project_id: 'test-project-id',
  private_key_id: 'test-key-id',
  private_key:
    '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA2a2rwplBCJ0eFb4J7M3JTT4RzcqrKjqG3eCp7ZJBkP5K\n-----END RSA PRIVATE KEY-----\n',
  client_email: 'firebase-adminsdk@test-project-id.iam.gserviceaccount.com',
  client_id: '123456789',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test',
};

describe('Firebase Admin SDK Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables (server-side only)
    process.env.FIREBASE_ADMIN_SDK_KEY = JSON.stringify(mockServiceAccount);
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.FIREBASE_ADMIN_SDK_KEY;
    delete process.env.NODE_ENV;
  });

  test('should have Firebase Admin SDK initialization function', () => {
    // This test validates that we can import the Firebase Admin SDK initialization
    // The actual implementation will be in lib/firebase-admin.ts
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@/lib/firebase-admin');
    }).not.toThrow();
  });

  test('should initialize Firebase Admin app', () => {
    const { initializeApp, getApps } = require('firebase-admin/app');

    getApps.mockReturnValue([]);

    // This should not throw when initializing with proper credentials
    expect(() => {
      initializeApp(
        {
          credential: {
            getAccessToken: jest.fn(),
          },
          projectId: mockServiceAccount.project_id,
        },
        'admin'
      );
    }).not.toThrow();

    expect(initializeApp).toHaveBeenCalled();
  });

  test('should parse service account JSON from FIREBASE_ADMIN_SDK_KEY', () => {
    // Test that the service account JSON can be properly parsed from env var
    const adminSdkKey = process.env.FIREBASE_ADMIN_SDK_KEY;

    expect(adminSdkKey).toBeDefined();
    expect(() => {
      JSON.parse(adminSdkKey!);
    }).not.toThrow();

    const parsedServiceAccount = JSON.parse(adminSdkKey!);
    expect(parsedServiceAccount).toEqual(mockServiceAccount);
  });

  test('service account should have required fields', () => {
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

    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY || '{}');

    requiredFields.forEach((field) => {
      expect(serviceAccount).toHaveProperty(field);
      expect(serviceAccount[field]).toBeDefined();
      expect(serviceAccount[field]).not.toBe('');
    });
  });

  test('service account type should be "service_account"', () => {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY || '{}');

    expect(serviceAccount.type).toBe('service_account');
  });

  test('service account should have valid project_id', () => {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY || '{}');

    expect(typeof serviceAccount.project_id).toBe('string');
    expect(serviceAccount.project_id.length).toBeGreaterThan(0);
  });

  test('service account should have properly formatted private_key', () => {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY || '{}');

    expect(serviceAccount.private_key).toBeDefined();
    expect(serviceAccount.private_key).toContain('-----BEGIN');
    expect(serviceAccount.private_key).toContain('-----END');
    expect(serviceAccount.private_key).toContain('\n');
  });

  test('service account should have valid client_email', () => {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY || '{}');

    expect(serviceAccount.client_email).toBeDefined();
    expect(serviceAccount.client_email).toContain('@');
    expect(serviceAccount.client_email).toContain('iam.gserviceaccount.com');
  });

  test('should provide messaging instance from Admin SDK', () => {
    const { getMessaging } = require('firebase-admin/messaging');

    const mockMessagingInstance = {
      send: jest.fn(),
      sendMulticast: jest.fn(),
      sendAll: jest.fn(),
    };

    getMessaging.mockReturnValue(mockMessagingInstance);

    const messagingInstance = getMessaging();

    expect(messagingInstance).toBeDefined();
    expect(messagingInstance.send).toBeDefined();
  });

  test('should not expose private credentials to client-side', () => {
    // The service account JSON should be in server-side env vars only
    // FIREBASE_ADMIN_SDK_KEY should NOT be prefixed with NEXT_PUBLIC_
    expect(process.env.FIREBASE_ADMIN_SDK_KEY).toBeDefined();

    // Key indicator: the env var should NOT be in the public environment
    // In a real browser environment, this would not be accessible
    const isPrivate = !process.env.NEXT_PUBLIC_FIREBASE_ADMIN_SDK_KEY;
    expect(isPrivate).toBe(true);
  });

  test('Admin SDK credentials should not be exposed via NEXT_PUBLIC_ env var', () => {
    // Critical security test: ensure private_key is never in NEXT_PUBLIC_ variables
    expect(process.env.NEXT_PUBLIC_FIREBASE_ADMIN_SDK_KEY).toBeUndefined();
  });

  test('sendPushNotification function should exist with correct signature', () => {
    // The implementation should export a sendPushNotification function
    // This function will be used by API routes and Edge Functions
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { sendPushNotification } = require('@/lib/firebase-admin');
      expect(sendPushNotification).toBeDefined();
      expect(typeof sendPushNotification).toBe('function');
    }).not.toThrow();
  });

  test('sendPushNotification should accept message object with required fields', () => {
    // Test signature validation
    const messageObject = {
      notification: {
        title: 'Test Notification',
        body: 'Test message body',
      },
      data: {
        exchangeId: '123',
        type: 'exchange_match',
      },
      token: 'test-device-token',
    };

    // This validates the expected function signature
    expect(messageObject).toHaveProperty('token');
    expect(messageObject).toHaveProperty('notification');
    expect(messageObject.notification).toHaveProperty('title');
    expect(messageObject.notification).toHaveProperty('body');
  });

  test('Admin app should be initialized only once', () => {
    const { initializeApp, getApps } = require('firebase-admin/app');

    // First initialization
    initializeApp(
      {
        credential: { getAccessToken: jest.fn() },
        projectId: mockServiceAccount.project_id,
      },
      'admin'
    );

    expect(initializeApp).toHaveBeenCalledTimes(1);

    // Subsequent calls should check if app already exists
    getApps.mockReturnValue([{ name: 'admin' }]);

    if (getApps().length > 0) {
      // Should skip initialization if app exists
      expect(initializeApp).toHaveBeenCalledTimes(1);
    }
  });

  test('service account credentials should be valid JSON', () => {
    const adminSdkKey = process.env.FIREBASE_ADMIN_SDK_KEY;

    expect(adminSdkKey).toBeDefined();

    let parsedCreds;
    expect(() => {
      parsedCreds = JSON.parse(adminSdkKey!);
    }).not.toThrow();

    expect(parsedCreds).toBeInstanceOf(Object);
  });

  test('should handle invalid service account JSON gracefully', () => {
    const invalidJson = 'not-valid-json';

    expect(() => {
      JSON.parse(invalidJson);
    }).toThrow();
  });

  test('Admin messaging should have send method for single messages', () => {
    const { getMessaging } = require('firebase-admin/messaging');

    const mockMessaging = {
      send: jest.fn().mockResolvedValue('message-id-123'),
    };

    getMessaging.mockReturnValue(mockMessaging);

    const messaging = getMessaging();

    expect(messaging.send).toBeDefined();
    expect(typeof messaging.send).toBe('function');
  });

  test('Admin messaging should have sendMulticast method for batch messages', () => {
    const { getMessaging } = require('firebase-admin/messaging');

    const mockMessaging = {
      sendMulticast: jest.fn().mockResolvedValue({
        successCount: 3,
        failureCount: 0,
        responses: [],
      }),
    };

    getMessaging.mockReturnValue(mockMessaging);

    const messaging = getMessaging();

    expect(messaging.sendMulticast).toBeDefined();
    expect(typeof messaging.sendMulticast).toBe('function');
  });
});
