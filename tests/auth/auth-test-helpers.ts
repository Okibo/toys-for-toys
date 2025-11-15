/**
 * Auth Test Helpers
 * Shared utilities and helpers for authentication testing
 * Provides reusable functions for creating test users, mocking auth services, etc.
 */

import { jest } from '@jest/globals';

// ============================================================================
// User Creation Helpers
// ============================================================================

export interface TestUser {
  id: string;
  email: string;
  password: string;
  displayName: string;
  isVerified: boolean;
  createdAt: Date;
}

/**
 * Create a test user with default values
 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  const baseId = `test-user-${Date.now()}`;
  return {
    id: baseId,
    email: 'test@example.com',
    password: 'TestPassword123!',
    displayName: 'Test User',
    isVerified: true,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create multiple test users
 */
export function createTestUsers(count: number): TestUser[] {
  return Array.from({ length: count }, (_, i) =>
    createTestUser({
      id: `test-user-${i + 1}`,
      email: `testuser${i + 1}@example.com`,
    })
  );
}

// ============================================================================
// Login Helpers
// ============================================================================

export interface LoginResponse {
  success: boolean;
  user_id?: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Mock a successful login API response
 */
export function mockLoginSuccess(user: TestUser): LoginResponse {
  return {
    success: true,
    user_id: user.id,
    email: user.email,
    accessToken: `access-token-${user.id}`,
    refreshToken: `refresh-token-${user.id}`,
  };
}

/**
 * Mock a failed login API response
 */
export function mockLoginFailure(code: string, message: string): LoginResponse {
  return {
    success: false,
    error: { code, message },
  };
}

// ============================================================================
// Password Reset Helpers
// ============================================================================

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  resetToken?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Mock a successful password reset request
 */
export function mockResetPasswordSuccess(userId: string = 'test-user'): ResetPasswordResponse {
  // Create a valid reset token
  const resetToken = createResetToken(userId);
  return {
    success: true,
    message: 'Password reset email sent',
    resetToken,
  };
}

/**
 * Mock a failed password reset request
 */
export function mockResetPasswordFailure(code: string, message: string): ResetPasswordResponse {
  return {
    success: false,
    error: { code, message },
  };
}

/**
 * Create a password reset token
 */
export function createResetToken(userId: string, expiresIn: number = 3600000): string {
  const timestamp = Date.now();
  const expiresAt = timestamp + expiresIn;
  return Buffer.from(`${userId}:${timestamp}:${expiresAt}`).toString('base64');
}

/**
 * Validate a reset token
 */
export function validateResetToken(token: string): { userId: string; isValid: boolean; isExpired: boolean } {
  try {
    // Token should be in format: base64(userId:timestamp:expiresAt)
    if (!token || typeof token !== 'string') {
      return { userId: '', isValid: false, isExpired: false };
    }

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 3) {
      return { userId: '', isValid: false, isExpired: false };
    }

    const [userId, timestamp, expiresAtStr] = parts;

    if (!userId || !timestamp || !expiresAtStr) {
      return { userId: '', isValid: false, isExpired: false };
    }

    const expiresAt = parseInt(expiresAtStr);
    const now = Date.now();
    const isExpired = now > expiresAt;

    return { userId, isValid: true, isExpired };
  } catch {
    return { userId: '', isValid: false, isExpired: false };
  }
}

// ============================================================================
// Token Helpers
// ============================================================================

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

/**
 * Create a mock JWT token
 */
export function createMockToken(
  userId: string,
  email: string,
  type: 'access' | 'refresh' = 'access',
  expiresIn: number = type === 'access' ? 900 : 604800
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    userId,
    email,
    iat: now,
    exp: now + expiresIn,
    type,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Parse a mock JWT token
 */
export function parseMockToken(token: string): TokenPayload | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseMockToken(token);
  if (!payload) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

// ============================================================================
// Cookie Helpers
// ============================================================================

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

/**
 * Get default cookie options for access token
 */
export function getAccessTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 900000, // 15 minutes
    path: '/',
  };
}

/**
 * Get default cookie options for refresh token
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 604800000, // 7 days
    path: '/',
  };
}

/**
 * Extract token from mock cookie string
 */
export function extractTokenFromCookie(cookieString: string, tokenName: string = 'accessToken'): string | null {
  const cookies = cookieString.split(';').map((c) => c.trim());
  const tokenCookie = cookies.find((c) => c.startsWith(`${tokenName}=`));
  if (!tokenCookie) return null;
  return tokenCookie.split('=')[1];
}

// ============================================================================
// Fetch Helpers
// ============================================================================

/**
 * Mock fetch for auth endpoints
 */
export function createMockFetch(responses: Record<string, any> = {}) {
  return jest.fn(async (url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    const key = `${method} ${url}`;

    if (key in responses) {
      return {
        ok: responses[key].ok !== false,
        status: responses[key].status || 200,
        json: async () => responses[key],
      };
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    };
  });
}

// ============================================================================
// Session Helpers
// ============================================================================

export interface SessionData {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  createdAt: number;
}

/**
 * Create mock session data
 */
export function createMockSession(user: TestUser): SessionData {
  const now = Date.now();
  return {
    userId: user.id,
    email: user.email,
    accessToken: createMockToken(user.id, user.email, 'access'),
    refreshToken: createMockToken(user.id, user.email, 'refresh'),
    accessTokenExpiresAt: now + 900000,
    refreshTokenExpiresAt: now + 604800000,
    createdAt: now,
  };
}

// ============================================================================
// Form Validation Helpers
// ============================================================================

/**
 * Valid email addresses for testing
 */
export const VALID_EMAILS = [
  'user@example.com',
  'test.user@example.co.uk',
  'user+tag@example.com',
  'user.name.long@subdomain.example.com',
];

/**
 * Invalid email addresses for testing
 */
export const INVALID_EMAILS = [
  'notanemail',
  'user@',
  '@example.com',
  'user @example.com',
  'user@example',
  '',
  'user@@example.com',
];

/**
 * Valid passwords for testing
 */
export const VALID_PASSWORDS = [
  'StrongPassword123!',
  'ValidPass456@',
  'TestPassword789#',
  'MySecurePass2024!',
];

/**
 * Invalid passwords for testing
 */
export const INVALID_PASSWORDS = [
  'short',
  '12345678',
  'password',
  'PASSWORD123',
  '!@#$%^&*()',
  '',
];

// ============================================================================
// Mock Service Factories
// ============================================================================

/**
 * Create a mock login service
 */
export function createMockLoginService() {
  return {
    loginUser: jest.fn().mockResolvedValue({}),
    validateCredentials: jest.fn().mockResolvedValue(true),
    checkUserExists: jest.fn().mockResolvedValue(false),
  };
}

/**
 * Create a mock session service
 */
export function createMockSessionService() {
  return {
    generateTokenPair: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }),
    validateToken: jest.fn().mockResolvedValue(true),
    refreshAccessToken: jest.fn().mockResolvedValue('new-access-token'),
    revokeSession: jest.fn().mockResolvedValue(true),
  };
}

/**
 * Create a mock password reset service
 */
export function createMockPasswordResetService() {
  return {
    requestReset: jest.fn().mockResolvedValue({ resetToken: 'mock-reset-token' }),
    validateResetToken: jest.fn().mockResolvedValue(true),
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
    sendResetEmail: jest.fn().mockResolvedValue({ success: true }),
  };
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a token is valid and not expired
 */
export function assertValidToken(token: string | undefined): asserts token is string {
  expect(token).toBeDefined();
  expect(typeof token).toBe('string');
  expect(token.length).toBeGreaterThan(0);
  expect(isTokenExpired(token)).toBe(false);
}

/**
 * Assert cookie options
 */
export function assertCookieOptions(options: any, expectedSecure: boolean = false) {
  expect(options.httpOnly).toBe(true);
  expect(options.secure).toBe(expectedSecure);
  expect(['strict', 'lax', 'none']).toContain(options.sameSite);
  expect(options.path).toBe('/');
}

/**
 * Assert successful login response
 */
export function assertSuccessfulLogin(response: LoginResponse) {
  expect(response.success).toBe(true);
  expect(response.user_id).toBeDefined();
  expect(response.email).toBeDefined();
  expect(response.accessToken).toBeDefined();
  expect(response.refreshToken).toBeDefined();
}

/**
 * Assert failed login response
 */
export function assertFailedLogin(response: LoginResponse) {
  expect(response.success).toBe(false);
  expect(response.error).toBeDefined();
  expect(response.error?.code).toBeDefined();
  expect(response.error?.message).toBeDefined();
}

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Create test data for different login scenarios
 */
export const LOGIN_TEST_SCENARIOS = {
  validCredentials: {
    email: 'valid@example.com',
    password: 'ValidPassword123!',
  },
  invalidPassword: {
    email: 'valid@example.com',
    password: 'WrongPassword',
  },
  nonexistentUser: {
    email: 'nonexistent@example.com',
    password: 'SomePassword123!',
  },
  unverifiedEmail: {
    email: 'unverified@example.com',
    password: 'ValidPassword123!',
  },
};

/**
 * Create test data for password reset scenarios
 */
export const PASSWORD_RESET_TEST_SCENARIOS = {
  validEmail: {
    email: 'valid@example.com',
  },
  nonexistentEmail: {
    email: 'nonexistent@example.com',
  },
  invalidEmail: {
    email: 'not-an-email',
  },
  newPassword: {
    password: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  },
  mismatchedPasswords: {
    password: 'Password123!',
    confirmPassword: 'DifferentPassword123!',
  },
  weakPassword: {
    password: 'weak',
    confirmPassword: 'weak',
  },
};

// ============================================================================
// Cleanup Helpers
// ============================================================================

/**
 * Clear all auth-related state and mocks
 */
export function clearAuthState() {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  // Clear cookies from document
  document.cookie.split(';').forEach((c) => {
    document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });
}

/**
 * Setup auth test environment
 */
export function setupAuthTestEnvironment() {
  // Mock localStorage
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
  });

  // Mock sessionStorage
  const sessionStore: Record<string, string> = {};
  const mockSessionStorage = {
    getItem: (key: string) => sessionStore[key] || null,
    setItem: (key: string, value: string) => {
      sessionStore[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete sessionStore[key];
    },
    clear: () => {
      Object.keys(sessionStore).forEach((key) => {
        delete sessionStore[key];
      });
    },
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
  });

  return {
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
  };
}

/**
 * Teardown auth test environment
 */
export function teardownAuthTestEnvironment() {
  clearAuthState();
}
