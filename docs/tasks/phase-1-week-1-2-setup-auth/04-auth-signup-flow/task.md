# Task P1-W1-AUTH-001: Email/Password Registration & Signup Flow

## Task ID
P1-W1-AUTH-001

## Epic
Phase 1 Week 1-2: Project Setup & Authentication

## Title
Email/Password Registration & Signup Flow

## Description
Implement the complete user registration flow with email/password authentication, email verification, and initial profile creation. Users must verify email before accessing the app. Initial 10 tickets allocated on signup.

## Acceptance Criteria

### Frontend: Signup Page
- [ ] URL: `/auth/signup`
- [ ] Form fields:
  - Email (required, validated format)
  - Password (required, min 8 chars, 1 uppercase, 1 number, 1 special char)
  - Password Confirmation (required, must match password)
  - Language Preference (dropdown: Polish, German, English)
- [ ] Password strength indicator (visual feedback)
- [ ] Submit button: "Create Account"
- [ ] Validation:
  - Real-time email format validation
  - Real-time password strength check
  - Error messages for each field
- [ ] Loading state during signup (prevent double-click)
- [ ] Success message: "Verification email sent. Check your inbox."
- [ ] Link to login page for existing users
- [ ] i18n: all text translated to Polish, German, English

### Backend: Signup API Endpoint
- [ ] POST `/api/auth/signup`
- [ ] Request body:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123!",
    "language": "en"
  }
  ```
- [ ] Validation:
  - Email format using regex
  - Email uniqueness check (query profiles table)
  - Password strength validation
- [ ] Create auth user via Supabase Auth
- [ ] Create user profile record in `profiles` table:
  - user_id (from auth.users)
  - email (from request)
  - language_preference (from request)
  - is_email_verified = false
  - created_at = now()
- [ ] Create initial ticket record:
  - user_id
  - total_balance = 10
  - frozen_listing_tickets = 0
  - frozen_exchange_tickets = 0
- [ ] Send verification email with 6-digit code (via Mailhog in dev)
- [ ] Response:
  ```json
  {
    "success": true,
    "message": "Signup successful. Verification email sent.",
    "user_id": "uuid"
  }
  ```
- [ ] Error responses (400, 409, 500):
  - Invalid email format
  - Email already registered
  - Weak password
  - Database errors

### Email Verification
- [ ] Verification email template:
  - Subject: "Verify your Toy-for-Toy email"
  - Confirmation code: 6 digits
  - Verification link: `/auth/verify-email?code=123456&email=user@example.com`
  - Expiry: 24 hours
  - Plain text + HTML versions
- [ ] Email sent via Mailhog (dev) / SendGrid (prod - future)
- [ ] Verification code one-time use

### Frontend: Email Verification Page
- [ ] URL: `/auth/verify-email`
- [ ] Display: "Enter the verification code from your email"
- [ ] Input field: 6-digit code (auto-focus, auto-advance between digits)
- [ ] Auto-verify if URL includes code parameter
- [ ] Resend button: "Didn't receive code? Resend"
- [ ] Resend limit: max 3 times per 24 hours
- [ ] Success: redirect to login page
- [ ] Error: "Invalid or expired code"

### Backend: Email Verification Endpoint
- [ ] POST `/api/auth/verify-email`
- [ ] Request body:
  ```json
  {
    "code": "123456",
    "email": "user@example.com"
  }
  ```
- [ ] Validate code format (6 digits)
- [ ] Verify code against Supabase auth email
- [ ] Update `profiles.is_email_verified = true`
- [ ] Response: `{"success": true}`
- [ ] Error: "Invalid or expired code"

### Security Requirements
- [ ] Password validation at frontend AND backend
- [ ] Email verification prevents feature access without verification
- [ ] Rate limiting on signup (max 5 per minute per IP)
- [ ] Rate limiting on resend (max 3 per 24 hours per email)
- [ ] CSRF protection on signup form
- [ ] No password stored in plain text (Supabase handles)
- [ ] Verification codes hashed in database

### Database Changes
- [ ] Auth user creation via Supabase Auth (automatic)
- [ ] Profile record: see core schema task
- [ ] Ticket record: see core schema task
- [ ] Verification code table (optional if using Supabase built-in):
  - email, code, expires_at, used_at

## Estimated Hours
12-16 hours

## Dependencies
- Task P1-W1-SETUP-001 (Docker environment)
- Task P1-W1-SETUP-002 (Database schema)
- Task P1-W1-SETUP-003 (RLS policies)

## Testing Requirements

### Unit Tests
- [ ] Password validation function:
  - Valid: "SecurePass123!" ✓
  - Invalid (no uppercase): "securepass123!" ✗
  - Invalid (no number): "SecurePass!" ✗
  - Invalid (no special): "SecurePass123" ✗
  - Invalid (too short): "Pass1!" ✗
- [ ] Email validation function:
  - Valid: "user@example.com" ✓
  - Invalid: "user@", "@example.com", "user.example.com" ✗

### Integration Tests
- [ ] POST /api/auth/signup with valid data → creates auth user, profile, ticket
- [ ] POST /api/auth/signup with duplicate email → 409 Conflict
- [ ] POST /api/auth/signup with weak password → 400 Bad Request
- [ ] Profile created with is_email_verified = false
- [ ] Tickets created with total_balance = 10
- [ ] Email sent (check Mailhog)

### E2E Tests (Playwright)
- [ ] Navigate to `/auth/signup`
- [ ] Fill form with valid data
- [ ] Click submit
- [ ] Verify success message
- [ ] Check Mailhog for email
- [ ] Extract code and navigate to verify link
- [ ] Verify success
- [ ] Redirect to login page

### Manual Testing
- [ ] Signup with valid data → email received in Mailhog
- [ ] Click verify link in email → verification successful
- [ ] Signup with existing email → error message
- [ ] Signup with weak password → specific error for each requirement
- [ ] Resend code → new code in email
- [ ] Expired code → error message

## Database/Schema Changes
See P1-W1-SETUP-002 for schema. This task populates initial data:
- auth.users (via Supabase Auth)
- public.profiles
- public.tickets
- public.consent_records (next task)

## Technology Stack
- Next.js (frontend)
- React (components)
- Supabase Auth (authentication)
- TypeScript
- Jest (unit tests)
- Playwright (E2E tests)

## Implementation Notes

### Password Validation Function
```typescript
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors = [];
  if (password.length < 8) errors.push("min 8 chars");
  if (!/[A-Z]/.test(password)) errors.push("needs uppercase");
  if (!/[0-9]/.test(password)) errors.push("needs number");
  if (!/[!@#$%^&*]/.test(password)) errors.push("needs special char");
  return { valid: errors.length === 0, errors };
}
```

### Rate Limiting
- Frontend: disable button after 1 submit
- Backend: track submissions per IP per hour (use Redis or in-memory cache)

### Supabase Auth Configuration
- In `docker-compose.yml`, Supabase Auth is pre-configured
- In `.env.local`, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

## Success Metrics
- 100% of signup flows complete without errors
- All email verification scenarios work
- Rate limiting prevents abuse
- <2 second form submission
- <100ms password validation
- 95%+ test coverage for signup module

## Related Stories (from PRD)
- Story 1: User Registration & Onboarding

## Related Functional Requirements
- FR-AUTH-001: Email/Password Registration
- FR-TICKET-001: Initial Allocation (10 tickets on signup)

## Risk Factors
- Weak password regex missing edge cases (mitigate: use established libraries)
- Email verification code sent to spam folder (mitigate: use SendGrid with proper DKIM, DMARC)
- Race condition: multiple signup requests with same email (mitigate: database UNIQUE constraint)
