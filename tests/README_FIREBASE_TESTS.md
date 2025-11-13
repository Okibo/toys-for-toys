# Firebase Test Suite - Task 1.3 Implementation

## Project Context
**Toys-for-Toys** - Cross-platform toy exchange platform with Firebase Cloud Messaging for push notifications.

## Test Suite Overview

This comprehensive test suite follows **Test-Driven Development (TDD)** methodology. All tests are currently in the **RED PHASE** (failing) and are designed to guide the Firebase implementation.

### File Structure
```
tests/
├── firebase.test.ts                   # Client-side initialization
├── firebase-admin.test.ts             # Server-side Admin SDK
├── firebase-messaging.test.ts         # Message handling
├── firebase-env.test.ts               # Environment validation
├── firebase-security.test.ts          # Security compliance
├── README_FIREBASE_TESTS.md           # This file
├── FIREBASE_TESTS_SUMMARY.md          # Detailed documentation
└── FIREBASE_TEST_GUIDE.md             # Quick reference
```

## Test Statistics

| Test File | Size | Tests | Focus Area |
|-----------|------|-------|-----------|
| `firebase.test.ts` | 7.3 KB | 11 | Client Firebase initialization |
| `firebase-admin.test.ts` | 9.4 KB | 19 | Server-side Admin SDK |
| `firebase-messaging.test.ts` | 13.5 KB | 25 | FCM message handling |
| `firebase-env.test.ts` | 14.7 KB | 42 | Environment variables |
| `firebase-security.test.ts` | 18.1 KB | 39 | Security & compliance |
| **TOTAL** | **63.0 KB** | **136 tests** | **Complete Firebase setup** |

## Test Coverage by Component

### 1. Client Initialization (`firebase.test.ts`)
**11 tests** ensuring proper browser-side Firebase setup.

**Validates**:
- Firebase app initialization with NEXT_PUBLIC_* environment variables
- Config object has all required fields
- Messaging instance creation and method availability
- Environment variable types and values
- Prevention of duplicate initialization
- No private credentials in public config

**Implementation target**: `lib/firebase.ts`

### 2. Admin SDK (`firebase-admin.test.ts`)
**19 tests** ensuring secure server-side Firebase Admin setup.

**Validates**:
- Admin SDK initialization with service account credentials
- Service account JSON parsing and validation
- Presence of all required credential fields
- Private key format verification
- Prevention of credential exposure to browser
- Messaging function availability and signature
- Singleton app management

**Implementation target**: `lib/firebase-admin.ts`

**Expected function signature**:
```typescript
export async function sendPushNotification(message: {
  token: string;
  notification: { title: string; body: string };
  data?: Record<string, string>;
}): Promise<string>
```

### 3. Message Handling (`firebase-messaging.test.ts`)
**25 tests** ensuring reliable message delivery and token management.

**Validates**:
- Foreground message subscription and callbacks
- Message payload structure and content extraction
- Device token request, validation, and storage
- Token deletion and refresh workflows
- Multiple listener support
- Graceful error handling
- Service worker integration

**Key features tested**:
- `onMessage()` subscription
- `getToken()` device token retrieval
- `deleteToken()` cleanup
- Message payload validation
- Token format verification

### 4. Environment Variables (`firebase-env.test.ts`)
**42 tests** ensuring complete and valid configuration.

**Validates**:
- All NEXT_PUBLIC_FIREBASE_* variables defined
- All FIREBASE_ADMIN_SDK_KEY is server-side only
- Correct variable types (strings, not empty)
- Proper formatting (API key starts with "AIzaSy", etc.)
- Valid JSON for service account
- Environment variable loading patterns
- Development vs production configurations

**Required variables**:
```bash
# Client-side (browser-accessible)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-project
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

# Server-side only
FIREBASE_ADMIN_SDK_KEY={"type":"service_account",...}
```

### 5. Security (`firebase-security.test.ts`)
**39 tests** enforcing security best practices and compliance.

**Validates**:
- Service account key structure completeness
- Private key RSA format with newlines
- Prevention of public exposure (NEXT_PUBLIC_ rule)
- No hardcoded credentials in source
- Public config contains only safe values
- No credential leakage in logs/errors
- Credential rotation support
- Access control (server-side only)
- Compliance and audit requirements

**Critical security checks**:
1. Admin SDK key NEVER has NEXT_PUBLIC_ prefix
2. Private key format includes RSA delimiters and newlines
3. No placeholder credentials in environment
4. Admin SDK only imported in server code

## Running the Tests

### Full Test Suite
```bash
# Run all Firebase tests
npm test -- tests/firebase --no-coverage

# Run with coverage report
npm test -- tests/firebase --coverage

# Watch mode during development
npm test -- tests/firebase --watch
```

### Individual Test Files
```bash
npm test -- tests/firebase.test.ts --no-coverage
npm test -- tests/firebase-admin.test.ts --no-coverage
npm test -- tests/firebase-messaging.test.ts --no-coverage
npm test -- tests/firebase-env.test.ts --no-coverage
npm test -- tests/firebase-security.test.ts --no-coverage
```

### Debugging
```bash
# Show detailed output
npm test -- tests/firebase --verbose

# Run specific test by name
npm test -- --testNamePattern="should initialize"

# Show coverage for specific file
npm test -- tests/firebase.test.ts --coverage
```

## Current Status: RED PHASE

All 136 tests are **FAILING** because:

1. **Missing Firebase packages**
   - `firebase` not installed
   - `firebase-admin` not installed

2. **Missing implementations**
   - `lib/firebase.ts` doesn't exist
   - `lib/firebase-admin.ts` doesn't exist
   - Utility functions not created

3. **Missing configuration**
   - `.env.local` not configured with Firebase credentials
   - Environment variables not set

### Typical Error Output
```
Cannot find module 'firebase/app'
Cannot find module '@/lib/firebase'
Cannot find module '@/lib/firebase-admin'
```

## Implementation Roadmap (To GREEN Phase)

### Phase 1: Setup (1-2 hours)
```bash
npm install firebase firebase-admin
```

### Phase 2: Create Client Library (2-3 hours)
Create `lib/firebase.ts`:
- Initialize Firebase app with NEXT_PUBLIC_* config
- Export messaging instance
- Implement singleton pattern
- Handle initialization errors

### Phase 3: Create Admin Library (2-3 hours)
Create `lib/firebase-admin.ts`:
- Initialize Admin SDK with service account
- Export `sendPushNotification()` function
- Provide messaging client
- Validate credentials

### Phase 4: Create Utilities (2-3 hours)
Create `lib/firebase-messaging.ts`:
- Message subscription wrapper
- Token management helpers
- Error handling
- Service worker registration

### Phase 5: Configuration (30 minutes)
Update `.env.local`:
- Add NEXT_PUBLIC_FIREBASE_* variables
- Add FIREBASE_ADMIN_SDK_KEY

### Phase 6: Verification (30 minutes)
```bash
npm test -- tests/firebase --coverage
# All 136 tests should PASS
```

**Total estimated time**: 8-12 hours

## Test Quality Attributes

### Design Patterns Used
- **Arrange-Act-Assert** (AAA) pattern in each test
- **Given-When-Then** semantics in test names
- **Single responsibility** per test
- **Clear setup and teardown** with beforeEach/afterEach
- **Meaningful assertions** with clear error messages

### Code Organization
- **Logical grouping** with `describe()` blocks
- **Related tests** grouped by feature
- **Comments** explaining non-obvious test logic
- **Mock consistency** across all tests
- **Environmental isolation** - tests don't affect each other

### Maintainability
- **Descriptive test names** - instantly understand what's tested
- **DRY principle** - helper functions for repeated setup
- **No hardcoded magic values** - use constants
- **Self-documenting** - minimal comments needed
- **Easy to extend** - add new tests without modifying existing ones

## Dependencies

### Required (New)
```json
{
  "dependencies": {
    "firebase": "^9.0.0 or higher",
    "firebase-admin": "^11.0.0 or higher"
  }
}
```

### Already Installed
- Jest 29.7.0
- ts-jest 29.4.5
- TypeScript 5.2.2
- Supabase client
- React 18.2.0

## Integration Points

These Firebase tests ensure compatibility with:

1. **Supabase Edge Functions**
   - Trigger on database events (exchanges, messages)
   - Call `sendPushNotification()` from Admin SDK

2. **Next.js API Routes**
   - `pages/api/notifications/*` routes
   - `pages/api/tokens/*` routes
   - Use Admin SDK for server-side messaging

3. **React Components**
   - Subscribe to foreground messages
   - Request notification permission
   - Retrieve and send device tokens
   - Display in-app notifications

4. **Service Workers**
   - Handle background messages
   - Show system notifications
   - Navigate on notification click

## Security Compliance

Tests ensure compliance with:

- **GDPR** - Child data handling with parental consent
- **Privacy** - Credentials never exposed to client
- **Best practices** - Private keys properly formatted
- **Access control** - Admin SDK only in server code
- **Audit** - Credential rotation without redeployment

## Documentation

Additional documentation:
- `FIREBASE_TESTS_SUMMARY.md` - Comprehensive test documentation
- `FIREBASE_TEST_GUIDE.md` - Quick reference and troubleshooting
- `.env.example` - Environment variable templates
- `CLAUDE.md` - Project architectural guidance

## Success Criteria

Tests are **successful** when:

1. All 136 tests PASS
2. Code coverage > 80% for statements
3. Code coverage > 80% for branches
4. No security warnings in implementation
5. Firebase initialization is singleton
6. Device tokens are properly validated
7. Message payloads are correctly structured
8. Admin SDK is not exposed to browser
9. Environment variables are validated
10. Credentials support rotation

## Next Developer Action

1. **Review tests** - Read test names and understand what's being validated
2. **Install dependencies** - `npm install firebase firebase-admin`
3. **Create implementations** - Follow test requirements to code
4. **Run tests frequently** - Use `npm test -- tests/firebase --watch`
5. **Check coverage** - Aim for >80% coverage
6. **Verify integration** - Test with real notification flow

## Quick Links

- Firebase Web SDK: https://firebase.google.com/docs/web/setup
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Cloud Messaging: https://firebase.google.com/docs/cloud-messaging/android/client
- Jest Documentation: https://jestjs.io/docs/getting-started
- TypeScript Testing: https://www.typescriptlang.org/docs/handbook/testing.html

---

**Created**: Task 1.3 - Firebase Project Setup (TDD)
**Phase**: RED (All tests failing - ready for implementation)
**Tests**: 136 across 5 comprehensive test files
**Status**: Ready for implementation to proceed to GREEN phase
