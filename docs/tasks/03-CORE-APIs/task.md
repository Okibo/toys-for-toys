# Epic: Core APIs & Ticket Economy (Weeks 4-5)

## Overview
Implement RESTful API endpoints for all core platform features: user management, toy listings, exchanges, tickets, wishlists, and messaging.

---

## Task 4.1: Create Authentication API Endpoints

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 3.1, 3.3

### Description
Implement JWT-based authentication endpoints using Supabase Auth.

### Acceptance Criteria
- [ ] `POST /api/auth/signup` endpoint:
  - Input: {email, password, full_name, kid_profiles[], consent_granted}
  - Output: {user_id, email, session_token}
  - Creates auth.user, profiles row, kids rows
  - Consent record created
  - Returns JWT token (1-hour expiry)
- [ ] `POST /api/auth/login` endpoint:
  - Input: {email, password}
  - Output: {user_id, email, session_token, refresh_token}
  - Rate limited: 5 attempts per 15 min per IP
  - Logs login attempt (for security audits)
- [ ] `POST /api/auth/logout` endpoint:
  - Input: {session_token}
  - Output: {success: true}
  - Invalidates all active tokens
  - Clears session cache
- [ ] `POST /api/auth/refresh` endpoint:
  - Input: {refresh_token}
  - Output: {session_token (new), refresh_token (new)}
  - Token rotation implemented
- [ ] `POST /api/auth/password-reset` endpoint:
  - Input: {email}
  - Output: {message: "Reset link sent"}
  - Sends email with reset token
  - No error if email doesn't exist (prevent enumeration)
- [ ] `POST /api/auth/reset-password/[token]` endpoint:
  - Input: {new_password}
  - Output: {success: true}
  - Validates token (must not be expired)
  - Tokens are single-use
- [ ] Error handling:
  - 400: Invalid input
  - 401: Authentication failed
  - 429: Rate limited
  - 500: Server error (logged, no details to client)
- [ ] Logging & audit trail:
  - Log all auth events (signup, login, logout, password reset)
  - Store IP address, user agent, timestamp
  - Retain logs 90 days for security audit

### Implementation Notes
- Use Supabase Auth library for token management
- Implement rate limiting at middleware level
- No passwords logged (hash before storage)
- Use httpOnly cookies for session storage
- CORS: Restricted to trusted domains only

### Testing
- Signup creates user successfully
- Login with correct credentials succeeds
- Login with wrong password fails (401)
- Refresh token extends session
- Password reset email sent
- Rate limiting blocks excessive attempts
- All errors handled gracefully

---

## Task 4.2: Create User Profile API Endpoints

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.1, 4.1

### Description
Implement endpoints for user profile management and child profile CRUD operations.

### Acceptance Criteria
- [ ] `GET /api/profile` endpoint:
  - Input: None (uses auth token)
  - Output: {user_id, email, full_name, language, notification_preferences, children[]}
  - RLS enforced (users see only own profile)
- [ ] `PUT /api/profile` endpoint:
  - Input: {full_name, language, notification_preferences}
  - Output: {success: true, updated_profile}
  - Timestamp updated on change
  - Cannot change email (separate flow if needed)
- [ ] `DELETE /api/profile` endpoint:
  - Input: None
  - Output: {success: true, deletion_scheduled_date}
  - Creates deletion_request (30-day grace period)
  - Account marked as scheduled for deletion
  - Sends confirmation email
- [ ] `POST /api/kids` endpoint:
  - Input: {name, birthdate, interests[], allergies}
  - Output: {kid_id, name, age_group, created_at}
  - Creates profile + automatic wishlist
  - Parent consent implied (already collected at signup)
- [ ] `GET /api/kids` endpoint:
  - Input: None
  - Output: {kids: [{kid_id, name, age_group, interests}]}
  - Returns only active (not deleted) kids
- [ ] `PUT /api/kids/[id]` endpoint:
  - Input: {name, birthdate, interests[], allergies}
  - Output: {success: true, updated_kid}
  - Updates consent timestamp
  - Sends notification to parent email
- [ ] `DELETE /api/kids/[id]` endpoint:
  - Input: None
  - Output: {success: true, deletion_scheduled_date}
  - Soft delete (status: scheduled_for_deletion)
  - Data deleted after 30 days (or immediate if no active exchanges)
  - Cannot delete if active exchanges exist
- [ ] `POST /api/profile/consent/[kid-id]/revoke` endpoint:
  - Input: {confirm_child_name}
  - Output: {success: true, grace_period_end_date}
  - Revokes consent for specific child
  - Creates deletion_request
- [ ] Error handling:
  - 400: Invalid input (invalid birthdate, name too long)
  - 401: Unauthorized
  - 403: Cannot modify other user's kids
  - 409: Conflict (e.g., revoking already revoked consent)

### Implementation Notes
- Birthdate validation: Age must be 0-18
- Interests: Must match predefined taxonomy
- RLS policy: Users can only see/modify own kids
- Soft deletes: Use status column, not hard deletes
- Email notifications: Parent notified of all changes

### Testing
- User can retrieve own profile
- User cannot see other users' profiles
- User can update their own profile
- User can create and list kids
- User cannot delete kid with active exchanges
- Consent revocation works

---

## Task 4.3: Create Toy Listing API Endpoints

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.3, 4.1

### Description
Implement CRUD endpoints for toy listings and photo management.

### Acceptance Criteria
- [ ] `POST /api/toys` endpoint:
  - Input: {name, description, category, tags[], age_range[], condition, photos[]}
  - Output: {toy_id, status: 'pending_moderation', created_at}
  - Deducts 1 ticket from user wallet (or fails if insufficient)
  - Photos uploaded to Supabase Storage (max 5 photos, 2MB each)
  - Stored in toy_photos table with display_order
  - Sends confirmation email
  - Toy status: pending_moderation (not visible in search)
  - Returns toy_id immediately (can view own toy)
- [ ] `GET /api/toys` endpoint:
  - Input: {category, tags[], age_range[], condition, sort, page}
  - Output: {toys: [{toy_id, name, photo, condition, created_at, lister_name}], total_count}
  - Pagination: 20 items per page
  - Filter: Only returns status='active'
  - Sort options: newest, popular (by wishlist count), condition
  - Full-text search on name + description
  - Performance: <500ms response time
- [ ] `GET /api/toys/[id]` endpoint:
  - Input: None
  - Output: {toy_id, name, description, category, tags, age_range, condition, photos[], lister, lister_rating, times_wishlisted, similar_toys[]}
  - Increments view count (for analytics)
  - Shows lister name + rating badge
  - Shows "Similar toys" recommendations
  - RLS: Anyone can view active toys
- [ ] `PUT /api/toys/[id]` endpoint:
  - Input: {name, description, category, tags[], age_range[], condition, photos[]}
  - Output: {success: true, updated_toy}
  - Only allowed if toy status='active' (not under exchange)
  - Cannot be edited once exchange initiated
  - Timestamp updated
- [ ] `DELETE /api/toys/[id]` endpoint:
  - Input: None
  - Output: {success: true}
  - Soft delete: status='delisted'
  - Only allowed if no active exchange
  - Photos remain in storage (hard delete later if needed)
  - Removes toy from search results
- [ ] `GET /api/toys/my-listings` endpoint:
  - Input: {status, sort}
  - Output: {toys: [{toy_id, name, status, views, wishlisted_count, active_exchanges}]}
  - Shows all user's toys (including pending, inactive)
  - Status filter: active, pending_moderation, delisted
- [ ] Photo upload handling:
  - Max 5 photos per toy
  - Max 2MB per photo (compress on upload)
  - Supported formats: JPEG, PNG, WebP
  - Generate thumbnails (for search results)
  - Signed URLs for secure access
  - Delete photos when toy deleted
- [ ] Error handling:
  - 400: Invalid category, age range, condition
  - 401: Unauthorized
  - 403: Cannot edit toy under exchange
  - 413: Photo too large (>2MB)
  - 422: Insufficient tickets to list toy
  - 429: Rate limited (max 10 listings per hour)

### Implementation Notes
- Photo compression: Use sharp library
- Supabase Storage path: `/toys/[user_id]/[toy_id]/[photo_id]`
- Soft delete preserves data for analytics/disputes
- Ticket deduction happens immediately (not on approval)
- Auto-refund if listing rejected (done in moderation task)

### Testing
- User can list toy successfully
- Photo upload works (validate format, size)
- Toy appears in search (if status='active')
- User cannot edit toy under exchange
- User cannot list >10 toys per hour
- Search with filters works
- Pagination works (20 items/page)

---

## Task 4.4: Implement Ticket Economy Endpoints

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.2, 4.1

### Description
Implement wallet management, balance checks, and fragment redemption endpoints.

### Acceptance Criteria
- [ ] `GET /api/wallet` endpoint:
  - Input: None
  - Output: {balance, available, frozen, earned_from_games, pending_earned}
  - balance = total tickets owned
  - available = balance - frozen (can be used for requests)
  - frozen = tickets locked in active exchanges (as requester)
  - earned_from_games = fragments (0-4 as decimal)
  - pending_earned = earned tickets awaiting delivery confirmation
  - Realtime: Subscribable via Realtime API
- [ ] `GET /api/wallet/history` endpoint:
  - Input: {limit: 30}
  - Output: {transactions: [{type, amount, related_exchange_id, timestamp}]}
  - Types: issue_starter, earned_exchange, spent_request, refunded, fragment_redeemed
  - Pagination: Last 30 days by default
  - Audit trail: User can see full transaction history
- [ ] `POST /api/wallet/redeem-fragments` endpoint:
  - Input: {fragments_count}
  - Output: {success: true, new_balance, transaction_id}
  - Validates: 4+ fragments available
  - Conversion: 4 fragments = 1 ticket
  - Fragments rounded down (0.5 + 0.25 = 0.75, rounds to 0)
  - Wait, fix: Fragments stored as NUMERIC, validate >= 4.0
  - Creates transaction_log entry
  - Updates tickets.balance immediately
- [ ] `GET /api/wallet/starter-allocation` endpoint:
  - Input: None
  - Output: {starter_tickets: 3, activated: boolean, activation_required_by: null}
  - Returns allocation status for new users
  - Explains: "3 free tickets to get started. List a toy to activate."
- [ ] Validation & Business Rules:
  - Cannot have negative balance (enforced at DB level + API)
  - Minimum 1 ticket to request toy
  - Fragment conversion minimum: 4 fragments = 1 ticket
  - Starter tickets: 3 (non-tradable, cannot be gifted)
- [ ] Error handling:
  - 400: Invalid amount
  - 401: Unauthorized
  - 422: Insufficient funds
  - 429: Rate limited (max 1 redemption per 5 seconds)

### Implementation Notes
- Balance is denormalized (updated via triggers) for performance
- Wallet queries should be instant (<10ms)
- All balance changes logged (audit trail for disputes)
- Realtime updates via Supabase Realtime subscriptions
- Consider: Future gifting/trading (Phase 2/3)

### Testing
- User can view wallet balance
- Ticket frozen when request created
- Ticket released when request declined
- Ticket consumed when exchange completed
- Fragment redemption works (4 fragments → 1 ticket)
- Cannot have negative balance
- Transaction history accurate

---

## Task 4.5: Create Exchange Request/Accept Endpoints

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.4, 4.1, 4.3, 4.4

### Description
Implement the core exchange flow: request creation, acceptance/decline, and escrow mechanics.

### Acceptance Criteria
- [ ] `POST /api/exchanges` endpoint (Request Toy):
  - Input: {toy_id, kid_for_id, message}
  - Output: {exchange_id, status: 'pending_request', created_at}
  - Validates: User has 1+ available ticket
  - Validates: Toy status='active' (not already unavailable)
  - Validates: Requester is not lister
  - Deducts 1 ticket from requester wallet (frozen)
  - Creates exchange row with status='pending_request'
  - Sends notification to lister: "New request for [Toy]! [Parent name] has X exchanges"
  - Requester sees: "Awaiting response from [Lister name]"
  - Timeout: 48h (auto-cancel if lister doesn't respond)
- [ ] `GET /api/exchanges` endpoint:
  - Input: {status, role}
  - Output: {exchanges: [{exchange_id, toy_name, partner_name, status, created_at, due_date}]}
  - Status filter: pending_request, accepted, in_transit, delivered, confirmed, completed, disputed
  - Role: requester or lister (filters own exchanges)
  - Pagination: Latest first
- [ ] `GET /api/exchanges/[id]` endpoint:
  - Input: None
  - Output: {exchange_id, toy{}, requester{}, lister{}, status, timeline{}, messages[]}
  - Full context for exchange detail page
  - RLS: Only requester or lister can view
  - Shows: Photos, condition listed, delivery status, messages
  - Shows: Links to user profiles (ratings, review history)
- [ ] `POST /api/exchanges/[id]/accept` endpoint (Lister):
  - Input: None
  - Output: {success: true, status: 'accepted'}
  - Validates: Requester is lister
  - Updates exchange status='accepted'
  - Sets accepted_at timestamp
  - Toy status updated to 'unavailable'
  - Requester's frozen ticket now locked in escrow
  - Lister's earned ticket created (pending delivery)
  - Sends notification to both: "Exchange accepted! Please coordinate delivery."
- [ ] `POST /api/exchanges/[id]/decline` endpoint (Lister):
  - Input: {reason}
  - Output: {success: true, refund_status: 'completed'}
  - Validates: Requester is lister
  - Exchange status='canceled'
  - Requester's frozen ticket refunded (returned to available)
  - Sends notification: "Your request was declined"
  - Toy remains available (can accept other requests)
- [ ] Timeout Logic:
  - 48h no response → auto-cancel exchange
  - Refund requester's ticket
  - Edge Function runs every hour to check timeouts
  - Sends email warning 24h before auto-cancel
- [ ] Error handling:
  - 400: Invalid toy_id or kid_for_id
  - 401: Unauthorized
  - 403: Cannot accept own request
  - 404: Exchange not found
  - 409: Toy already unavailable (race condition)
  - 422: Invalid status transition

### Implementation Notes
- Escrow mechanics are critical; double-check DB constraints
- Status transitions: pending_request → accepted → (in_transit) → delivered → confirmed → completed
- Timeout handling: Use Supabase Edge Function (scheduled job)
- Notification timing: Instant (Priority 1 notifications)
- Consider: What if lister lists same toy to multiple requesters? (Handled by taking first accept, declining others)

### Testing
- User can request toy (1 ticket frozen)
- Lister can accept (escrow created)
- Lister can decline (ticket refunded)
- Auto-cancel works after 48h (ticket refunded)
- Cannot request own toy
- Cannot request if no tickets available
- Cannot change status if not involved in exchange

---

## Task 4.6: Implement Delivery Confirmation Endpoint

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.4, 4.5

### Description
Implement delivery confirmation and dispute handling workflow.

### Acceptance Criteria
- [ ] `POST /api/exchanges/[id]/confirm-delivery` endpoint:
  - Input: {condition_received, notes, photos[]}
  - Output: {success: true, status: 'confirmed'}
  - Validates: Requester is user (who received toy)
  - Condition options: like_listed, minor_wear, damage, missing_parts
  - Photos optional (up to 2, max 1MB each)
  - Creates delivery_confirmation row
  - Exchange status='confirmed'
  - delivery_confirmed_at timestamp set
  - Logic:
    - If condition='like_listed' OR 'minor_wear' → auto-complete
    - If condition='damage' OR 'missing_parts' → mark 'disputed'
- [ ] `POST /api/exchanges/[id]/dispute` endpoint:
  - Input: {reason, description, photos[]}
  - Output: {success: true, dispute_id, status: 'under_review'}
  - Creates dispute row (status='open')
  - Exchange status='disputed'
  - Sends notification to admin team: "Dispute reported for exchange [id]"
  - Tickets remain frozen pending resolution
  - Admin team reviews within 24h
- [ ] Auto-Completion Logic:
  - If no confirmation within 7 days of 'in_transit':
    - Email warning: "Your exchange will auto-complete in 48h"
    - After 7 days: Exchange status='auto_completed'
    - Requester's ticket consumed
    - Lister's earned ticket released
    - Notification sent: "Exchange auto-completed"
  - Cannot dispute after auto-completion
- [ ] Exchange Completion:
  - Exchange status='completed'
  - completed_at timestamp set
  - Both users notified
  - Email sent to both: "Exchange completed! [link to rate]"
  - Tickets released:
    - Requester's frozen → consumed (removed)
    - Lister's pending → available (added to balance)
  - Ratings enabled for 7 days post-completion
- [ ] Error handling:
  - 400: Invalid condition
  - 401: Unauthorized
  - 403: Only requester can confirm delivery
  - 404: Exchange not found
  - 409: Exchange not in 'delivered' state

### Implementation Notes
- Delivery photos stored in Supabase Storage (same as toy photos)
- Dispute resolution: Admin reviews and decides (Task 6.x)
- Auto-completion: Edge Function runs hourly
- Condition validation: Client-side + server-side
- Realtime: Exchange status change broadcasts to both users

### Testing
- User can confirm delivery with condition
- Delivery confirmation creates delivery_confirmation row
- Auto-complete works after 7 days (without manual confirmation)
- Dispute workflow creates dispute row
- Exchange marked 'completed' when both conditions met
- Tickets released correctly (consumed for requester, added for lister)

---

## Task 4.7: Create Wishlist API Endpoints

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.6, 4.1

### Description
Implement wishlist management for personalized matching.

### Acceptance Criteria
- [ ] `GET /api/wishlists/[kid-id]` endpoint:
  - Input: None
  - Output: {wishlist_id, items: [{item_id, toy_id, custom_text, priority_order}], updated_at}
  - Returns user's own wishlist only (RLS)
  - Items ordered by priority
- [ ] `POST /api/wishlists/[kid-id]/items` endpoint:
  - Input: {toy_id OR custom_wish_text, category_preference, tag_preferences, condition_preference, priority_order}
  - Output: {item_id, created_at}
  - Validates: Either toy_id OR custom_text provided (not both, not neither)
  - Max 50 items per wishlist (enforced)
  - Priority order: 1-50
  - Condition preference options: any, like_new, good_plus, good
  - Inserts wishlist_items row
  - Auto-creates wishlist if doesn't exist
- [ ] `PUT /api/wishlists/[kid-id]/items/[item-id]` endpoint:
  - Input: {priority_order, condition_preference}
  - Output: {success: true}
  - Updates wish details
  - Re-ordering changes priority_order
- [ ] `DELETE /api/wishlists/[kid-id]/items/[item-id]` endpoint:
  - Input: None
  - Output: {success: true}
  - Removes item from wishlist
  - Soft delete (archived, can restore in Phase 2)
- [ ] `GET /api/wishlists/[kid-id]/suggestions` endpoint:
  - Input: None
  - Output: {suggestions: [{toy_id, name, match_score, reason}]}
  - Returns manually matching toys (not daily digest)
  - Useful for real-time search/discovery
  - Threshold: ≥60% match score
- [ ] Wishlist Lifecycle:
  - Auto-create on first item addition
  - No explicit delete (wishlist persists when empty)
  - Preferences: Users toggle matching on/off per child
- [ ] Error handling:
  - 400: Invalid input (missing both toy_id and custom_text)
  - 401: Unauthorized
  - 403: Cannot modify other user's wishlist
  - 409: Duplicate toy in wishlist
  - 422: Wishlist full (50 items max)

### Implementation Notes
- Wishlists are private (not visible to other users)
- Matching happens via Edge Function (daily at 02:00 UTC)
- Wishlist used as input for matching algorithm
- No real-time wishlist sharing in MVP (Phase 2)

### Testing
- User can create wishlist for kid
- User can add items (both toys and custom wishes)
- Max 50 items enforced
- User can reorder items
- User cannot see other users' wishlists
- Suggestions endpoint returns relevant matches

---

## Task 4.8: Create Messaging Endpoints (Exchange-scoped)

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 2.5, 4.5

### Description
Implement in-app messaging for exchange coordination (not general chat).

### Acceptance Criteria
- [ ] `POST /api/exchanges/[id]/messages` endpoint:
  - Input: {content}
  - Output: {message_id, sender_id, created_at}
  - Validates: Message max 500 characters
  - Validates: User is part of exchange (requester or lister)
  - Auto-flag: Detect phone numbers, addresses, payment requests
  - Moderation flag: {flagged: true, reasons: ['phone_number']}
  - Message stored in exchange_messages table
  - Realtime broadcast via Supabase Realtime
  - Notification to recipient: "[Name] sent you a message"
- [ ] `GET /api/exchanges/[id]/messages` endpoint:
  - Input: {limit: 50}
  - Output: {messages: [{message_id, sender_id, sender_name, content, created_at}]}
  - Returns messages sorted chronologically (newest last)
  - Paginated: 50 messages per page
  - RLS: Only exchange participants can view
- [ ] `DELETE /api/messages/[id]` endpoint:
  - Input: None
  - Output: {success: true}
  - Soft delete: deleted_at set, is_deleted_by_sender=true
  - Message still visible to other party (marked as "deleted by sender")
  - Or: Hide completely (Team decision)
- [ ] Message Moderation:
  - Auto-flag: Regex patterns for:
    - Phone numbers: \+?[\d\s]{10,}
    - Emails: [\w\.-]+@[\w\.-]+\.\w+
    - Addresses: \d+\s+\w+\s+(St|Ave|Rd|Ln)
    - Payment terms: 'paypal', 'stripe', 'transfer', 'bank'
  - Flagged messages: Can still be sent (warning shown to sender)
  - Admin review: Flagged messages visible in admin panel
  - Action: Admin can remove message, warn user
- [ ] Message Retention:
  - Deleted 30 days after exchange completion (hard delete)
  - Edge Function: Runs nightly to clean up old messages
  - Timestamp: deleted_at set, message removed from queries
- [ ] Error handling:
  - 400: Message too long (>500 chars)
  - 401: Unauthorized
  - 403: User not part of exchange
  - 404: Exchange not found
  - 429: Rate limited (max 10 messages per minute per exchange)

### Implementation Notes
- Realtime: Message appears instantly for both users
- Moderation: Automated flags, human review for escalation
- Privacy: Messages not searchable (scoped to exchanges only)
- Soft delete: Preserve for dispute resolution
- Consider: Auto-lock messages after exchange completed (Phase 2)

### Testing
- Users can message within exchange
- Messages appear in real-time
- Flagged messages work (auto-detect)
- User cannot message across exchanges
- Message history loads correctly
- Soft delete works
- Notification sent to recipient

---

## Task 4.9: Implement API Rate Limiting & CORS

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 4.1-4.8

### Description
Implement security controls for API protection and cross-origin requests.

### Acceptance Criteria
- [ ] Rate Limiting (middleware):
  - Global: 1,000 requests per hour per IP
  - Per-user: 1,000 requests per hour (authenticated)
  - Strict endpoints:
    - Auth: 5 login attempts per 15 min per IP
    - Toy listing: 10 per hour per user (prevent spam)
    - Fragment redemption: 1 per 5 seconds per user
  - Algorithm: Token bucket (sliding window)
  - Headers: Return X-RateLimit-* headers
  - Exceeded: 429 Too Many Requests response
- [ ] CORS Configuration:
  - Allowed origins:
    - Localhost:3000 (dev)
    - https://app.toyfortoy.example.com (production)
    - Preview deployments on Vercel
  - Allowed methods: GET, POST, PUT, DELETE, OPTIONS
  - Allowed headers: Content-Type, Authorization
  - Credentials: Include (for cookies/auth)
  - Preflight caching: 3600 seconds
- [ ] Security Headers:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY (prevent clickjacking)
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: (disable unnecessary APIs)
- [ ] Input Validation:
  - Content-Type check (must be application/json)
  - Content length limit: 1MB (prevent large payload attacks)
  - Request validation: Zod schemas on all endpoints
  - Sanitization: HTML escape strings, prevent SQL injection (RLS provides final protection)
- [ ] Error Responses (Consistent):
  - Format: {error: string, code: string, details?: object}
  - Examples:
    - {error: "Invalid input", code: "INVALID_INPUT", details: {field: "email"}}
    - {error: "Rate limited", code: "RATE_LIMITED", details: {retry_after: 60}}
- [ ] HTTPS Enforcement:
  - All endpoints require HTTPS (except localhost for dev)
  - Upgrade HTTP to HTTPS (Vercel handles, check config)
- [ ] Testing & Monitoring:
  - Log all rate limit hits
  - Alert on suspicious patterns (many failed auth attempts)
  - Monitor 5xx errors
  - Track API latency (p50, p95, p99)

### Implementation Notes
- Rate limiting library: `express-rate-limit` or `Vercel Edge Middleware`
- CORS: Implement at middleware level (Next.js pages/api/_middleware)
- Input validation: Use Zod schemas (already in deps)
- Error codes: Document in API docs (OpenAPI)

### Testing
- Rate limit enforcement works
- CORS preflight handled
- Security headers present in responses
- Large payloads rejected (>1MB)
- Invalid content-type rejected
- Monitoring alerts firing for anomalies

---

## Task 4.10: Create API Documentation (OpenAPI/Swagger)

**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 4.1-4.9

### Description
Generate comprehensive API documentation using OpenAPI 3.0 specification.

### Acceptance Criteria
- [ ] OpenAPI 3.0 Specification Created:
  - File: `/docs/openapi.yaml` or `/swagger.json`
  - Includes all endpoints (35+ endpoints)
  - Each endpoint documented:
    - operationId, summary, description
    - Parameters (query, body, path)
    - Request body (JSON schema)
    - Response schemas (200, 400, 401, 403, 404, 429, 500)
    - Examples (request/response)
    - Error descriptions
- [ ] Swagger UI Integration:
  - Route: `/api/docs` (Swagger UI)
  - Route: `/api/docs.json` (OpenAPI JSON)
  - Swagger UI for interactive exploration
  - "Try it out" feature for authenticated endpoints
- [ ] API Endpoints Organized by Tag:
  - Authentication
  - User Profile
  - Toys
  - Exchanges
  - Wallet
  - Wishlist
  - Messages
  - Notifications (Phase 2)
  - Admin (Phase 2)
- [ ] Schema Definitions:
  - Common types (User, Toy, Exchange, Message, etc.)
  - Reusable across endpoints
  - Input/output schemas match actual implementation
- [ ] Documentation Features:
  - Authentication method: Bearer token (JWT)
  - Base URL: /api
  - Rate limiting info (documented)
  - Error handling examples
  - Success examples for each endpoint
- [ ] README Section in docs/:
  - API Overview (what it does)
  - Getting Started (auth, base URL)
  - Common Flows (signup → list toy → request → exchange)
  - Error Handling Guide
  - Rate Limiting Explanation

### Implementation Notes
- Use `swagger-jsdoc` to generate OpenAPI from code comments
- Or maintain YAML manually (more control)
- Swagger UI auto-deployed with app
- Update docs whenever endpoint changes
- Include code examples (curl, JavaScript, Python)

### Testing
- Swagger UI loads at /api/docs
- All endpoints documented with examples
- "Try it out" works for GET requests
- Schemas accurate (test with actual responses)
- No broken references or missing fields

