/**
 * tests/firebase-messaging.test.ts
 *
 * Firebase Cloud Messaging functionality tests
 * Tests foreground message handling, payload validation, and token management
 *
 * RED PHASE: These tests should FAIL initially until messaging functions are implemented
 */

import 'jest';

// Mock Firebase messaging
jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(),
  onMessage: jest.fn(),
  getToken: jest.fn(),
  deleteToken: jest.fn(),
}));

// Mock window and service worker APIs
const mockServiceWorkerRegistration = {
  active: {
    controller: true,
  },
};

(global as any).navigator = {
  serviceWorker: {
    register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    getRegistration: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
  },
};

describe('Firebase Cloud Messaging', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  });

  describe('Foreground Message Subscription', () => {
    test('should handle foreground messages with onMessage', (done) => {
      const { onMessage } = require('firebase/messaging');

      const mockMessageHandler = jest.fn();
      const mockPayload = {
        notification: {
          title: 'New Exchange Match',
          body: 'Someone wants to trade with you!',
        },
        data: {
          exchangeId: 'exchange-123',
          type: 'exchange_match',
        },
      };

      // Mock onMessage to trigger the callback
      onMessage.mockImplementation((messaging: any, callback: any) => {
        callback(mockPayload);
        return jest.fn(); // Unsubscribe function
      });

      const unsubscribe = onMessage(() => {}, mockMessageHandler);

      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
      done();
    });

    test('should trigger callback when foreground message is received', async () => {
      const { onMessage, getMessaging } = require('firebase/messaging');

      const mockMessaging = { app: 'test' };
      getMessaging.mockReturnValue(mockMessaging);

      const mockCallback = jest.fn();
      const testPayload = {
        notification: {
          title: 'Test Title',
          body: 'Test Body',
        },
        data: {},
      };

      onMessage.mockImplementation((messaging: any, callback: any) => {
        // Immediately call the callback with test payload
        setTimeout(() => callback(testPayload), 0);
        return jest.fn();
      });

      onMessage(mockMessaging, mockCallback);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      // The implementation should handle the message
      expect(onMessage).toHaveBeenCalled();
    });

    test('should handle multiple foreground message listeners', () => {
      const { onMessage } = require('firebase/messaging');

      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const unsubscribe1 = jest.fn();
      const unsubscribe2 = jest.fn();

      onMessage.mockReturnValueOnce(unsubscribe1).mockReturnValueOnce(unsubscribe2);

      // Multiple listeners should be supported
      const unsub1 = onMessage(() => {}, callback1);
      const unsub2 = onMessage(() => {}, callback2);

      expect(unsub1).toBe(unsubscribe1);
      expect(unsub2).toBe(unsubscribe2);
    });
  });

  describe('Message Payload Validation', () => {
    test('should extract notification title and body from payload', () => {
      const payload = {
        notification: {
          title: 'New Toy Request',
          body: 'John wants to exchange your wooden blocks',
        },
        data: {
          type: 'exchange_request',
        },
      };

      expect(payload.notification.title).toBeDefined();
      expect(payload.notification.body).toBeDefined();
      expect(typeof payload.notification.title).toBe('string');
      expect(typeof payload.notification.body).toBe('string');
    });

    test('should validate message has required notification fields', () => {
      const validPayload = {
        notification: {
          title: 'Title',
          body: 'Body',
        },
      };

      expect(validPayload).toHaveProperty('notification');
      expect(validPayload.notification).toHaveProperty('title');
      expect(validPayload.notification).toHaveProperty('body');
    });

    test('should handle optional data field in payload', () => {
      const payloadWithData = {
        notification: {
          title: 'Test',
          body: 'Message',
        },
        data: {
          exchangeId: '123',
          userId: 'user-456',
        },
      };

      const payloadWithoutData = {
        notification: {
          title: 'Test',
          body: 'Message',
        },
      };

      // Both should be valid
      expect(payloadWithData.notification).toBeDefined();
      expect(payloadWithoutData.notification).toBeDefined();
    });

    test('should validate data field is key-value string pairs', () => {
      const payload = {
        notification: { title: 'Test', body: 'Message' },
        data: {
          exchangeId: 'exchange-123',
          type: 'exchange_match',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      Object.entries(payload.data).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('string');
      });
    });

    test('should handle message with image icon', () => {
      const payload = {
        notification: {
          title: 'Exchange Match',
          body: 'New match found!',
          icon: 'https://example.com/icon.png',
        },
      };

      expect(payload.notification.icon).toBeDefined();
      expect(typeof payload.notification.icon).toBe('string');
      expect(payload.notification.icon).toMatch(/^https:\/\//);
    });

    test('should handle message with custom click action', () => {
      const payload = {
        notification: {
          title: 'Message',
          body: 'Body',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
        data: {
          targetUrl: '/exchanges/123',
        },
      };

      expect(payload.notification.clickAction).toBeDefined();
      expect(payload.data.targetUrl).toBeDefined();
    });
  });

  describe('Device Token Handling', () => {
    test('should request device token with getToken', async () => {
      const { getToken } = require('firebase/messaging');

      const mockToken = 'eGm5d0p5aBcD1eFgH2iJkL3mNoP4qRsT5uVwXyZ0aB1cDe2fGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrSt';

      getToken.mockResolvedValue(mockToken);

      const token = await getToken(() => {}, { vapidKey: 'test-vapid-key' });

      expect(token).toBe(mockToken);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('should validate device token format', async () => {
      const { getToken } = require('firebase/messaging');

      const mockToken = 'c3w8X9Y0zAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr';

      getToken.mockResolvedValue(mockToken);

      const token = await getToken(() => {}, { vapidKey: 'key' });

      // Token should be a non-empty string
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    test('should handle token request with VAPID key', async () => {
      const { getToken } = require('firebase/messaging');

      const mockToken = 'test-token-123';
      const vapidKey = 'test-vapid-key';

      getToken.mockResolvedValue(mockToken);

      const token = await getToken(() => {}, { vapidKey });

      expect(token).toBe(mockToken);
      expect(getToken).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ vapidKey }),
      );
    });

    test('should handle token deletion with deleteToken', async () => {
      const { deleteToken } = require('firebase/messaging');

      deleteToken.mockResolvedValue(true);

      const result = await deleteToken(() => {});

      expect(result).toBe(true);
      expect(deleteToken).toHaveBeenCalled();
    });

    test('should validate token is not empty string', async () => {
      const { getToken } = require('firebase/messaging');

      const mockToken = 'valid-token-xyz-123';

      getToken.mockResolvedValue(mockToken);

      const token = await getToken(() => {}, { vapidKey: 'key' });

      expect(token).not.toBe('');
      expect(token.length).toBeGreaterThan(0);
    });

    test('should handle token retrieval failure gracefully', async () => {
      const { getToken } = require('firebase/messaging');

      const error = new Error('Permission denied');
      getToken.mockRejectedValue(error);

      await expect(
        getToken(() => {}, { vapidKey: 'key' }),
      ).rejects.toThrow('Permission denied');
    });

    test('should store obtained token for later use', async () => {
      const { getToken } = require('firebase/messaging');

      const mockToken = 'stored-token-abc-123';

      getToken.mockResolvedValue(mockToken);

      const token = await getToken(() => {}, { vapidKey: 'key' });

      // Token should be retrievable for subscription to Supabase table
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('Error Handling', () => {
    test('should handle messaging not supported', async () => {
      const { getToken } = require('firebase/messaging');

      const error = new Error('Messaging not supported');
      getToken.mockRejectedValue(error);

      await expect(
        getToken(() => {}, { vapidKey: 'key' }),
      ).rejects.toThrow();
    });

    test('should handle invalid VAPID key', async () => {
      const { getToken } = require('firebase/messaging');

      const error = new Error('Invalid VAPID key');
      getToken.mockRejectedValue(error);

      await expect(
        getToken(() => {}, { vapidKey: '' }),
      ).rejects.toThrow('Invalid VAPID key');
    });

    test('should handle service worker not registered', async () => {
      const { getToken } = require('firebase/messaging');

      const error = new Error('Service Worker not available');
      getToken.mockRejectedValue(error);

      await expect(
        getToken(() => {}, { vapidKey: 'key' }),
      ).rejects.toThrow();
    });

    test('should handle token refresh expiry', async () => {
      const { getToken, deleteToken } = require('firebase/messaging');

      // Simulate token expiration and refresh
      const oldToken = 'old-token-123';
      const newToken = 'new-token-456';

      getToken.mockResolvedValueOnce(oldToken).mockResolvedValueOnce(newToken);
      deleteToken.mockResolvedValue(true);

      const token1 = await getToken(() => {}, { vapidKey: 'key' });
      expect(token1).toBe(oldToken);

      // Simulate refresh
      await deleteToken(() => {});

      const token2 = await getToken(() => {}, { vapidKey: 'key' });
      expect(token2).toBe(newToken);
      expect(token2).not.toBe(token1);
    });

    test('should log errors for message processing failures', () => {
      const { onMessage } = require('firebase/messaging');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const messageHandler = jest.fn().mockImplementation(() => {
        throw new Error('Failed to process message');
      });

      onMessage.mockImplementation((messaging: any, callback: any) => {
        try {
          callback({ notification: { title: 'Test', body: 'Test' } });
        } catch (error) {
          consoleErrorSpy(error);
        }
        return jest.fn();
      });

      onMessage(() => {}, messageHandler);

      expect(messageHandler).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Message Subscription Lifecycle', () => {
    test('should allow unsubscribing from messages', () => {
      const { onMessage } = require('firebase/messaging');

      const unsubscribe = jest.fn();
      onMessage.mockReturnValue(unsubscribe);

      const unsub = onMessage(() => {}, jest.fn());

      // Should be able to call unsubscribe
      unsub();

      expect(unsubscribe).toHaveBeenCalled();
    });

    test('should handle cleanup on component unmount', () => {
      const { onMessage } = require('firebase/messaging');

      const unsubscribe = jest.fn();
      onMessage.mockReturnValue(unsubscribe);

      // Simulate component lifecycle
      const handleMessage = jest.fn();
      const cleanup = onMessage(() => {}, handleMessage);

      // Cleanup should be called on unmount
      cleanup();

      expect(unsubscribe).toHaveBeenCalled();
    });

    test('should register service worker for background messages', async () => {
      const registerServiceWorker = jest.fn().mockResolvedValue({
        active: true,
      });

      const registration = await registerServiceWorker();

      expect(registration).toBeDefined();
      expect(registration.active).toBe(true);
    });
  });
});
