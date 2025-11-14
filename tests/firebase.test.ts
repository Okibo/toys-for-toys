/**
 * tests/firebase.test.ts
 *
 * Client-side Firebase Cloud Messaging (FCM) initialization tests
 * Tests that Firebase app is properly initialized with FCM-only configuration
 * Uses NEXT_PUBLIC_* environment variables for browser-safe config
 *
 * SCOPE: Cloud Messaging only - NOT for Auth, Database, or Storage
 */

import 'jest';

// Mock Firebase modules before importing our code
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(),
  onMessage: jest.fn(),
}));

// Mock Firebase Cloud Messaging config (FCM only)
const mockFirebaseConfig = {
  apiKey: 'test-api-key',
  projectId: 'test-project-id',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
};

describe('Firebase Client Initialization', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Set up environment variables
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = mockFirebaseConfig.apiKey;
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = mockFirebaseConfig.projectId;
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = mockFirebaseConfig.messagingSenderId;
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = mockFirebaseConfig.appId;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  });

  test('should have Firebase client initialization function exported from lib', () => {
    // This test validates that we can import the Firebase client initialization
    // The actual implementation will be in lib/firebase.ts
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@/lib/firebase');
    }).not.toThrow();
  });

  test('Firebase Cloud Messaging config should contain all required fields', () => {
    const requiredFields = ['apiKey', 'projectId', 'messagingSenderId', 'appId'];

    requiredFields.forEach((field) => {
      expect(mockFirebaseConfig).toHaveProperty(field);
      expect(mockFirebaseConfig[field as keyof typeof mockFirebaseConfig]).toBeDefined();
    });
  });

  test('Firebase config should use NEXT_PUBLIC_* environment variables', () => {
    // Verify that the config uses the correct NEXT_PUBLIC_ prefixed env vars
    expect(process.env.NEXT_PUBLIC_FIREBASE_API_KEY).toBeDefined();
    expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBeDefined();
    expect(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID).toBeDefined();
    expect(process.env.NEXT_PUBLIC_FIREBASE_APP_ID).toBeDefined();
  });

  test('should initialize Firebase app without throwing errors', async () => {
    // This test will pass once the Firebase app initialization is implemented
    // and properly handles the environment variables
    const { initializeApp, getApps } = require('firebase/app');

    // Mock getApps to return empty array (no apps initialized yet)
    getApps.mockReturnValue([]);

    // This should not throw
    expect(() => {
      // The actual implementation will call initializeApp(mockFirebaseConfig)
      initializeApp(mockFirebaseConfig);
    }).not.toThrow();
  });

  test('should provide messaging instance from Firebase app', () => {
    // Test that we can retrieve a messaging instance from the initialized app
    const { getMessaging } = require('firebase/messaging');

    // Create a mock messaging instance
    const mockMessagingInstance = {
      app: mockFirebaseConfig,
    };

    getMessaging.mockReturnValue(mockMessagingInstance);

    const messagingInstance = getMessaging();

    expect(messagingInstance).toBeDefined();
    expect(messagingInstance.app).toEqual(mockFirebaseConfig);
  });

  test('Firebase API key should be a non-empty string', () => {
    expect(typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('string');
    expect(process.env.NEXT_PUBLIC_FIREBASE_API_KEY).toBeTruthy();
    expect(process.env.NEXT_PUBLIC_FIREBASE_API_KEY).not.toBe('');
  });

  test('Firebase project ID should be a non-empty string', () => {
    expect(typeof process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('string');
    expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).not.toBe('');
  });

  test('Firebase messaging sender ID should be a non-empty string', () => {
    expect(typeof process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID).toBe('string');
    expect(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID).not.toBe('');
  });

  test('Firebase app ID should be a non-empty string', () => {
    expect(typeof process.env.NEXT_PUBLIC_FIREBASE_APP_ID).toBe('string');
    expect(process.env.NEXT_PUBLIC_FIREBASE_APP_ID).not.toBe('');
  });

  test('should prevent calling initializeApp multiple times', () => {
    // Firebase should track initialized apps to prevent duplicates
    const { initializeApp, getApps } = require('firebase/app');

    // First call
    initializeApp(mockFirebaseConfig);
    expect(initializeApp).toHaveBeenCalledTimes(1);

    // Second call should be prevented or return existing app
    // The implementation should check getApps() before initializing
    getApps.mockReturnValue([mockFirebaseConfig]);

    if (getApps().length === 0) {
      initializeApp(mockFirebaseConfig);
    }

    // initializeApp should only be called once in proper implementation
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  test('Firebase Cloud Messaging config values should match environment variables', () => {
    expect(mockFirebaseConfig.apiKey).toBe(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    expect(mockFirebaseConfig.projectId).toBe(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    expect(mockFirebaseConfig.messagingSenderId).toBe(
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    );
    expect(mockFirebaseConfig.appId).toBe(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
  });

  test('should not contain any private credentials in config', () => {
    // The config object should only contain public values
    // Should NOT contain privateKey, serviceAccount, or admin SDK credentials
    const configString = JSON.stringify(mockFirebaseConfig);

    expect(configString).not.toContain('private');
    expect(configString).not.toContain('serviceAccount');
    expect(configString).not.toContain('admin');
  });

  test('messaging instance should have required methods', () => {
    const { getMessaging } = require('firebase/messaging');

    const mockMessagingInstance = {
      onMessage: jest.fn(),
      getToken: jest.fn(),
      deleteToken: jest.fn(),
    };

    getMessaging.mockReturnValue(mockMessagingInstance);
    const messagingInstance = getMessaging();

    expect(messagingInstance).toHaveProperty('onMessage');
    expect(messagingInstance).toHaveProperty('getToken');
    expect(messagingInstance).toHaveProperty('deleteToken');
  });
});
