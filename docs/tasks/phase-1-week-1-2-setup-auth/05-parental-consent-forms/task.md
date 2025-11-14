# Task P1-W1-AUTH-002: Parental Consent Forms & GDPR Compliance

## Task ID
P1-W1-AUTH-002

## Epic
Phase 1 Week 1-2: Project Setup & Authentication

## Title
Parental Consent Forms & GDPR Compliance

## Description
Implement comprehensive parental consent flows for Terms of Service, Privacy Policy, and behavioral analytics. This ensures GDPR compliance and captures explicit consent with audit trail (IP, user-agent, timestamp).

## Acceptance Criteria

### Frontend: Signup Flow - Consent Page
- [ ] Add consent step after email verification (before dashboard access)
- [ ] URL: `/auth/consent`
- [ ] Display three consent checkboxes:
  1. **Terms of Service** (required)
     - Text: "I accept the Terms of Service"
     - Link to `/legal/terms` (full ToS document)
  2. **Privacy Policy** (required)
     - Text: "I accept the Privacy Policy"
     - Link to `/legal/privacy` (full Privacy Policy)
  3. **Behavioral Analytics** (optional)
     - Text: "I consent to behavioral analytics (search filters, wishlist preferences)"
     - Explanation: "This helps us show relevant ads and improve the platform."
     - Link to `/legal/analytics-details` (detailed explanation)
- [ ] Required: Checkboxes 1 & 2 must be checked
- [ ] Optional: Checkbox 3 can be unchecked
- [ ] Checkbox labels are clickable (expand/collapse T&Cs)
- [ ] Submit button: "I Accept & Continue"
- [ ] Decline button: "Decline and Exit" (redirects to login)
- [ ] All text translated (Polish, German, English)
- [ ] Accessibility: WCAG 2.1 AA compliant

### Legal Documents
- [ ] Terms of Service (`/legal/terms`):
  - Account responsibility
  - Prohibited activities (fraud, abuse, illegal activity)
  - Toy exchange rules and expectations
  - Dispute resolution
  - Limitation of liability
  - Indemnification
  - Termination clause
  - ~2,000-3,000 words
  - Versioned (v1.0 on launch)

- [ ] Privacy Policy (`/legal/privacy`):
  - Data controller information
  - Data processing basis (GDPR Article 6: performance of contract)
  - Categories of data collected (email, postal code, behavioral patterns)
  - Purposes (account management, toy exchange, ad targeting)
  - Retention periods (email: indefinite; raw analytics: 90 days; aggregates: indefinite)
  - Recipients (Firebase, SendGrid, Google AdMob)
  - Data subject rights (access, erasure, portability)
  - International data transfers (Standard Contractual Clauses)
  - Contact for DPO inquiries
  - ~3,000-4,000 words
  - Versioned (v1.0 on launch)

- [ ] Analytics Details (`/legal/analytics-details`):
  - What data is collected (search filters, wishlist selections, game plays)
  - How data is used (anonymized segments for ad targeting)
  - How to withdraw consent (account settings)
  - Data retention (90 days raw, indefinite aggregates)
  - No PII collected in analytics
  - No data sold to third parties (only aggregated segments)
  - ~1,000-1,500 words

### Backend: Consent Recording
- [ ] POST `/api/auth/consent`
- [ ] Request body:
  ```json
  {
    "user_id": "uuid",
    "privacy_policy": true,
    "terms_of_service": true,
    "behavioral_analytics": true
  }
  ```
- [ ] Validate: privacy_policy and terms_of_service must be true
- [ ] Create consent_records entries:
  - One record per consent type
  - Fields: user_id, consent_type, consent_given (boolean), timestamp (now), ip_address, user_agent
  - Capture from request headers: X-Forwarded-For (IP), User-Agent
- [ ] Update profile: consent_completed = true
- [ ] Response:
  ```json
  {
    "success": true,
    "message": "Consent recorded successfully"
  }
  ```

### Account Settings: Consent Withdrawal
- [ ] URL: `/account/privacy-settings` (logged-in user)
- [ ] Display current consent status:
  - Privacy Policy: Accepted on [date] ✓
  - Terms of Service: Accepted on [date] ✓
  - Behavioral Analytics: [Enabled/Disabled]
- [ ] Withdraw consent action:
  - For behavioral analytics: toggle "Disable Analytics Collection"
  - Withdrawing stops future data collection immediately
  - Creates new consent_record with consent_given = false, withdrawn_at = now()
  - Shows confirmation: "Analytics collection stopped"
- [ ] Cannot withdraw Terms/Privacy (would require account deletion)

### Data Retention & Deletion
- [ ] Document in PrivacyPolicy:
  - Email/profile data: indefinite (until account deletion)
  - Behavioral analytics raw logs: 90 days
  - Aggregated analytics: indefinite
  - Toy images/exchange records: anonymized (not deleted)
  - Audit logs (consent, IP): 3 years

### Compliance & Audit
- [ ] Timestamp all consents (UTC)
- [ ] Store IP address (for audit, later anonymized)
- [ ] Store user-agent (for audit)
- [ ] No modifications to historical records (immutable audit log)
- [ ] consent_records table never purged (legal requirement)

### i18n Requirements
- [ ] All legal documents in Polish, German, English
- [ ] Legal documents versioned by language (terms_en_v1.0.md)
- [ ] Locale-specific date formatting (DD.MM.YYYY for German/Polish)

## Estimated Hours
10-12 hours

## Dependencies
- Task P1-W1-AUTH-001 (Signup flow, auth user created)

## Testing Requirements

### Unit Tests
- [ ] Consent validation:
  - Valid (privacy_policy=true, terms_of_service=true, behavioral_analytics=true) ✓
  - Invalid (privacy_policy=false) → error
  - Invalid (terms_of_service=false) → error
  - Valid (privacy_policy=true, terms_of_service=true, behavioral_analytics=false) ✓

### Integration Tests
- [ ] POST /api/auth/consent with valid data → creates 3 consent_records
- [ ] New user cannot access dashboard without completing consent
- [ ] User can withdraw behavioral_analytics consent
- [ ] Withdrawal creates new consent_record with withdrawn_at

### E2E Tests (Playwright)
- [ ] Complete signup → redirected to consent page
- [ ] Uncheck required checkbox → submit disabled
- [ ] Check all boxes → submit enabled
- [ ] Click submit → redirected to dashboard
- [ ] Go to privacy settings → see consent status
- [ ] Toggle analytics consent → confirmation message
- [ ] Check Mailhog for no privacy-related emails (only on withdrawal if enabled)

### Manual Testing
- [ ] Signup flow with consent → verify 3 records in database
- [ ] Check consent_records table: 3 rows with consent_given = true
- [ ] Withdraw consent → new record with consent_given = false
- [ ] Verify IP address captured correctly
- [ ] Verify dates in correct timezone

## Database/Schema Changes
- `public.consent_records` table (from P1-W1-SETUP-002)
- Add `profiles.consent_completed` (boolean, default false)

## Technology Stack
- Next.js
- React (components)
- TypeScript
- Supabase
- Jest (unit tests)
- Playwright (E2E tests)

## Implementation Notes

### Legal Document Management
- Store as markdown files in `/docs/legal/`
- Version control in git
- Frontend renders as HTML (use markdown-to-html library)
- Backend serves with Cache-Control: public, immutable headers

### IP Address Capture
```typescript
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}
```

### Consent Audit Trail
- Query consent_records for user: `SELECT * FROM consent_records WHERE user_id = ? ORDER BY timestamp`
- Shows complete history including withdrawals
- Immutable (no updates/deletes to existing records)

### GDPR Compliance Checklist
- [ ] Legal basis documented (Article 6: performance of contract)
- [ ] Consent forms present all information required by Article 7
- [ ] Easy withdrawal mechanism (Article 7.4)
- [ ] Data processing purposes clear (Article 13)
- [ ] Retention periods communicated (Article 13)

## Success Metrics
- 100% of users complete consent flow before accessing app
- All consent records properly audited (IP, timestamp, type)
- Legal documents version-controlled and easily updated
- GDPR compliance team approves forms
- <100ms consent recording
- 95%+ test coverage for consent module

## Related Stories (from PRD)
- Story 1: User Registration & Onboarding
- Story 12: Account Settings & Data Access

## Related Functional Requirements
- FR-AUTH-002: Parental Consent Management
- FR-AUTH-001: Email/Password Registration (depends on this)

## Risk Factors
- Legal documents outdated or non-compliant (mitigate: GDPR legal review, version control)
- Consent withdrawal not working (mitigate: thorough testing)
- IP address not captured for audit (mitigate: required field with default)
