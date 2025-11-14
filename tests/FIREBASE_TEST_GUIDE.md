# Firebase Test Guide - Quick Reference

## Test Files Overview

```
tests/
├── firebase.test.ts              # Client initialization (11 tests)
├── firebase-admin.test.ts        # Server Admin SDK (19 tests)
├── firebase-messaging.test.ts    # Message handling (25 tests)
├── firebase-env.test.ts          # Env variables (42 tests)
├── firebase-security.test.ts     # Security & compliance (39 tests)
├── FIREBASE_TESTS_SUMMARY.md     # Comprehensive overview
└── FIREBASE_TEST_GUIDE.md        # This file
```

**Total: 136 tests across 5 test files**

---

## Running Tests

### Quick Start

```bash
# Run all Firebase tests
npm test -- tests/firebase --no-coverage

# Run specific test file
npm test -- tests/firebase.test.ts --no-coverage

# Run with coverage report
npm test -- tests/firebase --coverage

# Watch mode for development
npm test -- tests/firebase --watch
```

### Debugging a Specific Test

```bash
# Run only one test suite
npm test -- tests/firebase-env.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should have"

# Show more details
npm test -- --verbose
```

---

## Current Status: RED PHASE (All Failing)

Tests expect these implementations that don't exist yet:

### Missing Implementations

1. `lib/firebase.ts` - Client initialization
2. `lib/firebase-admin.ts` - Admin SDK & messaging
3. Firebase packages not installed
4. Environment variables not configured

### Expected Failure Message

```
Cannot find module 'firebase/app'
Cannot find module '@/lib/firebase'
Cannot find module '@/lib/firebase-admin'
```

---

## What Each Test File Validates

### firebase.test.ts

**Validates client-side Firebase setup**

Test examples:

```typescript
// App initialization
✓ should initialize Firebase app without throwing errors
✓ Firebase config should contain all required fields

// Environment variables
✓ NEXT_PUBLIC_FIREBASE_API_KEY should be a non-empty string
✓ Firebase config values should match environment variables

// Messaging
✓ should provide messaging instance from Firebase app
✓ messaging instance should have required methods
```

### firebase-admin.test.ts

**Validates server-side Firebase Admin setup**

Test examples:

```typescript
// Admin initialization
✓ should initialize Firebase Admin app
✓ should parse service account JSON from FIREBASE_ADMIN_SDK_KEY

// Credentials validation
✓ service account should have required fields
✓ should not expose private credentials to client-side

// Functions
✓ sendPushNotification function should exist with correct signature
✓ Admin messaging should have send method for single messages
```

### firebase-messaging.test.ts

**Validates message handling**

Test examples:

```typescript
// Subscriptions
✓ should handle foreground messages with onMessage
✓ should trigger callback when foreground message is received

// Tokens
✓ should request device token with getToken
✓ should validate device token format

// Errors
✓ should handle messaging not supported
✓ should handle token refresh expiry
```

### firebase-env.test.ts

**Validates environment variables**

Test examples:

```typescript
// Client variables
✓ NEXT_PUBLIC_FIREBASE_PROJECT_ID should be defined
✓ NEXT_PUBLIC_FIREBASE_API_KEY should start with AIzaSy
✓ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID should be numeric

// Server variables
✓ FIREBASE_ADMIN_SDK_KEY should be defined (server-side only)
✓ FIREBASE_ADMIN_SDK_KEY should be valid JSON

// Validation
✓ missing any client var should cause validation to fail
✓ empty string env var should be treated as invalid
```

### firebase-security.test.ts

**Validates security best practices**

Test examples:

```typescript
// Credentials protection
✓ FIREBASE_ADMIN_SDK_KEY should not use NEXT_PUBLIC_ prefix
✓ admin SDK key should not be accessible via process.env in browser

// Key validation
✓ private_key should start with "-----BEGIN RSA PRIVATE KEY-----"
✓ private_key should contain newline characters for formatting

// Exposure prevention
✓ should not expose credentials in error messages
✓ should not accidentally expose admin SDK in bundle
```

---

## Implementation Checklist

Use this to track implementation progress:

### 1. Install Firebase Packages

- [ ] Run `npm install firebase firebase-admin`
- [ ] Verify packages in package.json

### 2. Create lib/firebase.ts (Client)

```typescript
// Should export:
export const app: FirebaseApp;
export const messaging: Messaging;

// Should handle:
- Load NEXT_PUBLIC_* env vars
- Initialize Firebase with config
- Create messaging instance
- Prevent duplicate initialization
```

### 3. Create lib/firebase-admin.ts (Server)

```typescript
// Should export:
export const adminApp: FirebaseAdminApp;
export const sendPushNotification: (message) => Promise<string>;

// Should handle:
- Load FIREBASE_ADMIN_SDK_KEY env var
- Parse service account JSON
- Initialize Admin SDK
- Provide messaging client
```

### 4. Configure Environment Variables

In `.env.local`:

```bash
# Client-side (safe for browser)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...

# Server-side only (private)
FIREBASE_ADMIN_SDK_KEY={...service account JSON...}
```

### 5. Implement Messaging Functions

- [ ] Create message subscription helper in `lib/firebase-messaging.ts`
- [ ] Handle foreground messages
- [ ] Token retrieval and validation
- [ ] Service worker registration

### 6. Run Tests

```bash
npm test -- tests/firebase --no-coverage
# All 136 tests should pass (GREEN phase)
```

---

## Expected Test Results After Implementation

### Once Fully Implemented

```
PASS tests/firebase.test.ts (11 tests)
PASS tests/firebase-admin.test.ts (19 tests)
PASS tests/firebase-messaging.test.ts (25 tests)
PASS tests/firebase-env.test.ts (42 tests)
PASS tests/firebase-security.test.ts (39 tests)

Test Suites: 5 passed, 5 total
Tests:       136 passed, 136 total
Time:        ~2-3 seconds
```

---

## Common Test Patterns Used

### Environment Variable Testing

```typescript
beforeEach(() => {
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
});

test('should validate API key', () => {
  expect(process.env.NEXT_PUBLIC_FIREBASE_API_KEY).toBeDefined();
});
```

### Mocking Firebase

```typescript
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

test('should initialize app', () => {
  const { initializeApp } = require('firebase/app');
  expect(initializeApp).toHaveBeenCalled();
});
```

### Async Testing

```typescript
test('should request device token', async () => {
  const token = await getToken(messaging, { vapidKey: 'key' });
  expect(token).toBeDefined();
});
```

---

## Test Coverage Goals

### Current Coverage (Red Phase)

- Statement: 0% (no implementation)
- Branch: 0% (no implementation)
- Function: 0% (no implementation)
- Line: 0% (no implementation)

### Target Coverage (Green Phase)

- Statement: 85%+
- Branch: 80%+
- Function: 90%+
- Line: 85%+

### Generate Coverage Report

```bash
npm test -- tests/firebase --coverage
```

---

## Troubleshooting

### Firebase Modules Not Found

**Problem**: `Cannot find module 'firebase/app'`
**Solution**:

```bash
npm install firebase firebase-admin
npm test -- tests/firebase --no-coverage
```

### Environment Variables Not Set

**Problem**: `NEXT_PUBLIC_FIREBASE_API_KEY should be defined`
**Solution**: Create `.env.local` with Firebase config

### Service Worker Errors

**Problem**: Tests fail with service worker not available
**Solution**: Tests mock service worker - likely implementation issue

### Tests Pass But App Doesn't Initialize

**Problem**: All tests pass but Firebase not working in app
**Solution**:

- Verify `lib/firebase.ts` is correctly exporting
- Check component imports use correct path `@/lib/firebase`
- Verify `.env.local` matches test expectations

---

## Key Security Requirements

All tests enforce these security patterns:

1. **NEXT*PUBLIC* Prefix Rule**
   - Only client-safe values use NEXT*PUBLIC*
   - Admin SDK key NEVER has this prefix

2. **Environment-Only Credentials**
   - No hardcoded credentials in source code
   - All secrets loaded from environment variables

3. **Server-Side Only Admin SDK**
   - Firebase Admin only imported in:
     - `lib/firebase-admin.ts`
     - `pages/api/*` routes
     - `supabase/functions/*` Edge Functions
   - NEVER imported in components or client code

4. **Private Key Format**
   - Must include RSA delimiters
   - Must contain newline escapes (\n)
   - Must not be placeholder text

5. **No Credential Exposure**
   - Error messages don't include credentials
   - Logs don't contain private keys
   - Tests validate prevention of accidental exposure

---

## Integration with Project

These Firebase functions will be used by:

1. **Pages/API Routes**
   - `pages/api/notifications/send` - Send push via messaging
   - `pages/api/tokens/save` - Store device tokens

2. **Supabase Edge Functions**
   - Trigger on exchange events
   - Send notifications to participants

3. **React Components**
   - Subscribe to foreground messages
   - Display in-app notifications
   - Request permission & get token

4. **Service Workers**
   - Handle background messages
   - Open app/navigate on click
   - Show system notifications

---

## Notes for Developers

- Tests are ordered by complexity (basic → advanced)
- Each test is independent and can run in any order
- Mock objects are reset between tests
- Environment variables are cleaned up after each test
- Comments in tests explain validation purpose
- Test names follow pattern: "should [action] [when condition]"

---

## Quick Links

- Firebase Web SDK: https://firebase.google.com/docs/web
- Firebase Admin SDK: https://firebase.google.com/docs/admin
- Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- Project CLAUDE.md: See project documentation
- Environment Setup: See .env.example

---

**Status**: RED PHASE (Tests Failing - Ready for Implementation)

When implementation is complete, run:

```bash
npm test -- tests/firebase --coverage
```

All 136 tests should PASS with >80% coverage.
