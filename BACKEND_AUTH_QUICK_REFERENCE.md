# Backend Auth API - Quick Reference Guide

## API Endpoints

### 1. POST /api/auth/signup
Create new user account

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MySecure1!Pass",
    "language": "en"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Signup successful. Please check your email to verify your account.",
  "data": {
    "user_id": "uuid-here",
    "email": "user@example.com",
    "is_email_verified": false
  }
}
```

**Errors:**
- `400` - Invalid email or weak password
- `409` - Email already registered
- `429` - Rate limit exceeded (5/min per IP)
- `500` - Server error

**Password Requirements:**
- Minimum 8 characters
- 1 uppercase letter (A-Z)
- 1 number (0-9)
- 1 special character (!@#$%^&*)

---

### 2. POST /api/auth/verify-email
Verify email with code from signup email

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456",
    "email": "user@example.com"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in to your account.",
  "data": {
    "email": "user@example.com",
    "is_email_verified": true
  }
}
```

**Errors:**
- `400` - Invalid code format or incorrect code
- `401` - Code expired (24 hour window)
- `404` - Email not found
- `429` - Rate limit exceeded (3/24h per email)
- `500` - Server error

**Code Format:**
- Exactly 6 digits (0-9)
- Case-sensitive
- Expires in 24 hours

---

### 3. POST /api/auth/resend-verification
Resend verification email to user

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Success (200):**
```json
{
  "success": true,
  "message": "Verification email sent. Please check your email for the code.",
  "data": {
    "email": "user@example.com",
    "new_code_sent": true
  }
}
```

**Errors:**
- `400` - Invalid email or already verified
- `404` - No account found
- `429` - Rate limit exceeded (3/24h per email)
- `500` - Server error

---

## Environment Setup

### Required Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email Service (Production)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@toy-for-toy.local

# Email Testing (Development)
MAILHOG_SMTP_PORT=1025

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Local Development Setup

1. **Start Mailhog (email testing):**
```bash
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog
# View emails at: http://localhost:8025
```

2. **Start Supabase (if using local):**
```bash
npx supabase start
```

3. **Start Next.js:**
```bash
npm run dev
```

---

## Database Schema

Required tables in Supabase:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(254) UNIQUE NOT NULL,
  is_email_verified BOOLEAN DEFAULT FALSE,
  language VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tickets table (10 initial tickets per user)
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification codes table
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
);
```

---

## Testing

### Run Auth Tests
```bash
# All auth tests
npm test -- tests/api/auth-signup.test.ts tests/api/auth-verify-email.test.ts

# Watch mode
npm test -- --watch tests/api/auth-

# Specific test
npm test -- tests/api/auth-signup.test.ts -t "Email Validation"

# With coverage
npm test -- --coverage tests/api/
```

### Manual Testing with curl

**Test Signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "language": "en"
  }'
```

**Test Verify (use code from Mailhog):**
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456",
    "email": "test@example.com"
  }'
```

---

## Common Issues & Solutions

### Issue: "NEXT_PUBLIC_SUPABASE_URL not configured"
**Solution:** Add to .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Issue: "Email sending failed"
**Solution:**
- Dev: Ensure Mailhog is running on port 1025
- Prod: Verify SendGrid API key is set

### Issue: "Email already exists" (409)
**Solution:** User already has an account. Direct them to login or password reset.

### Issue: "Invalid verification code"
**Solution:**
- Code is 6 digits only (0-9)
- Code expires after 24 hours
- Each code can only be used once
- User can request a new code with resend endpoint

### Issue: "Rate limit exceeded" (429)
**Solution:**
- Signup: Max 5 attempts per minute per IP
- Verify: Max 3 attempts per 24 hours per email
- Wait for window to reset or try from different IP/email

---

## Security Features

✅ **Email Validation**
- RFC 5322 format validation
- Length limits enforced
- Plus addressing supported

✅ **Password Strength**
- 8+ characters required
- Mixed case, numbers, special chars required
- Strength scoring (weak/fair/good/strong)

✅ **Rate Limiting**
- Per-IP rate limiting for signup (5/min)
- Per-email rate limiting for verification (3/24h)
- Automatic reset after window expires

✅ **Code Security**
- Cryptographically secure generation
- 24-hour expiry window
- One-time use only
- Attempt tracking

✅ **API Security**
- Service role key never exposed
- Passwords never logged
- Error codes don't leak internals
- Proper HTTP status codes

---

## Email Template Languages

Verification emails support:
- **English (en)** - Default
- **Polish (pl)**

Auto-detects from `language` field in signup request:
```json
{
  "email": "user@example.com",
  "password": "MySecure1!Pass",
  "language": "pl"
}
```

---

## File Locations

```
pages/
├── api/auth/
│   ├── signup.ts                 # Signup endpoint
│   ├── verify-email.ts           # Verification endpoint
│   └── resend-verification.ts    # Resend endpoint

lib/
├── auth/
│   ├── types.ts                  # TypeScript interfaces
│   ├── supabase-server.ts        # Server client
│   ├── email-validator.ts        # Email validation
│   ├── password-validator.ts     # Password validation
│   └── verification-code.ts      # Code generation
└── email/
    ├── verification-template.ts  # Email templates
    └── send-email.ts             # Email sending

tests/
├── api/
│   ├── auth-signup.test.ts       # Signup tests (50+)
│   └── auth-verify-email.test.ts # Verification tests (52+)
```

---

## Frontend Integration Example

```typescript
// Sign up a new user
const handleSignup = async (email: string, password: string) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, language: 'en' })
  });

  const data = await response.json();

  if (response.ok) {
    // Redirect to verification page
    redirect(`/auth/verify-email?email=${email}`);
  } else {
    // Show error
    showError(data.error.message, data.error.details);
  }
};

// Verify email with code
const handleVerify = async (email: string, code: string) => {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });

  const data = await response.json();

  if (response.ok) {
    // User can now log in
    redirect('/auth/login');
  } else {
    // Show error
    showError(data.error.message);
  }
};

// Resend verification code
const handleResend = async (email: string) => {
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await response.json();

  if (response.ok) {
    // Show success message
    showSuccess('Verification email sent!');
  } else {
    // Show error
    showError(data.error.message);
  }
};
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Signup | 5 attempts | 1 minute per IP |
| Verify Email | 3 attempts | 24 hours per email |
| Resend Email | 3 requests | 24 hours per email |

Response headers on rate limit:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700000000 (Unix timestamp)
Retry-After: 60 (seconds)
```

---

## Production Checklist

- [ ] Update environment variables
- [ ] Create database tables
- [ ] Set up SendGrid account
- [ ] Configure email domain
- [ ] Test email delivery
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure error logging
- [ ] Load test rate limiting
- [ ] Test full signup → verification flow
- [ ] Documentation for mobile clients
- [ ] Frontend integration complete

---

## Support

For issues or questions:
1. Check test coverage in `/tests/api/`
2. Review implementation details in `BACKEND_AUTH_IMPLEMENTATION.md`
3. Check error codes and messages in API responses
4. Review environment setup guide above
