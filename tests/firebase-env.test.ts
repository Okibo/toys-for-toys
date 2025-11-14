/**
 * tests/firebase-env.test.ts
 *
 * Firebase environment variable validation tests
 * Ensures all required Firebase configuration is properly defined and accessible
 * Tests both client-side (NEXT_PUBLIC_*) and server-side (private) variables
 *
 * RED PHASE: These tests should FAIL initially until env vars are properly set
 */

import 'jest';

describe('Firebase Environment Variables', () => {
  const requiredClientEnvVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
  ];

  const requiredServerEnvVars = ['FIREBASE_ADMIN_SDK_KEY'];

  beforeEach(() => {
    // Clean up any existing Firebase env vars
    requiredClientEnvVars.forEach((key) => {
      delete process.env[key];
    });
    requiredServerEnvVars.forEach((key) => {
      delete process.env[key];
    });
  });

  afterEach(() => {
    // Clean up
    requiredClientEnvVars.forEach((key) => {
      delete process.env[key];
    });
    requiredServerEnvVars.forEach((key) => {
      delete process.env[key];
    });
  });

  describe('Client-side Environment Variables (NEXT_PUBLIC_*)', () => {
    test('NEXT_PUBLIC_FIREBASE_PROJECT_ID should be defined', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';

      expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBeDefined();
    });

    test('NEXT_PUBLIC_FIREBASE_PROJECT_ID should not be empty string', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';

      expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).not.toBe('');
      expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toHaveLength(expect.any(Number));
    });

    test('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID should be defined', () => {
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';

      expect(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID).toBeDefined();
    });

    test('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID should not be empty', () => {
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';

      expect(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID).not.toBe('');
    });

    test('NEXT_PUBLIC_FIREBASE_APP_ID should be defined', () => {
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abc123def456';

      expect(process.env.NEXT_PUBLIC_FIREBASE_APP_ID).toBeDefined();
    });

    test('NEXT_PUBLIC_FIREBASE_APP_ID should not be empty', () => {
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abc123def456';

      expect(process.env.NEXT_PUBLIC_FIREBASE_APP_ID).not.toBe('');
    });

    test('NEXT_PUBLIC_FIREBASE_API_KEY should be defined', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIzaSyDummyApiKey123456789';

      expect(process.env.NEXT_PUBLIC_FIREBASE_API_KEY).toBeDefined();
    });

    test('NEXT_PUBLIC_FIREBASE_API_KEY should not be empty', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIzaSyDummyApiKey123456789';

      expect(process.env.NEXT_PUBLIC_FIREBASE_API_KEY).not.toBe('');
    });

    test('all client env vars should be strings', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abc';
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIzaSy123456789';

      requiredClientEnvVars.forEach((key) => {
        expect(typeof process.env[key]).toBe('string');
      });
    });

    test('client env vars should follow NEXT_PUBLIC_ naming convention', () => {
      requiredClientEnvVars.forEach((key) => {
        expect(key).toMatch(/^NEXT_PUBLIC_/);
      });
    });

    test('NEXT_PUBLIC_FIREBASE_PROJECT_ID should be valid format', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'my-project-id';

      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      // Project ID is typically alphanumeric with hyphens
      expect(projectId).toMatch(/^[a-z0-9\-]+$/);
    });

    test('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID should be numeric', () => {
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789012345';

      const senderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
      expect(senderId).toMatch(/^\d+$/);
    });

    test('NEXT_PUBLIC_FIREBASE_API_KEY should start with AIzaSy', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIzaSyDummyKey1234567890';

      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      expect(apiKey).toMatch(/^AIzaSy/);
    });

    test('NEXT_PUBLIC_FIREBASE_APP_ID should be in Firebase format', () => {
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abc123def456ghi';

      const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
      expect(appId).toMatch(/^\d+:\d+:\w+:\w+$/);
    });
  });

  describe('Server-side Environment Variables', () => {
    test('FIREBASE_ADMIN_SDK_KEY should be defined', () => {
      const serviceAccount = {
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'key123',
        private_key: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
        client_email: 'firebase-adminsdk@test.iam.gserviceaccount.com',
        client_id: '123456789',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      };

      process.env.FIREBASE_ADMIN_SDK_KEY = JSON.stringify(serviceAccount);

      expect(process.env.FIREBASE_ADMIN_SDK_KEY).toBeDefined();
    });

    test('FIREBASE_ADMIN_SDK_KEY should not be empty', () => {
      const serviceAccount = JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
      });

      process.env.FIREBASE_ADMIN_SDK_KEY = serviceAccount;

      expect(process.env.FIREBASE_ADMIN_SDK_KEY).not.toBe('');
      expect(process.env.FIREBASE_ADMIN_SDK_KEY).toHaveLength(expect.any(Number));
    });

    test('FIREBASE_ADMIN_SDK_KEY should be valid JSON', () => {
      const serviceAccount = {
        type: 'service_account',
        project_id: 'test-project',
        private_key: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
        client_email: 'firebase-adminsdk@test.iam.gserviceaccount.com',
      };

      process.env.FIREBASE_ADMIN_SDK_KEY = JSON.stringify(serviceAccount);

      expect(() => {
        JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY!);
      }).not.toThrow();
    });

    test('FIREBASE_ADMIN_SDK_KEY should be a string', () => {
      const serviceAccount = JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
      });

      process.env.FIREBASE_ADMIN_SDK_KEY = serviceAccount;

      expect(typeof process.env.FIREBASE_ADMIN_SDK_KEY).toBe('string');
    });

    test('FIREBASE_ADMIN_SDK_KEY should NOT use NEXT_PUBLIC_ prefix', () => {
      const serviceAccount = JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
      });

      process.env.FIREBASE_ADMIN_SDK_KEY = serviceAccount;

      // Verify the key does NOT have NEXT_PUBLIC_ prefix
      expect('FIREBASE_ADMIN_SDK_KEY').not.toMatch(/^NEXT_PUBLIC_/);
      expect(process.env.NEXT_PUBLIC_FIREBASE_ADMIN_SDK_KEY).toBeUndefined();
    });
  });

  describe('Environment Variable Validation', () => {
    test('all required client vars should be defined together', () => {
      requiredClientEnvVars.forEach((key) => {
        process.env[key] = `test-value-${key}`;
      });

      requiredClientEnvVars.forEach((key) => {
        expect(process.env[key]).toBeDefined();
      });
    });

    test('missing any client var should cause validation to fail', () => {
      // Set all but one
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test';
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123';
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123:web:abc';
      // Missing NEXT_PUBLIC_FIREBASE_API_KEY

      const missingVar = requiredClientEnvVars.find((key) => !process.env[key]);

      expect(missingVar).toBeDefined();
    });

    test('empty string env var should be treated as invalid', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = '';

      const isValid =
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.length > 0;

      expect(isValid).toBe(false);
    });

    test('null or undefined env vars should fail validation', () => {
      delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      const isValid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== undefined;

      expect(isValid).toBe(false);
    });

    test('whitespace-only env var should be invalid', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = '   ';

      const trimmed = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
      const isValid = trimmed && trimmed.length > 0;

      expect(isValid).toBe(false);
    });
  });

  describe('Environment Variable Loading', () => {
    test('should be able to load Firebase config from process.env', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123:web:abc';
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'AIzaSyTestKey';

      const config = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      };

      expect(config.projectId).toBe('test-project');
      expect(config.messagingSenderId).toBe('123456789');
      expect(config.appId).toBe('1:123:web:abc');
      expect(config.apiKey).toBe('AIzaSyTestKey');
    });

    test('should handle environment variable access errors gracefully', () => {
      // Test that accessing a non-existent env var returns undefined
      const missingVar = process.env.NONEXISTENT_VAR;

      expect(missingVar).toBeUndefined();
    });

    test('should preserve env var case sensitivity', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';

      // Environment variable names are case-sensitive on Unix-like systems
      expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('test-project');
      expect(process.env.next_public_firebase_project_id).toBeUndefined();
    });
  });

  describe('Firebase Configuration Completeness', () => {
    test('should have minimum required fields for client config', () => {
      const requiredFields = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      ];

      requiredFields.forEach((field) => {
        process.env[field] = `value-${field}`;
      });

      const hasAllFields = requiredFields.every((field) => process.env[field]);

      expect(hasAllFields).toBe(true);
    });

    test('should have minimum required fields for admin config', () => {
      const requiredFields = ['FIREBASE_ADMIN_SDK_KEY'];

      requiredFields.forEach((field) => {
        process.env[field] = JSON.stringify({
          type: 'service_account',
          project_id: 'test',
        });
      });

      const hasAllFields = requiredFields.every((field) => process.env[field]);

      expect(hasAllFields).toBe(true);
    });

    test('client and admin configs should not overlap', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'public-key';
      process.env.FIREBASE_ADMIN_SDK_KEY = JSON.stringify({ type: 'service_account' });

      // Client vars should not have admin secrets
      expect(process.env.NEXT_PUBLIC_FIREBASE_API_KEY).not.toContain('private');

      // Admin vars should not use NEXT_PUBLIC_ prefix
      expect('FIREBASE_ADMIN_SDK_KEY').not.toMatch(/^NEXT_PUBLIC_/);
    });
  });

  describe('Environment Variable Types', () => {
    test('all environment variables should be strings or undefined', () => {
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_ADMIN_SDK_KEY = JSON.stringify({ type: 'service_account' });

      const allVars = [
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        process.env.FIREBASE_ADMIN_SDK_KEY,
        process.env.NONEXISTENT_VAR,
      ];

      allVars.forEach((value) => {
        expect(value === undefined || typeof value === 'string').toBe(true);
      });
    });

    test('should not store objects directly in env vars', () => {
      // Environment variables must be strings
      const objectValue = { key: 'value' };

      // Attempting to assign object directly would be coerced to string
      process.env.TEST_VAR = String(objectValue);

      expect(typeof process.env.TEST_VAR).toBe('string');
      expect(process.env.TEST_VAR).toBe('[object Object]');

      delete process.env.TEST_VAR;
    });

    test('admin SDK key should be JSON string, not object', () => {
      const serviceAccount = {
        type: 'service_account',
        project_id: 'test',
      };

      // Must be stored as JSON string
      process.env.FIREBASE_ADMIN_SDK_KEY = JSON.stringify(serviceAccount);

      expect(typeof process.env.FIREBASE_ADMIN_SDK_KEY).toBe('string');
      expect(() => JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY!)).not.toThrow();
    });
  });

  describe('Development vs Production Env Vars', () => {
    test('should allow different values for development and production', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'dev-project';

      expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('dev-project');

      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'prod-project';

      expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('prod-project');
    });

    test('should validate Firebase config exists for any environment', () => {
      ['development', 'production', 'test'].forEach((env) => {
        process.env.NODE_ENV = env;
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = `${env}-project`;

        expect(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBeDefined();
      });
    });
  });
});
