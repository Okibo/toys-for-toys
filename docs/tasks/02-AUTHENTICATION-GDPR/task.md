# Epic: Authentication & GDPR Compliance (Week 3-4)

## Overview

Implement secure user authentication, parental consent flows, and GDPR compliance infrastructure.

---

## Task 3.1: Implement Email/Password Authentication

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.2, 2.1

### Description

Set up Supabase Auth email/password provider with sign-up, login, password recovery flows.

### Acceptance Criteria

- [ ] Supabase Auth email provider configured
- [ ] lib/auth.ts created with auth utility functions:
  - `signUp(email, password, full_name)` - creates auth.user and profiles.row
  - `login(email, password)` - returns JWT and user object
  - `logout()` - clears session
  - `getCurrentUser()` - returns authenticated user
  - `resetPassword(email)` - initiates password reset
  - `updatePassword(newPassword)` - authenticated users only
- [ ] Middleware configured (lib/middleware.ts):
  - Refresh token on route access
  - Redirect unauthenticated users to /login
- [ ] Error handling:
  - Email already exists
  - Invalid password format
  - User not found
  - Rate limiting (5 login attempts per 15 min per IP)
- [ ] Session management:
  - JWT stored in httpOnly cookie (client-side)
  - Token expiration: 1 hour
  - Refresh token rotation implemented
  - Logout clears all sessions
- [ ] Documentation: Auth flow diagram, security notes

### Implementation Notes

- Use Supabase Auth helpers (@supabase/auth-helpers-nextjs)
- httpOnly cookies for JWT (prevent XSS access)
- Store refresh token securely (Supabase handles)
- Implement token refresh on app load
- Rate limiting at API layer (not auth library)

### Testing

- Sign up with valid email/password succeeds
- Sign up with existing email fails
- Login succeeds with correct credentials
- Login fails with wrong password
- Password reset email sent (check email logs)
- Session expires after 1 hour
- Refresh token extends session

---

## Task 3.2: Create Auth UI Pages (Login, Sign Up)

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 3.1

### Description

Build login and sign-up pages with form validation and error messaging.

### Acceptance Criteria

- [ ] /auth/login page created:
  - Email input (with validation)
  - Password input
  - "Forgot Password" link
  - Submit button
  - Link to sign-up
  - Error messages displayed clearly
  - Loading state during submission
- [ ] /auth/signup page created:
  - Email input (validation + exists check)
  - Password input (strength indicator: weak/medium/strong)
  - Confirm password input
  - Full name input
  - "I agree to Terms" checkbox
  - Submit button
  - Progress indicator: Step 1/3 (Step 2: Child profile, Step 3: Consent)
  - Link to login
- [ ] /auth/reset-password page:
  - Email input
  - Send reset link button
  - Confirmation message
- [ ] /auth/reset-password/[token] page:
  - New password input (strength indicator)
  - Confirm password input
  - Submit button
  - Success message after reset
- [ ] Form validation:
  - Real-time email format validation
  - Password strength requirements (min 8 chars, mixed case, number)
  - Confirm password match
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (WCAG AA):
  - Label associations
  - Error announcements
  - Keyboard navigation

### Implementation Notes

- Use React Hook Form + Zod for validation
- shadcn/ui components for consistent design
- Real-time debounced email existence check (prevent timing attacks)
- Clear password strength feedback
- Smooth transitions between steps

### Testing

- Form validation works (client-side)
- Error messages clear and actionable
- Responsive on mobile/tablet/desktop
- Accessible with screen reader (NVDA/JAWS)
- Form submission handled correctly

---

## Task 3.3: Implement Parental Consent Flow

**Status:** Pending
**Effort:** 2 days (GDPR-critical)
**Dependencies:** Task 3.2, 2.1

### Description

Create multi-step consent flow for child data collection, meeting GDPR Article 8 requirements.

### Acceptance Criteria

- [ ] /auth/signup/[step] pages created:
  - Step 1: Email/Password (Task 3.2)
  - Step 2: Child Profile Creation
    - Child name input
    - Child birthdate picker
    - Interests multi-select (predefined tags)
    - Allergies/safety notes (optional)
    - Add more children button (loop Step 2)
  - Step 3: Explicit GDPR Consent
    - Consent checkbox: "I confirm I am parent/guardian of [child names] and consent to store their profile for toy matching and age-appropriate recommendations. [Privacy Policy link]"
    - Optional: Marketing consent checkbox (OFF by default): "I'd like to receive news and offers"
    - Submit button
    - Legal text: "By proceeding, you agree to our Terms of Service and Privacy Policy"
- [ ] Consent data captured:
  - `consent_records` table created:
    - `id` (UUID, PK)
    - `user_id` (UUID, FK)
    - `consent_type` (ENUM: 'child_data', 'marketing')
    - `child_ids` (UUID[], array of consented kids)
    - `consent_text` (TEXT, exact text user saw)
    - `ip_address` (INET)
    - `user_agent` (TEXT)
    - `timestamp` (TIMESTAMP)
    - `revoked_at` (TIMESTAMP, nullable)
- [ ] Multi-language consent text:
  - Polish (default)
  - German
  - English
- [ ] Confirmation email sent with:
  - Consent details (what data, how long)
  - Link to revoke consent (in settings)
  - Link to privacy policy
  - DSAR request instructions
- [ ] After consent, user logged in and redirected to /app/dashboard
- [ ] Progress: 66% (2/3 steps complete)

### Implementation Notes

- Explicit consent required (no pre-checked boxes)
- Consent timestamp + IP for audit trail
- Consent text versioning (track changes to privacy terms)
- Cannot proceed without explicit consent (hard requirement)
- Store exact checkbox state (important for GDPR disputes)
- Consent can be withdrawn in settings (Task 3.6)

### Testing

- Cannot submit without checking consent checkbox
- Consent recorded with timestamp and IP
- Confirmation email sent immediately
- Multiple children: Can add 3+ kids and consent for all
- Consent text matches privacy policy content
- Revoke link works (tested in Task 3.6)

---

## Task 3.4: Create Privacy Policy & Terms of Service

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.2

### Description

Draft GDPR-compliant privacy policy and terms of service.

### Acceptance Criteria

- [ ] `/privacy-policy` page created with:
  - Data Controller info (company name, contact, DPO email)
  - What data is collected (list with purpose)
  - Why data is collected (lawful basis: contract, consent, legitimate interest)
  - How data is shared (third parties: Supabase, Firebase, Google AdMob)
  - How long data is kept (retention schedule per category)
  - User rights (access, correction, erasure, complaint to DPA)
  - Cookies & tracking (Supabase Auth, Firebase, Google Analytics?)
  - Contact: DPO email, postal address
  - Update history and notification (30 days advance notice)
  - Available in: Polish, German, English
- [ ] `/terms-of-service` page created with:
  - Use conditions (not for commercial use, no mass listing)
  - User responsibilities (honesty, no fraud, appropriate behavior)
  - Platform responsibilities (best-effort moderation, not liable for exchanges)
  - Prohibited items (weapons, adult items, recall hazards)
  - Account termination (reasons for suspension/ban)
  - Dispute resolution (admin review process)
  - Limitation of liability
  - Governing law (EU/Poland)
- [ ] `/privacy-for-children` page created (age 7+):
  - Simple language (10th-grade reading level)
  - "What information do we collect about you?"
  - "Why do we use your information?"
  - "Your rights" (in kid-friendly terms)
  - Visual diagrams where helpful
- [ ] `/cookies` page created:
  - Explain cookies used (session, analytics, ad targeting)
  - Cookie opt-out options
  - Link to cookie policy
- [ ] Accessibility:
  - Font size: 14pt+ body text
  - Line spacing: 1.5+
  - Contrast: WCAG AA
  - PDF downloadable version
- [ ] Legal review: Flag for legal team (Phase 2 formal review)

### Implementation Notes

- Use templates from GDPR-compliant platforms as reference
- Keep language plain (avoid legal jargon where possible)
- Disclose all data processing (no surprises)
- Links to external privacy policies (Firebase, Google)
- Versioning: Track policy versions and changes
- Multi-language: Polish first, German/English in Phase 2

### Testing

- All pages load without errors
- Links to external policies work
- PDFs downloadable
- Accessibility check (axe-core browser plugin)
- No broken references

---

## Task 3.5: Implement GDPR Consent Withdrawal

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 3.3

### Description

Allow parents to revoke consent and trigger data deletion workflow.

### Acceptance Criteria

- [ ] Settings page (Account → Privacy & Data):
  - "Your Consents" section showing:
    - Child name + Consent date + "Revoke" button per child
    - Marketing consent toggle
  - "Revoke Consent for [Child]" action:
    - Confirmation dialog: "Revoking consent will delete all data about [child] within 30 days. This action cannot be undone. Proceed?"
    - User must type child's name to confirm (prevent accidental clicks)
    - Proceed button creates: `deletion_request` table entry (status: pending, grace_period_end_date: today+30days)
    - Child status updated: status='scheduled_for_deletion' (soft delete state)
    - Email sent: "Consent revoked. Your data will be deleted on [date]. [Cancel]"
  - "Cancel Revocation" link in email and settings:
    - Restores child profile status='active'
    - Deletes deletion_request entry
    - Confirmation email sent
- [ ] 30-day grace period monitoring:
  - Scheduled job (Edge Function, Phase 2) runs nightly
  - Checks deletion_request entries where grace_period_end_date ≤ today
  - Executes deletion:
    - Permanently delete child profile, interests
    - Anonymize messages (replaced with "Former user")
    - Anonymize ratings received (reviewer name → "Former user")
    - Retain exchange history (anonymized, counts only)
    - Retention: Store hash of original data for fraud investigation
  - Send confirmation email: "Your child's data has been permanently deleted"
- [ ] Audit trail:
  - All consent changes logged with timestamp, IP
  - Deletion records retained (no PII) for 3 years
- [ ] Graceful handling:
  - If user has active exchanges during grace period:
    - Child status='scheduled_for_deletion' but exchanges complete
    - Deletion proceeds only after all exchanges completed

### Implementation Notes

- 30-day grace period is non-negotiable (GDPR requirement)
- Manual name entry prevents accidental deletion
- Background job (Edge Function) handles deletion at scale
- Audit logging essential for GDPR compliance proof
- Test: Verify data actually deleted from DB (not just soft-deleted)

### Testing

- Revoke consent flow works
- Confirmation email sent
- 30-day countdown visible
- Can cancel during grace period
- Data deleted after 30 days
- Audit log records all actions

---

## Task 3.6: Create Data Subject Access Request (DSAR) Form

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 3.2

### Description

Implement user-initiated data export (DSAR) request handling.

### Acceptance Criteria

- [ ] /app/settings/privacy page includes:
  - "Download Your Data" section
  - DSAR request button: "Request a copy of all my data"
  - Explanation: "We'll compile your profile, children, exchanges, and messages into a secure file and email it to you within 10 working days."
- [ ] DSAR request flow:
  - User clicks "Request"
  - Password confirmation dialog (security)
  - Confirmation message: "Request submitted. Check your email for download link."
  - `dsar_requests` table created:
    - `id` (UUID, PK)
    - `user_id` (UUID, FK)
    - `status` (ENUM: 'pending', 'processing', 'ready', 'downloaded', 'expired')
    - `requested_at` (TIMESTAMP)
    - `download_url` (TEXT, nullable)
    - `download_password` (TEXT, hashed nullable, for ZIP encryption)
    - `expires_at` (TIMESTAMP, 7 days from creation)
    - `downloaded_at` (TIMESTAMP, nullable)
- [ ] Backend Edge Function (Phase 2, skeleton now):
  - Triggered by DSAR request insertion
  - Compiles user data into JSON:
    - Account: email, name, registration date, language, preferences
    - Children: name, age, interests, consent records
    - Exchanges: Full history (anonymize partner names? No, user's own view)
    - Messages: User's sent messages (not received, non-anonymized)
    - Ratings: Ratings given by user (not ratings received, to protect others)
    - Game activity: Aggregate stats (no move-by-move)
    - Consent records: All timestamps, texts, IP addresses
    - Access logs: Last 30 days login history
  - Creates ZIP file, encrypts with password, stores in Supabase Storage
  - Generates signed download URL (7-day expiry)
  - Sends email with download link and password
  - Updates dsar_requests.status='ready', .download_url, .expires_at
- [ ] Email notification:
  - Subject: "Your data export is ready - Toy-for-Toy"
  - Body: Download URL, password (separately for security), expiry date
  - Footer: "For security, we've sent the password separately. Link expires in 7 days."
- [ ] Security:
  - Password confirmation required (prevent unauthorized requests)
  - Download link one-time-use (after download, status='downloaded', link no longer works)
  - Password hashed in DB (bcrypt)
  - No PII logged in application logs

### Implementation Notes

- DSAR is a legal right (10 working day SLA)
- Data export should be comprehensive (over-inclusive rather than under-inclusive)
- Separate password from download link (layered security)
- ZIP encryption standard (WinZip-compatible)
- Consider: If user has >1000 exchanges, split into multiple files
- Note: Skeleton implementation, full async job in Phase 2

### Testing

- DSAR request created successfully
- Email sent with download link
- Password required to download (validate)
- ZIP file integrity verified
- All user data present in export
- Data accurate (matches DB)

---

## Task 3.7: Create 2FA (Two-Factor Authentication) Skeleton

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 3.1

### Description

Skeleton implementation for optional 2FA (TOTP), detailed in Phase 2.

### Acceptance Criteria

- [ ] Settings page → Security:
  - "Two-Factor Authentication" section
  - Status: "Not set up" or "Enabled"
  - Button: "Set up 2FA" (calls API stub, returns "Feature coming soon" message in Phase 1)
  - Help text: "Protect your account with an authenticator app"
- [ ] Documentation:
  - Explain TOTP (Time-based One-Time Password)
  - List compatible apps (Google Authenticator, Authy, Microsoft Authenticator)
  - Note: Implementation planned for Phase 2
- [ ] `totp_secrets` table created (for Phase 2):
  - `id` (UUID, PK)
  - `user_id` (UUID, FK)
  - `secret` (TEXT, encrypted)
  - `enabled_at` (TIMESTAMP, nullable)
  - `backup_codes` (TEXT[], encrypted)
  - RLS: Only user can see own 2FA status

### Implementation Notes

- 2FA implementation deferred to Phase 2 (lower priority than core features)
- Keep UI placeholder for smooth Phase 2 rollout
- Backend ready for TOTP library integration

### Testing

- Settings page loads without errors
- 2FA button visible but disabled ("Coming soon" message)
- No 2FA flow can be initiated

---

## Task 3.8: Implement Email Verification (Optional for MVP)

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 3.1

### Description

Optional: Send verification email after sign-up (deferred if time-constrained).

### Acceptance Criteria

- [ ] Sign-up flow:
  - After step 3 (consent), user account created
  - Verification email sent to user's email
  - Email contains: "Verify your email" button with token link
  - Token expires: 24 hours
- [ ] Email verification page:
  - User clicks link in email
  - Token validated
  - Account marked: `email_verified=true` in profiles table
  - Success message: "Email verified! Your account is now active."
  - Redirect to /app/dashboard
- [ ] Unverified account restrictions (optional, MVP might skip):
  - Can browse toys but cannot list
  - Can see wishlist but not get matches
  - Encouragement: "Verify your email to unlock all features"
- [ ] Resend verification email:
  - User can request resend if link expires
  - Rate limit: 1 resend per 5 minutes

### Implementation Notes

- Email verification increases trust but slows sign-up friction
- Consider: Skip for MVP if time-constrained, implement in Phase 2
- Supabase Auth has built-in email verification; use it
- Token stored securely (not in DB, managed by Supabase)

### Testing

- Verification email sent correctly
- Link works and marks email as verified
- Expired token shows error message
- Resend works with rate limiting

---

## Task 3.9: Implement Password Reset Workflow

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 3.2

### Description

Complete password reset flow from request to confirmation.

### Acceptance Criteria

- [ ] /auth/forgot-password page:
  - Email input
  - "Send Reset Link" button
  - Confirmation message: "Check your email for password reset instructions"
  - No error if email doesn't exist (prevent email enumeration attacks)
- [ ] Password reset email:
  - Sent via SendGrid (or Supabase email if configured)
  - Contains: "Reset Password" button with token link
  - Token expires: 1 hour
  - Note: "If you didn't request this, ignore this email"
- [ ] /auth/reset-password/[token] page:
  - New password input (strength indicator)
  - Confirm password input
  - Submit button
  - Error handling: Invalid/expired token shows message with link to request new reset
  - Success: Password changed, user redirected to /auth/login with message "Password reset. Please log in."
- [ ] Security:
  - Tokens are single-use (cannot reuse same link)
  - Rate limiting: Max 3 reset requests per email per 1 hour
  - No logging of reset tokens in app logs

### Implementation Notes

- Supabase Auth handles password reset token generation
- SendGrid integration for email delivery (Phase 2)
- Tokens one-time-use and short-lived (1 hour)
- Security: No email enumeration (all inputs treated same way)

### Testing

- Reset email sent (check email logs)
- Link valid for 1 hour
- Link invalid after use (cannot reuse)
- New password works for login
- Old password no longer works
