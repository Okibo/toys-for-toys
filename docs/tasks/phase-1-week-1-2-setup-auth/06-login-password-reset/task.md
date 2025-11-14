# Task P1-W1-AUTH-003: Login & Password Reset Flow

## Task ID
P1-W1-AUTH-003

## Epic
Phase 1 Week 1-2: Project Setup & Authentication

## Title
Login & Password Reset Flow

## Description
Implement complete login authentication and password reset workflow. Users must verify email before logging in. Session management via JWT tokens with 24-hour expiration and 7-day refresh tokens.

## Acceptance Criteria

### Frontend: Login Page
- [ ] URL: `/auth/login`
- [ ] Form fields:
  - Email (required, validated format)
  - Password (required)
  - "Remember me" checkbox (optional)
- [ ] Submit button: "Sign In"
- [ ] Forgot password link: "Can't access your account?"
- [ ] Sign up link: "Create a new account"
- [ ] All text i18n (Polish, German, English)
- [ ] Loading state during login
- [ ] Error messages:
  - "Invalid email or password"
  - "Please verify your email first"
  - "Account not found"

### Backend: Login API Endpoint
- [ ] POST `/api/auth/login`
- [ ] Request body:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123!"
  }
  ```
- [ ] Validation:
  - Email format
  - Password not empty
- [ ] Check profile.is_email_verified = true
  - If false: return 403 "Please verify your email first"
- [ ] Attempt Supabase Auth login
- [ ] On success: return JWT access token and refresh token
- [ ] Response:
  ```json
  {
    "success": true,
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user_id": "uuid",
    "email": "user@example.com"
  }
  ```
- [ ] Error responses:
  - 401: Invalid credentials
  - 403: Email not verified
  - 404: User not found
  - 429: Too many login attempts (rate limit)

### Session Management
- [ ] Store JWT tokens in secure httpOnly cookies (not localStorage)
- [ ] Cookie settings:
  - httpOnly: true (prevent XSS access)
  - Secure: true (HTTPS only in production)
  - SameSite: Strict
  - Max-Age: 24 hours (access token)
- [ ] Refresh token cookie:
  - Max-Age: 7 days
  - httpOnly: true
  - Secure: true
- [ ] Automatic token refresh on every request (sliding window)
- [ ] Logout: clear both cookies

### Frontend: Password Reset Page
- [ ] URL: `/auth/forgot-password`
- [ ] Form fields:
  - Email (required)
- [ ] Submit button: "Send Reset Link"
- [ ] Success message: "Password reset link sent to your email"
- [ ] Link: "Return to login"

### Backend: Password Reset Request
- [ ] POST `/api/auth/forgot-password`
- [ ] Request body:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- [ ] Validate email format
- [ ] Check if user exists (don't reveal in response for security)
- [ ] Create password reset token (via Supabase Auth)
- [ ] Send reset email with link: `/auth/reset-password?token=xxx&email=yyy`
- [ ] Token valid for 24 hours, single-use
- [ ] Response (same for all cases to prevent email enumeration):
  ```json
  {
    "success": true,
    "message": "If an account exists, a password reset link has been sent"
  }
  ```

### Frontend: Reset Password Page
- [ ] URL: `/auth/reset-password?token=xxx&email=yyy`
- [ ] Form fields:
  - New Password (required, same validation as signup)
  - Confirm Password (required, must match)
- [ ] Submit button: "Reset Password"
- [ ] Extract token/email from URL
- [ ] Validate token before enabling form
- [ ] Show error if token invalid/expired

### Backend: Reset Password Endpoint
- [ ] POST `/api/auth/reset-password`
- [ ] Request body:
  ```json
  {
    "token": "reset_token_123",
    "email": "user@example.com",
    "new_password": "NewSecurePass123!"
  }
  ```
- [ ] Validate new password strength
- [ ] Verify token with Supabase Auth
- [ ] Update password via Supabase Auth
- [ ] Token is single-use (expires after first use)
- [ ] Send confirmation email: "Your password has been changed"
- [ ] Response:
  ```json
  {
    "success": true,
    "message": "Password reset successfully"
  }
  ```
- [ ] Error responses:
  - 400: Invalid password
  - 401: Invalid or expired token
  - 404: User not found

### Rate Limiting
- [ ] Login: max 5 attempts per minute per email
- [ ] Forgot password: max 3 requests per hour per email
- [ ] Lock account after 10 failed logins (optional: 30-minute cooldown)
- [ ] Return generic "too many requests" message

### Security Requirements
- [ ] No passwords in logs or responses
- [ ] Email addresses hashed when stored in rate limit cache
- [ ] CSRF tokens on password reset form
- [ ] Token expiration strictly enforced
- [ ] Single-use tokens (reset token cannot be reused)
- [ ] Email confirmation on successful password change

### Frontend: Logout
- [ ] Logout button in header/menu
- [ ] Clear both JWT cookies
- [ ] Clear Supabase session
- [ ] Redirect to login page
- [ ] Optional: "You've been logged out" message

## Estimated Hours
10-12 hours

## Dependencies
- Task P1-W1-AUTH-001 (Signup, user creation)
- Task P1-W1-AUTH-002 (Consent flow, email verification)

## Testing Requirements

### Unit Tests
- [ ] Password strength validation
- [ ] Token validation (format, expiration)
- [ ] Rate limiting logic (tracking attempts per IP/email)

### Integration Tests
- [ ] POST /api/auth/login with valid credentials → returns JWT tokens
- [ ] POST /api/auth/login with invalid password → 401
- [ ] POST /api/auth/login with unverified email → 403
- [ ] POST /api/auth/forgot-password with valid email → email sent
- [ ] POST /api/auth/forgot-password with invalid email → generic success (no enumeration)
- [ ] POST /api/auth/reset-password with valid token → password changed
- [ ] POST /api/auth/reset-password with expired token → 401
- [ ] POST /api/auth/reset-password with already-used token → 401
- [ ] Rate limiting: 6th login attempt → 429

### E2E Tests (Playwright)
- [ ] Complete login flow with valid credentials
- [ ] Login with invalid password → error message
- [ ] Click "Forgot password" → navigate to reset page
- [ ] Enter email → verify email sent (check Mailhog)
- [ ] Click reset link → navigate to reset password form
- [ ] Enter new password → success message
- [ ] Login with new password → success
- [ ] Logout → redirected to login page

### Manual Testing
- [ ] Login → verify JWT cookie set (check browser DevTools)
- [ ] Refresh page → user still logged in (token persists)
- [ ] Close browser, reopen → user logged in (remember me via refresh token)
- [ ] Wait 24+ hours (simulated) → token expired, automatic refresh
- [ ] Password reset token valid for exactly 24 hours
- [ ] Password reset token invalid after first use
- [ ] 10 failed logins → account locked (if implemented)

## Database/Schema Changes
- No schema changes (uses Supabase Auth built-in)
- Optional: add `profiles.last_login` timestamp
- Optional: add login audit table for tracking attempts

## Technology Stack
- Next.js
- Supabase Auth
- JWT tokens (httpOnly cookies)
- TypeScript
- Jest (unit tests)
- Playwright (E2E tests)

## Implementation Notes

### Cookie Management
```typescript
// Set secure httpOnly cookies
res.setHeader('Set-Cookie', [
  `access_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 3600}`,
  `refresh_token=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 3600}`
]);
```

### Rate Limiting Strategy
- In-memory cache for development (use Redis in production)
- Track: `{email}:{attempt_count}` with expiry
- Clear on successful login

### Token Refresh Strategy
- Check token expiration on every API request
- If token expiring soon (<1 hour): refresh automatically
- Use refresh_token to get new access_token
- Transparent to user

## Success Metrics
- 100% of login flows work correctly
- Rate limiting prevents brute force attacks
- Password reset tokens single-use and time-limited
- Session persists across page refreshes
- <2 second login latency
- 95%+ test coverage for auth module

## Related Stories (from PRD)
- Story 1: User Registration & Onboarding

## Related Functional Requirements
- FR-AUTH-001: Email/Password Registration
- FR-AUTH-003: Session Management
- FR-AUTH-004: Password Reset

## Risk Factors
- Weak token expiration allowing unauthorized access (mitigate: strict 24-hour limit)
- Password reset tokens not single-use (mitigate: database flag or token burning)
- Rate limiting bypassable via VPN (mitigate: accept risk, monitor for attacks)
- Logout not clearing all sessions (mitigate: invalidate all refresh tokens on logout)
