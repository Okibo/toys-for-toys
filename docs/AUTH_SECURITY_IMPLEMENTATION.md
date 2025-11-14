# Authentication Security Implementation

## Overview

This document describes the security implementation for email/password authentication in Toy-for-Toy. It covers:

1. **Token Management & Session Persistence**
2. **Rate Limiting (Login, Signup, Password Reset)**
3. **Security Headers (CSP, HSTS, X-Frame-Options, etc.)**
4. **Password Security & Validation**
5. **CSRF Protection**
6. **Audit Logging & Monitoring**

## Architecture

### Components

```
Frontend (Next.js + React)
        ↓
Middleware (middleware.ts) ← Security Headers, Token Validation
        ↓
API Routes (app/api/auth/*) ← Rate Limiting, Password Validation
        ↓
Supabase Auth Service ← JWT Tokens, Session Management
        ↓
Database (PostgreSQL) ← Audit Logs
```

## 1. Token Management & Session Persistence

### Implementation

**Files:**

- `lib/supabase.ts` - Supabase client configuration
- `middleware.ts` - JWT validation and session checks

### How It Works

1. **Login Flow:**
   - User submits email + password to `/api/auth/login`
   - Supabase Auth validates credentials
   - Returns JWT access token + refresh token
   - Tokens stored in httpOnly cookies (cannot access via JavaScript)

2. **Token Expiration:**
   - Access Token: 1 hour
   - Refresh Token: 7 days (auto-rotates on use)
   - Supabase handles automatic refresh seamlessly

3. **Session Persistence:**
   - httpOnly cookies survive page reloads
   - Middleware validates JWT on each protected request
   - Automatic token refresh happens server-side

4. **Logout:**
   - Call `/api/auth/logout`
   - Clears cookies
   - Invalidates refresh token

### JWT Structure

```
Header: { alg: 'HS256', typ: 'JWT' }
Payload: {
  aud: 'authenticated',
  sub: 'user-uuid',
  iat: 1234567890,
  exp: 1234571490,
  email: 'user@example.com',
  email_verified: true,
  role: 'authenticated'
}
Signature: HMAC-SHA256(header.payload, secret)
```

### Configuration

No additional configuration needed - Supabase handles JWT creation/validation.

## 2. Rate Limiting

### Implementation

**File:** `lib/rate-limiter.ts`

### Rate Limits

| Operation      | Limit | Window | By    |
| -------------- | ----- | ------ | ----- |
| Login (failed) | 5     | 15 min | Email |
| Signup         | 3     | 1 hour | IP    |
| Password Reset | 3     | 1 hour | Email |
| Email Check    | 10    | 1 min  | IP    |

### Usage in API Routes

```typescript
// In app/api/auth/login/route.ts
import { checkLoginLimit } from '@/lib/rate-limiter';
import { getClientIP } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { email, password } = await request.json();

  // Check rate limit
  const rateLimitStatus = checkLoginLimit(email, ip);
  if (!rateLimitStatus.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts' },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimitStatus.retryAfter,
        },
      }
    );
  }

  // Continue with login logic
  // ...
}
```

### Monitoring Rate Limit Violations

Rate limit violations are logged with:

- Timestamp
- Limit type (login, signup, etc.)
- Masked identifier (e.g., `us**@example.com`)
- Context (IP, attempt count)

Review these logs regularly for:

- Brute force attack patterns
- Credential stuffing attempts
- Account enumeration attempts

### Upgrade Path: Redis (Production)

Current implementation uses in-memory store (suitable for single instance).

For distributed deployments (Vercel, Kubernetes, etc.), upgrade to Redis:

```typescript
// Use Vercel KV or similar
import { kv } from '@vercel/kv';

export async function checkLoginLimitRedis(email: string): Promise<RateLimitResult> {
  const key = `login:${email}`;
  const count = await kv.incr(key);

  if (count === 1) {
    // Set expiry on first increment
    await kv.expire(key, 15 * 60); // 15 minutes
  }

  // ... rest of logic
}
```

## 3. Security Headers

### Implementation

**Files:**

- `lib/security-headers.ts` - Header generation
- `next.config.js` - Global header configuration
- `middleware.ts` - Dynamic header application

### Headers Applied

| Header                        | Value                                          | Purpose                     |
| ----------------------------- | ---------------------------------------------- | --------------------------- |
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains; preload` | Enforce HTTPS               |
| **Content-Security-Policy**   | Restrictive                                    | Prevent XSS, code injection |
| **X-Frame-Options**           | `DENY`                                         | Prevent clickjacking        |
| **X-Content-Type-Options**    | `nosniff`                                      | Prevent MIME sniffing       |
| **X-XSS-Protection**          | `1; mode=block`                                | Legacy XSS protection       |
| **Referrer-Policy**           | `strict-origin-when-cross-origin`              | Limit referrer leaks        |
| **Permissions-Policy**        | Restrictive                                    | Disable unused APIs         |

### CSP Policy Details

```
default-src 'self'
  → Only same-origin by default

script-src 'self' https://cdn.jsdelivr.net https://www.googletagmanager.com
  → Allow same-origin scripts + trusted CDNs

style-src 'self' 'unsafe-inline'
  → Allow same-origin + inline (required for Tailwind)

img-src 'self' data: https:
  → Allow same-origin, data URLs, HTTPS images

connect-src 'self' https: wss:
  → Allow XHR/fetch to same-origin + HTTPS + WebSockets

frame-ancestors 'none'
  → Don't allow embedding in iframes

form-action 'self'
  → Only allow form submissions to same-origin

object-src 'none'
  → Block <object>, <embed>, <applet> tags
```

### Verification

Test headers with:

```bash
curl -I https://your-domain.com
```

Look for:

- All expected headers present
- No `unsafe-eval` in CSP
- `X-Frame-Options: DENY`

## 4. Password Security

### Implementation

**Files:**

- `lib/password-validator.ts` - Password validation
- `lib/auth-helpers.ts` - Helper utilities

### Password Requirements

1. **Minimum 8 characters**
2. **At least one uppercase letter (A-Z)**
3. **At least one lowercase letter (a-z)**
4. **At least one number (0-9)**
5. **No common weak passwords**
6. **No sequential numbers (0123, 9876, etc.)**
7. **No keyboard patterns (qwerty, asdf, etc.)**
8. **No repeated characters (aaaa, etc.)**

### Validation Flow

```typescript
import { validatePassword, getPasswordFeedback } from '@/lib/password-validator';

const password = 'MySecurePass123';
const result = validatePassword(password);

if (!result.valid) {
  console.log(result.errors); // Array of requirement failures
  console.log(getPasswordFeedback(result)); // User-friendly message
}

// Check strength for UX feedback
console.log(result.strength); // 'weak' | 'fair' | 'good' | 'strong'
```

### Password Hashing

**Supabase handles bcrypt hashing server-side:**

```
User submits: "MySecurePass123"
        ↓
Transmitted via HTTPS (plaintext)
        ↓
Supabase Auth Service
        ↓
Hashed with bcrypt (cost=12)
        ↓
Stored in auth.users table
```

**NEVER:**

- Log passwords (even in development)
- Store passwords in plain text
- Return passwords from APIs
- Hash on client-side (transport still plaintext)

### Optional: Have I Been Pwned Check

```typescript
import { checkPasswordBreach } from '@/lib/password-validator';

const breachCount = await checkPasswordBreach('user-password');
if (breachCount > 0) {
  // Warn user: "This password has appeared in X data breaches"
}
```

Uses k-anonymity: only first 5 SHA-1 hash chars sent to API.

## 5. CSRF Protection

### Implementation

Supabase + Next.js handle CSRF automatically:

1. **httpOnly cookies:** Cannot be accessed by JavaScript
2. **SameSite=Strict:** Cookies only sent with same-origin requests
3. **No manual tokens needed** (auth-helpers handles via Supabase)

### Verification

Check Supabase-generated auth cookies:

```javascript
// Browser console
document.cookie; // Should see httpOnly cookies listed
```

## 6. Audit Logging

### Implementation

**Files:**

- `lib/security/audit-logging.ts` - Audit event logging
- `database/schema` - `audit_log` table

### Events Logged

```
Authentication Events:
- signup (email, timestamp, IP)
- login (email, success/failure, IP)
- login_failed (email, IP, attempt_count)
- logout (email, timestamp)
- password_reset_request (email, IP)
- password_reset_success (email, timestamp)

Critical Operation Events:
- exchange_request_created
- exchange_accepted
- dispute_created
- rating_created
- verification_failed
- unauthorized_access_attempt
```

### Usage

```typescript
import { logAuditEvent, AuditEventType, AuditSeverity } from '@/lib/security/audit-logging';

await logAuditEvent(supabase, {
  timestamp: new Date().toISOString(),
  event_type: AuditEventType.LOGIN_FAILED,
  severity: AuditSeverity.WARNING,
  user_id: userId,
  action: 'Login failed',
  status: 'failure',
  error_code: 'INVALID_CREDENTIALS',
  context: { attempt_number: 3 },
  ip_address: clientIP,
});
```

### Monitoring

Query audit logs for:

```sql
-- Recent failed logins
SELECT * FROM audit_log
WHERE event_type LIKE 'login%'
  AND status = 'failure'
  AND timestamp > now() - interval '1 hour'
ORDER BY timestamp DESC;

-- High activity IPs
SELECT ip_address, COUNT(*) as count
FROM audit_log
WHERE timestamp > now() - interval '1 hour'
GROUP BY ip_address
ORDER BY count DESC
LIMIT 10;
```

## Testing

### Run All Security Tests

```bash
npm test -- tests/auth/
```

### Test Rate Limiter

```bash
npm test -- tests/auth/rate-limiter.test.ts
```

Tests verify:

- Requests under limit are allowed
- Requests over limit are blocked
- Time window tracking works
- Remaining count is accurate
- Reset functionality works

### Test Security Headers

```bash
npm test -- tests/auth/security.test.ts
```

Tests verify:

- All required headers present
- No unsafe CSP directives
- Headers are properly formatted
- Password validation works correctly

## Deployment Checklist

### Before Production Deploy

- [ ] All rate limit tests passing
- [ ] All security tests passing
- [ ] Environment variables set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] HTTPS enabled (Vercel, custom domain)
- [ ] Security headers configured in `next.config.js`
- [ ] Middleware.ts active for all routes
- [ ] Password validation enabled in signup form
- [ ] Audit logging configured to write to database
- [ ] Rate limiting thresholds reviewed and adjusted for your traffic
- [ ] HIBP password breach check enabled (optional but recommended)

### Post-Deploy Monitoring

1. **Check Headers:**

   ```bash
   curl -I https://your-domain.com
   ```

2. **Monitor Audit Logs:**
   - Review failed authentication attempts daily
   - Alert on unusual patterns (brute force, enumeration)

3. **Check Rate Limits:**
   - Verify legitimate users not blocked
   - Adjust thresholds if needed

4. **Review Errors:**
   - Check server logs for auth errors
   - Investigate any security warnings

## Common Issues

### Issue: "Too many login attempts"

**Cause:** User exceeded rate limit (5 failed attempts per 15 min)

**Solution:**

- Wait 15 minutes, or
- User submits password reset to unlock

**Code:**

```typescript
const status = checkLoginLimit(email, ip);
if (!status.allowed) {
  return NextResponse.json(
    { error: `Too many attempts. Try again in ${status.retryAfter} seconds` },
    { status: 429 }
  );
}
```

### Issue: "Password must contain uppercase letter"

**Cause:** Password validation failed

**Solution:** Ensure password meets all requirements

**Fix:**

```typescript
const result = validatePassword(password);
if (!result.valid) {
  return res.json({
    errors: result.errors,
    feedback: getPasswordFeedback(result),
  });
}
```

### Issue: CSP Violations in Browser Console

**Cause:** Resource (script, style, image) violates CSP policy

**Solution:** Check browser console for blocked resource, update CSP or resource URL

**Example:**

```
Refused to load the script 'https://untrusted-cdn.com/script.js'
because it violates the Content-Security-Policy directive:
"script-src 'self' https://cdn.jsdelivr.net..."
```

Add to CSP if trusted:

```typescript
"script-src 'self' https://untrusted-cdn.com ...";
```

## References

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **NIST Password Guidelines:** https://pages.nist.gov/800-63-3/sp800-63b.html
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Content-Security-Policy:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **Have I Been Pwned API:** https://haveibeenpwned.com/API/v3

## Support

For questions or issues:

1. Check this documentation
2. Review test files for examples
3. Check Supabase dashboard for auth logs
4. Review audit_log table for security events
