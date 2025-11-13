# Firebase Test Suite Summary

## Overview
This document provides a comprehensive overview of the Firebase test suite created for the Toys-for-Toys project. All tests are in **RED PHASE** (failing) and designed to guide the implementation of Firebase functionality.

## Test Files Created

### 1. `/tests/firebase.test.ts` (7,282 bytes)
**Purpose**: Client-side Firebase initialization and configuration

**Tests validate**:
- Firebase client app initializes successfully with NEXT_PUBLIC_* env vars
- All required Firebase config fields are present (apiKey, projectId, messagingSenderId, appId)
- Firebase app prevents duplicate initialization
- Messaging instance can be obtained from initialized app
- Messaging instance has required methods (onMessage, getToken, deleteToken)
- Environment variables are non-empty strings
- Config values match environment variables
- No private credentials are exposed in public config

**Key test groups**:
- App initialization and configuration validation
- Environment variable type and value checking
- Messaging instance retrieval
- Duplicate initialization prevention
- Security checks for public config

**Implementation target**: `lib/firebase.ts`

---

### 2. `/tests/firebase-admin.test.ts` (9,430 bytes)
**Purpose**: Server-side Firebase Admin SDK initialization

**Tests validate**:
- Firebase Admin app initializes with FIREBASE_ADMIN_SDK_KEY
- Admin messaging client is available
- Service account JSON is properly parsed from env
- All required service account fields are present
- Private credentials are NOT exposed via NEXT_PUBLIC_ variables
- sendPushNotification function exists with correct signature
- Admin app prevents duplicate initialization
- Service account has valid structure and format

**Key test groups**:
- Admin SDK initialization
- Service account credential parsing
- Required credential field validation
- Private key format verification
- Client-side exposure prevention
- Messaging function signature validation
- Singleton initialization pattern

**Implementation target**: `lib/firebase-admin.ts`

**Expected exports**:
```typescript
export const sendPushNotification: (message: {
  token: string;
  notification: { title: string; body: string };
  data?: Record<string, string>;
}) => Promise<string>;
```

---

### 3. `/tests/firebase-messaging.test.ts` (13,521 bytes)
**Purpose**: Firebase Cloud Messaging functionality and message handling

**Tests validate**:
- Foreground message subscription works with onMessage
- Message callback is triggered when messages arrive
- Multiple message listeners can be registered
- Message payload structure is valid (notification, data fields)
- Notification title and body can be extracted
- Device tokens can be requested and validated
- Token has proper format and is non-empty
- Token deletion works correctly
- Service worker is registered for background messages
- Errors are handled gracefully

**Key test groups**:
- Foreground message subscription
- Message payload validation
- Device token handling and validation
- Message lifecycle and cleanup
- Error handling for common failures
- Service worker integration

**Implementation requirements**:
- Must register service worker for background messages
- Must support onMessage subscription in foreground
- Must validate token format before storage/use
- Must handle permission denied errors gracefully

---

### 4. `/tests/firebase-env.test.ts` (14,681 bytes)
**Purpose**: Environment variable validation and configuration completeness

**Tests validate**:
- NEXT_PUBLIC_FIREBASE_PROJECT_ID is defined and non-empty
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is defined and numeric
- NEXT_PUBLIC_FIREBASE_APP_ID is defined in correct format
- NEXT_PUBLIC_FIREBASE_API_KEY is defined and starts with "AIzaSy"
- FIREBASE_ADMIN_SDK_KEY is defined (server-side only)
- All client env vars are strings
- All client env vars follow NEXT_PUBLIC_ naming
- Admin SDK key uses JSON string format
- All required vars are available together
- Missing or empty vars fail validation
- Whitespace-only vars are invalid

**Key test groups**:
- Client-side env var validation (NEXT_PUBLIC_*)
- Server-side env var validation
- Type checking for all variables
- Format validation for specific values
- Environment variable loading patterns
- Development vs production configuration
- Complete configuration validation

**Configuration requirements**:
```bash
# Client-side (NEXT_PUBLIC_* - safe for browser)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# Server-side only (FIREBASE_ADMIN_SDK_KEY)
FIREBASE_ADMIN_SDK_KEY={"type":"service_account",...}
```

---

### 5. `/tests/firebase-security.test.ts` (18,145 bytes)
**Purpose**: Security best practices and credentials protection

**Tests validate**:
- Service account has required fields (type, project_id, private_key, client_email, etc.)
- Private key is properly formatted with PEM delimiters and newlines
- Private key is not a placeholder value
- FIREBASE_ADMIN_SDK_KEY does NOT use NEXT_PUBLIC_ prefix
- Admin SDK credentials are not accessible in browser environment
- Public config contains only safe values
- No sensitive data in error messages
- Credentials are not hardcoded in source code
- Credentials support rotation without code changes
- Admin SDK only accessible from server-side code

**Key test groups**:
- Service account key structure validation
- Private key format verification
- Client-side exposure prevention (critical)
- Public config security
- Credential validation before use
- Environment-specific configuration
- Secure initialization patterns
- Compliance and audit requirements

**Security requirements**:
1. Admin SDK key MUST NOT be prefixed with NEXT_PUBLIC_
2. Private key MUST be in valid RSA format with newlines preserved
3. Credentials MUST come from environment variables, not hardcoded
4. Admin SDK MUST only be imported in:
   - API routes (`pages/api/*`)
   - Edge Functions (`supabase/functions/*`)
   - Server-side utilities (`lib/firebase-admin.ts`)
5. Client SDK MUST use public, restricted API key
6. No credentials in logs, error messages, or bundle

---

## Test Statistics

| File | Size | Tests | Key Focus |
|------|------|-------|-----------|
| firebase.test.ts | 7.3 KB | 11 | Client initialization |
| firebase-admin.test.ts | 9.4 KB | 19 | Admin SDK setup |
| firebase-messaging.test.ts | 13.5 KB | 25 | Message handling |
| firebase-env.test.ts | 14.7 KB | 42 | Environment validation |
| firebase-security.test.ts | 18.1 KB | 39 | Security & compliance |
| **TOTAL** | **63.0 KB** | **136** | **Firebase setup** |

---

## Running the Tests

### All Firebase Tests
```bash
npm test -- tests/firebase --no-coverage
```

### Individual Test Files
```bash
# Client initialization
npm test -- tests/firebase.test.ts --no-coverage

# Admin SDK
npm test -- tests/firebase-admin.test.ts --no-coverage

# Messaging functionality
npm test -- tests/firebase-messaging.test.ts --no-coverage

# Environment variables
npm test -- tests/firebase-env.test.ts --no-coverage

# Security validation
npm test -- tests/firebase-security.test.ts --no-coverage
```

### With Coverage
```bash
npm test -- tests/firebase --coverage
```

---

## Current Phase: RED

All tests are currently **FAILING** because:

1. Firebase packages are not installed (`firebase`, `firebase-admin`)
2. Client-side Firebase initialization code (`lib/firebase.ts`) doesn't exist
3. Server-side Admin SDK code (`lib/firebase-admin.ts`) doesn't exist
4. Message handling utilities don't exist
5. Environment variables are not configured

### Test Failures Include
- Module not found errors for Firebase packages
- Missing module errors for `@/lib/firebase` and `@/lib/firebase-admin`
- Environment variable missing/undefined errors

---

## Next Steps (GREEN Phase)

To make these tests pass, implement:

1. **Install Firebase packages**
   ```bash
   npm install firebase firebase-admin
   ```

2. **Create `lib/firebase.ts`** - Client-side initialization
   - Initialize Firebase app with NEXT_PUBLIC_* config
   - Export messaging instance
   - Implement singleton pattern to prevent duplicate initialization

3. **Create `lib/firebase-admin.ts`** - Server-side Admin SDK
   - Initialize Admin SDK with service account credentials
   - Export sendPushNotification function
   - Implement getMessaging for admin access

4. **Create message handling utilities**
   - Foreground message subscription helpers
   - Token management functions
   - Error handling wrappers

5. **Configure environment variables** in `.env.local`
   - Set all NEXT_PUBLIC_FIREBASE_* vars
   - Set FIREBASE_ADMIN_SDK_KEY (server-side only)

6. **Update package.json** with Firebase dependencies
   - Add Firebase client SDK
   - Add Firebase Admin SDK

---

## Test Architecture

### Mocking Strategy
- Firebase modules are mocked to avoid external dependencies
- Service worker APIs are mocked for testing browser features
- Environment variables are managed per test with beforeEach/afterEach

### Test Patterns
- **Arrange-Act-Assert** format
- Isolated tests with proper cleanup
- Clear test names describing behavior and expectations
- Comments explaining complex test logic
- Setup/teardown for environment state

### Jest Configuration
- Uses `ts-jest` preset for TypeScript
- Test environment: `node`
- Timeout: 10 seconds (suitable for async operations)
- Module name mapper for `@/` aliases

---

## Dependencies

### Required Firebase Packages
```json
{
  "dependencies": {
    "firebase": "^9.x or higher",
    "firebase-admin": "^11.x or higher"
  }
}
```

### Test Dependencies
- Jest 29.7.0
- ts-jest 29.4.5
- TypeScript 5.2.2

---

## Security Checklist

These tests ensure:

- [ ] Private Firebase Admin SDK key never exposed to browser
- [ ] Service account JSON properly stored as environment variable
- [ ] Public API key is restricted at Firebase Console
- [ ] No hardcoded credentials in source code
- [ ] Credentials support rotation without redeployment
- [ ] Error messages don't leak sensitive information
- [ ] Admin SDK only used in server-side code
- [ ] Environment variable validation prevents partial setup
- [ ] Type safety for credential structures

---

## Integration Points

These tests will ensure Firebase integration with:

1. **Supabase Edge Functions** - Trigger notifications on exchanges
2. **Next.js API Routes** - Send notifications from backend
3. **React Components** - Subscribe to foreground messages
4. **Service Workers** - Handle background messages
5. **Database** - Store device tokens with RLS policies

---

## Documentation References

- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [GDPR Compliance](https://firebase.google.com/support/privacy) - Important for child data handling

---

## Notes for Implementation

1. Always use NEXT_PUBLIC_ prefix for browser-accessible variables
2. Keep Admin SDK credentials in FIREBASE_ADMIN_SDK_KEY only
3. Validate environment variables at application startup
4. Use service worker for background message handling
5. Implement singleton pattern for Firebase app initialization
6. Handle Messaging API unavailability gracefully (older browsers)
7. Store device tokens in Supabase with RLS policies
8. Implement token refresh logic for expired tokens
