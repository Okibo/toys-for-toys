# Product Requirements Document: Toy-for-Toy
## Cashless Toy Exchange Platform with Ticket Economy

**Document Version:** 1.0
**Last Updated:** November 2024
**Status:** Active Development
**Target Platforms:** Web (Next.js), iOS (Capacitor), Android (Capacitor)

---

## 1. Executive Summary

### Vision
Toy-for-Toy is a GDPR-compliant, cashless toy exchange platform that enables parents to exchange children's toys through a ticket-based bartering system. The platform solves the problem of toy accumulation and expense by leveraging a closed-loop economy supported by targeted advertising and rewarded mini-games.

### Mission
To create a sustainable, cost-free, and engaging toy exchange ecosystem where parents benefit from targeted, behavior-driven advertising while maintaining strict data privacy and compliance with EU/international child protection regulations.

### Core Value Proposition
1. **No Monetary Transactions:** 1-for-1 ticket barter eliminates payment friction and fraud
2. **GDPR-Compliant:** Parent-centric data collection; no child profiles or identifying information
3. **Engagement Through Gamification:** Mini-games drive retention and ad impressions
4. **Sustainable Monetization:** Ad revenue from anonymized behavioral patterns (search filters, wishlist preferences)
5. **Multi-Platform:** Single codebase serves web, iOS, and Android

### Business Goals
- **30-Day Target:** Achieve 1,000 active parent users by end of MVP Phase 1
- **Monetization:** Generate minimum 0.50 EUR revenue per active user monthly via ad impressions
- **Retention:** Achieve 40% monthly active user retention by end of Phase 2
- **Compliance:** 100% GDPR adherence with documented consent flows and data deletion procedures
- **Scalability:** Support 100,000+ concurrent users on Supabase free tier by optimizing RLS policies and database queries

---

## 2. User Personas

### Primary Persona: Emma (Parent, 35-50 years old)

**Demographics:**
- Age: 35-50 years old
- Household: 1-3 children, ages 2-14
- Tech proficiency: Moderate (uses Facebook, WhatsApp, online shopping)
- Income: EUR 40,000-80,000 annually
- Location: Germany, Poland, Austria

**Goals:**
- Reduce toy clutter and spending on toys
- Find safe, verified toy swaps in her local area
- Understand what ads her children are exposed to
- Manage toy preferences for multiple children without storing personal data

**Pain Points:**
- Overwhelming number of toys; limited space
- Cost of new toys for short-lived interests
- Concern about privacy and child data security online
- Difficulty tracking toy exchanges and avoiding fraud

**Behavior:**
- Logs in 3-4 times per week
- Actively searches for specific toy types (educational, themed)
- Uses wishlist feature to curate future acquisitions
- Engages with mini-games 2-3 times per week for ticket fragments
- Watches rewarded video ads if incentive is clear

**Key Needs:**
- Simple, intuitive interface (no complex settings)
- Clear consent dialogs for behavioral analytics
- Easy data access/deletion on request
- Notification preferences that respect quiet hours

### Secondary Persona: Local Toy Exchange Admin (Future)

**Note:** Not in MVP scope. Introduced in Phase 2 for local community management.

---

## 3. User Stories & Acceptance Criteria

### Story 1: User Registration & Onboarding
**As a** parent,
**I want to** create an account with email/password and provide parental consent for analytics,
**So that** I can start exchanging toys securely.

**Acceptance Criteria:**
- User can register with email and password (min 8 chars, 1 uppercase, 1 number, 1 special char)
- System validates email uniqueness and sends verification email
- User can select preferred language (Polish, German, English)
- User must accept Terms of Service and Privacy Policy (GDPR-compliant)
- User must explicitly consent to behavioral analytics (search filters, wishlist logging)
- System allocates 10 initial tickets upon account creation
- User receives welcome email with getting started guide
- On-account creation, user cannot list toys until email verified

**Implementation Notes:**
- Use Supabase Auth with email/password provider
- Store parental consent record in `consent_records` table with timestamp and IP address
- Implement consent withdrawal mechanism in account settings

---

### Story 2: List a Toy
**As a** parent,
**I want to** upload a toy with photos, category, tags, age group, and condition,
**So that** other parents can request it.

**Acceptance Criteria:**
- User can upload 1-5 images of the toy (JPG/PNG, max 5MB each)
- System stores images in Supabase Storage with RLS (user_id-based access)
- User selects from predefined categories (e.g., Blocks, Vehicles, Dolls, Board Games)
- User selects 1-3 tags per toy (e.g., "Police", "Educational", "Wood")
- User specifies age group: 0-2, 3-5, 6-8, 9-11, 12-14
- User indicates condition: Like New, Good, Fair, Well-Loved
- Listing costs 1 ticket (deducted immediately)
- System logs category/tag selection for behavioral analytics
- Toy appears in search results within 30 seconds
- User receives confirmation notification
- Toys auto-expire after 90 days if not requested

**Implementation Notes:**
- Use Supabase Storage with bucket policies based on user_id
- Image optimization: auto-resize to 800x800px on upload
- Implement debouncing on category/tag selection to reduce analytics logging
- Use database trigger to decrement tickets and create toy_listing record

---

### Story 3: Search & Discover Toys
**As a** parent,
**I want to** search toys by category, age group, tags, and location,
**So that** I can find toys that match my children's interests.

**Acceptance Criteria:**
- Search filters: category, age group, tags, distance (5km, 10km, 25km, any)
- Filters support multi-select (e.g., multiple age groups OR multiple tags)
- Search results display toy photos, condition, age group, tags
- Results ranked by: recent uploads first, then by match score
- System logs all filter combinations for behavioral analytics (no PII)
- Search is real-time and completes in <500ms
- Mobile autocomplete for tag entry
- Saved searches display 5 most recent filter combinations
- Users can apply filters without entering search term

**Implementation Notes:**
- Use Supabase full-text search on toy description
- Implement database view `user_search_analytics` to aggregate filter usage
- Cache filter options (categories/tags) in frontend local storage
- Use PostGIS for distance-based filtering (future enhancement; initially use postal codes)

---

### Story 4: Wishlist & Smart Matching
**As a** parent,
**I want to** create wishlists of toy categories/tags I'm interested in,
**So that** the system can notify me when matching toys become available.

**Acceptance Criteria:**
- User can create multiple wishlists (e.g., "Birthday gifts", "Educational toys")
- Wishlist contains categories and tags (no specific toy IDs)
- System checks for matching available toys daily
- Matching toy notification includes: toy photo, condition, requested category/tag
- User can accept/decline match via notification
- Accepted match initiates exchange request (Story 5)
- System logs wishlist items for behavioral analytics
- User can delete wishlists; system erases logs if requested via GDPR deletion

**Implementation Notes:**
- Create `wishlists` and `wishlist_items` tables
- Implement edge function to run daily matching job (7 AM UTC)
- Match logic: toy.category IN wishlist_items.categories OR toy.tags && wishlist_items.tags
- Notification delivery via Firebase FCM (in-app via Supabase Realtime)

---

### Story 5: Initiate Exchange Request
**As a** parent,
**I want to** request a toy from another parent,
**So that** we can negotiate exchange details.

**Acceptance Criteria:**
- User clicks "Request Toy" on a listing
- System confirms user has 1+ available ticket
- Exchange request created with status "pending_requester_confirmation"
- Requester can specify pickup/dropoff method (in-person, mail, courier)
- Requester adds optional message to toy owner
- System freezes 1 ticket from requester (escrow)
- Toy owner receives notification with request details
- Requester sees "Request Sent" status on toy card
- Request expires after 7 days if toy owner doesn't respond

**Implementation Notes:**
- Create `exchanges` table with status tracking
- Implement database trigger to decrement tickets and create escrow record
- Send notification via Firebase FCM + Supabase Realtime
- Use database function to auto-cancel expired requests

---

### Story 6: Accept/Decline Exchange Request
**As a** toy owner,
**I want to** accept or decline exchange requests,
**So that** I can manage who receives my toy.

**Acceptance Criteria:**
- Toy owner receives in-app notification + email with request details
- Can view requester profile (no contact info initially)
- Can accept request (toy owner confirms receipt method)
- Can decline request (explanation optional; ticket returned to requester)
- Upon acceptance: status becomes "exchange_confirmed"
- Toy no longer appears in search results after acceptance
- Both parties receive confirmation with exchange ID and next steps
- Exchange visible in user's "Active Exchanges" list

**Implementation Notes:**
- Implement soft delete on toy listings (is_active = false)
- Create `exchanges` state machine (pending → confirmed → completed)
- Send confirmation email with exchange tracking code

---

### Story 7: Confirm Delivery & Complete Exchange
**As a** requester,
**I want to** confirm delivery of the received toy,
**So that** the toy owner receives their ticket reward.

**Acceptance Criteria:**
- Requester receives delivery instructions from toy owner
- Requester can upload photo proof of toy received
- Requester clicks "Confirm Received" to mark exchange complete
- System releases toy owner's ticket (removes from escrow)
- If no confirmation after 48 hours, system auto-confirms and releases ticket
- Both parties receive completion notification
- Exchange appears in completed history
- User can rate toy quality and exchange experience (Story 9)

**Implementation Notes:**
- Implement 48-hour auto-confirmation via scheduled function
- Photo requirement: optional but encouraged (UI prompts if skipped)
- Use PostgreSQL timestamp to track delivery deadline

---

### Story 8: Dispute Resolution
**As a** user,
**I want to** report an issue with a received toy or exchange,
**So that** disputes can be fairly resolved.

**Acceptance Criteria:**
- User can file dispute within 7 days of exchange completion
- Dispute categories: toy damaged, toy missing items, no delivery, other
- User must provide detailed description and optional photos
- System notifies both parties and support team
- Support team reviews and decides: refund ticket to requester or close dispute
- Disputed toy owner cannot list new toys until dispute resolved
- Dispute status visible to both parties
- All disputes logged for analytics (no PII, aggregated by category)

**Implementation Notes:**
- Create `disputes` and `dispute_messages` tables
- Implement support team dashboard (future; manually managed initially)
- Use database constraint to prevent further exchanges until resolved
- Email notifications to both parties and support

---

### Story 9: Rate Exchange Experience
**As a** user,
**I want to** rate toy quality and the other parent,
**So that** the community builds trust through verified feedback.

**Acceptance Criteria:**
- Available after exchange completion (48+ hours after confirmation)
- Toy quality rating: 1-5 stars + optional comment
- Exchange experience rating: 1-5 stars (responsiveness, communication)
- Ratings visible to toy owner only (not anonymized)
- User can update rating within 7 days
- System aggregates ratings into user score (avg of last 20 ratings)
- User score displayed on profile
- Users with <3.0 rating get exchange requests pending manual review

**Implementation Notes:**
- Create `ratings` table with user_id, target_user_id, exchange_id
- Implement user score view for efficient profile fetching
- Ratings not public (visible only in exchange context)

---

### Story 10: Mini-Game Engagement
**As a** parent,
**I want to** play simple daily games to earn ticket fragments,
**So that** I can accumulate free tickets without exchanging toys.

**Acceptance Criteria:**
- Game available daily (resets at midnight UTC)
- Three game options: Shape Sorter, Memory Match, Color Clicker
- Game completion: 0.25 ticket fragment (4 completions = 1 full ticket)
- Rewarded video ads unlock bonus fragments (0.1 per ad)
- Game play limit: 5 plays per day (prevents ad fatigue)
- Earned fragments automatically convert to tickets when hitting 1.0
- Game instruction text supports all three languages
- Mobile-optimized gameplay (touch controls)
- Analytics: game type, completion rate, ad engagement (no PII)

**Implementation Notes:**
- Implement games as React components with Tailwind CSS
- Store game progress in `game_sessions` table
- Fragment conversion via database trigger
- Google AdMob integration (production); mock in development

---

### Story 11: Push Notifications & Preferences
**As a** parent,
**I want to** receive notifications about exchanges and matches,
**So that** I stay informed without being overwhelmed.

**Acceptance Criteria:**
- Notification types: new match, exchange request, delivery reminder, rating received
- Default notification settings: enabled for all types
- User can disable by type or entirely
- User can set quiet hours (e.g., 9 PM - 8 AM)
- In-app notifications via Supabase Realtime (always on)
- Push notifications via Firebase FCM for background state
- Email notifications for critical events (exchange completed, dispute filed)
- Unsubscribe link in all emails (stored in notification_preferences)
- All notification events logged for analytics

**Implementation Notes:**
- Create `notification_preferences` table per user
- Implement quiet hours check in notification edge function
- Email delivery via SendGrid (production)
- Firebase FCM configuration in capacitor.config.ts

---

### Story 12: Account Settings & Data Access
**As a** parent,
**I want to** view, download, or delete my data,
**So that** I maintain control over my personal information.

**Acceptance Criteria:**
- User can download all personal data (email, tickets, exchanges) as JSON
- User can access all behavioral analytics logs (search filters, wishlist history)
- User can request data deletion (GDPR right to be forgotten)
- Data deletion: user account + all personal data removed within 30 days
- Behavioral analytics deleted immediately; aggregated data retained
- Toy images and exchange records anonymized (not deleted)
- Email confirmation required for deletion requests
- User receives confirmation email upon deletion
- System logs deletion request for audit trail

**Implementation Notes:**
- Implement edge function for data export
- GDPR deletion workflow: email confirmation → 7-day grace period → permanent deletion
- Use database trigger to cascade delete related records
- Maintain audit log in separate table (not subject to deletion)

---

### Story 13: Internationalization (i18n)
**As a** user,
**I want to** interact with the platform in my preferred language,
**So that** I understand all content and features.

**Acceptance Criteria:**
- Supported languages: Polish (primary), German, English
- Language selection on login/signup; persisted in user profile
- All UI text translated (buttons, labels, error messages, emails)
- Date formatting locale-specific (e.g., DD.MM.YYYY for German)
- Number formatting locale-specific (e.g., 1,00 EUR vs 1.00 EUR)
- Mini-game instructions available in all languages
- Email templates translated
- Placeholder text and help text translated

**Implementation Notes:**
- Use next-intl library for i18n routing
- Translation files: JSON in `/public/locales/{locale}/{namespace}.json`
- Font support: ensure adequate Unicode coverage for Polish characters
- Testing: verify all languages render correctly on mobile

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

#### FR-AUTH-001: Email/Password Registration
- User provides email, password, password confirmation
- System validates: email format, unique email, password strength (min 8, uppercase, number, special char)
- System sends verification email with 6-digit code valid for 24 hours
- User must verify email before accessing app features
- Upon first login, user cannot list toys until profile completed

#### FR-AUTH-002: Parental Consent Management
- During registration, user must accept Privacy Policy and consent to behavioral analytics
- Consent stored in `consent_records` table with: user_id, consent_type, timestamp, ip_address, user_agent
- Consent form clearly explains: data collected, how used, retention period, deletion rights
- User can withdraw consent anytime in account settings
- Withdrawal immediate; behavioral logging stops; future data not collected

#### FR-AUTH-003: Session Management
- Supabase JWT tokens: 24-hour expiration
- Refresh tokens: 7-day expiration
- Token renewal: automatic on user interaction (sliding window)
- Logout: clear local JWT tokens; clear Supabase session
- Multi-device support: same user can have 3 concurrent sessions

#### FR-AUTH-004: Password Reset
- User initiates reset via "Forgot Password" link
- System sends email with reset token valid for 24 hours
- User sets new password (same validation as signup)
- Token single-use; expired tokens cannot be reused
- Email confirmation upon successful reset

### 4.2 Ticket Economy

#### FR-TICKET-001: Initial Allocation
- New user receives 10 tickets upon account creation
- Tickets non-transferable (cannot gift between accounts)
- Ticket balance visible in header (always visible)

#### FR-TICKET-002: Ticket Operations
- Listing a toy: 1 ticket deducted immediately (frozen until toy removed/expires)
- Requesting toy: 1 ticket deducted to escrow (released after exchange complete or declined)
- Completing exchange: toy owner receives 1 ticket (released from escrow)
- Mini-game fragments: 0.25 fragments per game (auto-convert at 1.0)
- All operations atomic: ticket state consistent before/after operation

#### FR-TICKET-003: Ticket Freezing (Escrow)
- Listing frozen tickets: stored in `toys.frozen_listing_tickets`
- Exchange escrow frozen tickets: stored in `exchanges.frozen_requester_tickets` + `exchanges.frozen_owner_tickets`
- Frozen tickets excluded from available balance calculation
- Frozen tickets released immediately if toy removed or exchange declined
- Frozen tickets released via scheduled function if exchange expires

#### FR-TICKET-004: Balance Display & History
- User balance = total_tickets - frozen_listing - frozen_escrow
- Transaction history shows all ticket movements (by type, date, amount)
- History accessible in account section; exportable as CSV

### 4.3 Toy Listings

#### FR-TOY-001: Toy Data Model
- Fields: user_id, category, description, tags (1-3), age_group, condition, location (postal_code), images (1-5)
- Additional: created_at, updated_at, expires_at (90 days), is_active (soft delete)
- Images stored in Supabase Storage with RLS (path: `/toys/{user_id}/{toy_id}/`)

#### FR-TOY-002: Listing Creation
- Validation: at least 1 category, 1 tag, 1 image, description <500 chars
- Categories: Blocks, Vehicles, Dolls, Board Games, Educational, Sports, Art, Other
- Tags: predefined list (150+) per category (e.g., Police, Fire, Train for Vehicles)
- Age groups: 0-2, 3-5, 6-8, 9-11, 12-14, 15+
- Condition: Like New, Good, Fair, Well-Loved
- Location: user's postal code (required)
- System allocates unique toy_id; creates toy record in database

#### FR-TOY-003: Toy Expiration
- Toys auto-expire after 90 days (is_active = false)
- Ticket refunded to user if toy expires with no accepted exchange
- Notification sent 7 days before expiry
- Expired toys archived but remain in database (user can re-list)

#### FR-TOY-004: Image Processing
- Upload validation: JPG/PNG only, max 5MB per image
- Auto-resize: 800x800px (quality 85%)
- Thumbnail generation: 300x300px for list views
- Storage path: `/toys/{user_id}/{toy_id}/{image_index}_{timestamp}.jpg`
- RLS policy: only user_id can access their toy images

### 4.4 Search & Discovery

#### FR-SEARCH-001: Search Filters
- Multi-select filters: category, age_group, tags, distance_km (5/10/25/any)
- Free text search on toy description (full-text search via PostgreSQL)
- Saved searches: 5 most recent filter combinations per user
- Results sorted by: recent_first, then by_distance, then by_rating

#### FR-SEARCH-002: Behavioral Analytics Logging
- Every filter application logged in `search_analytics` table
- Fields: user_id, filter_combination, timestamp, no_results_flag
- Aggregated view: `user_search_behavior` (categories searched, tags searched, frequencies)
- Aggregated data used for ad targeting; individual queries never sold

#### FR-SEARCH-003: Search Performance
- Query response time: <500ms P95
- Indexed columns: category, tags, age_group, location, created_at
- Pagination: load 20 results per page; lazy load on scroll

### 4.5 Wishlists & Matching

#### FR-WISH-001: Wishlist Management
- User can create unlimited wishlists
- Wishlist contains: name, description, categories (multi-select), tags (multi-select)
- Wishlists stored in database; can be edited/deleted
- Deletion cascade: related wishlist_items deleted

#### FR-WISH-002: Smart Matching Algorithm
- Daily job (7 AM UTC): find available toys matching any user's wishlists
- Match criteria: toy.category IN wishlist.categories OR toy.tags && wishlist.tags
- Match scoring: category_match (2 pts) > tag_match (1 pt)
- Notification sent if match score >0
- User can accept match (creates exchange request) or dismiss

#### FR-WISH-003: Wishlist Analytics
- Wishlist items logged in `wishlist_analytics` table
- Aggregated by: category frequency, tag frequency per user
- Used for ad targeting but not sold individually

### 4.6 Exchange Lifecycle

#### FR-EXCH-001: Exchange States
```
pending_requester_confirmation
  ↓
pending_owner_response (7-day timeout)
  ↓
exchange_confirmed
  ↓
pending_delivery_confirmation (48-hour timeout)
  ↓
exchange_completed
  ↓
eligible_for_rating (7-day window)
  ↓
closed
```

#### FR-EXCH-002: Exchange Creation
- Requester initiates by clicking "Request Toy"
- System checks: requester has 1+ ticket, toy is_active
- Creates exchange record with status "pending_requester_confirmation"
- Requester specifies delivery method: in_person, mail, courier
- Requester can add optional message (max 500 chars)
- 1 ticket frozen in requester's account (escrow)
- Notification sent to toy owner
- Expiry: 7 days (auto-decline if owner doesn't respond)

#### FR-EXCH-003: Exchange Confirmation (Owner)
- Toy owner reviews request details (requester profile, message)
- Owner can accept (status → exchange_confirmed) or decline
- If declined: requester's ticket released; toy remains active
- If accepted: toy becomes is_active = false; 1 ticket frozen for owner
- Both parties receive confirmation; delivery method agreed upon
- Delivery deadline set: 48 hours from confirmation

#### FR-EXCH-004: Delivery Confirmation
- Requester uploads photo proof (optional but encouraged)
- Requester clicks "Confirm Received"
- System marks exchange status: pending_delivery_confirmation
- Owner receives notification; can dispute if needed (Story 8)
- After 48 hours without dispute: system auto-completes
- Upon completion: owner's ticket released; status → exchange_completed
- Both parties notified; eligible for rating after 48 hours

#### FR-EXCH-005: Exchange Expiration & Cleanup
- Pending_owner_response: auto-decline after 7 days
- Pending_delivery_confirmation: auto-complete after 48 hours
- Expired exchanges logged for analytics

### 4.7 Disputes

#### FR-DISP-001: Dispute Filing
- Available 7 days after exchange completion
- Categories: toy_damaged, missing_items, no_delivery, other
- User submits detailed description + optional photos
- Support team notified; dispute status = open

#### FR-DISP-002: Dispute Resolution
- Manual review by support team (SLA: 48 hours)
- Decision: refund_requester_ticket, refund_owner_ticket, close_no_action
- Both parties notified of decision
- Appealing decisions: not in MVP (future feature)
- Disputed toy owner: cannot list new toys until resolved

#### FR-DISP-003: Dispute Analytics
- Dispute type, resolution, time-to-resolution tracked
- Aggregated by category (no PII)
- Used to improve exchange process

### 4.8 Ratings & Reviews

#### FR-RATE-001: Rating Availability
- Available 48+ hours after exchange completion
- Window: 7 days after completion (can update rating during window)

#### FR-RATE-002: Rating Types
- **Toy Quality:** 1-5 stars (visual scale with emoji: 1=Poor, 5=Excellent)
- **Exchange Experience:** 1-5 stars (responsiveness, communication clarity)
- Optional written comment (max 200 chars)
- Both ratings must be submitted together

#### FR-RATE-003: Rating Visibility & Aggregation
- Individual ratings: visible only to toy owner (not public)
- User score: average of last 20 ratings; displayed on profile
- Score threshold: users with <3.0 average, new requests flagged for review

### 4.9 Mini-Games

#### FR-GAME-001: Game Catalog
- **Shape Sorter:** Drag shapes into correct holes (age 2+)
- **Memory Match:** Flip tiles to find matching pairs (age 3+)
- **Color Clicker:** Match colors against timer (age 4+)
- All games single-player, no PvP elements

#### FR-GAME-002: Game Mechanics
- Play limit: 5 games per day (resets at midnight UTC)
- Completion: user reaches game-specific win condition (e.g., all shapes sorted)
- Reward: 0.25 ticket fragment per completion
- Bonus reward: 0.1 fragment per watched rewarded ad (max 1 ad bonus per game)
- Fragment auto-conversion to ticket at 1.0 threshold
- Game duration: 1-5 minutes per play

#### FR-GAME-003: Ad Integration
- Rewarded video ad shown after successful game completion
- User optional to watch (not mandatory)
- Bonus fragment awarded upon ad completion
- Ad impressions tracked: game type, completion rate, view duration
- Analytics no PII; aggregated only

#### FR-GAME-004: Game Performance & Progress
- Local progress saved in browser localStorage
- Server-side progress saved in `game_sessions` table
- Session includes: user_id, game_type, completion_status, play_time, fragment_earned

### 4.10 Notifications

#### FR-NOTIF-001: Notification Types
- **In-app:** via Supabase Realtime (always enabled)
  - New exchange request
  - Exchange accepted/declined
  - Delivery confirmation reminder (24h after exchange confirmed)
  - Exchange completed
  - Rating received
  - Toy expiry warning (7 days before)

- **Push (Firebase FCM):** sent if app in background
  - New exchange request
  - Exchange accepted
  - Delivery confirmation reminder
  - Exchange completed

- **Email:** critical events only
  - Exchange completed
  - Dispute filed
  - Account security events (password reset, new device login)

#### FR-NOTIF-002: Notification Preferences
- User can disable by type (toggle per notification category)
- Quiet hours: set start/end times; notifications muted during window
- Email frequency: daily digest, per-event, or off
- Unsubscribe link in all emails

#### FR-NOTIF-003: Notification Delivery
- Supabase Realtime: triggered by database events via PostgREST
- Firebase FCM: triggered by Edge Functions (production only)
- Email: SendGrid integration (production only); console logging (development)
- Retry logic: 3 retries for failed push notifications

### 4.11 Analytics & Behavioral Data

#### FR-ANALYTICS-001: Data Collection (Behavioral Only)
Collected:
- Search filter usage: category, tags, age_group, distance selections
- Wishlist items: categories and tags saved
- Game engagement: game type, completion rate, ad views, play frequency
- Exchange volume: toys listed, requests made, exchanges completed

NOT Collected:
- Child names, birthdates, or identifiers
- Exchange partner contact information
- Rating content (comments discarded; only star ratings aggregated)
- Toy descriptions (only category/tag metadata)

#### FR-ANALYTICS-002: Data Aggregation & Anonymization
- Individual user behavior not shared (only aggregates)
- Aggregated view: `user_behavioral_aggregates`
  - Categories searched (count, frequency)
  - Tags searched (count, frequency)
  - Age groups of interest (count, frequency)
  - Game engagement (completion rate, ad engagement %)
- No PII in aggregated data
- Retention: aggregated data retained indefinitely; individual logs deleted after 90 days

#### FR-ANALYTICS-003: Ad Targeting Based on Analytics
- Anonymized aggregates shared with ad partners (Google AdMob/AdSense)
- Example: "Users interested in Educational toys, age 6-8 category"
- No user ID mapping to ad partners
- User can opt-out of behavioral tracking; ads still shown but not targeted

#### FR-ANALYTICS-004: GDPR Compliance in Analytics
- User consent required before behavioral logging
- User can request download of behavioral logs (export as JSON)
- User can request deletion of behavioral logs
- Deletion: immediate removal of individual logs; aggregates updated
- Audit trail: log all data access/deletion for compliance

### 4.12 Search Behavior Insights (Ad Targeting Foundation)

#### FR-INSIGHTS-001: Behavioral Insights Collection
The platform collects anonymized behavioral patterns to improve ad precision:

**What is collected:**
- Search filter combinations (e.g., "category=Educational, age_group=6-8")
- Wishlist preferences (categories and tags)
- Game engagement patterns (which games played, frequency, ad views)
- Exchange behavior (toys listed by category, request patterns)

**How it's used:**
- Ad partner receives: "Users searching for Educational toys (30% frequency) + age 6-8"
- NOT shared: individual user IDs, names, contact info, toy descriptions
- Ad placement: contextual (educational content shows educational toy ads)

**Example Analytics Segment:**
```
Segment: "Parents of 6-8 year olds interested in STEM"
- Category search frequency: Blocks (45%), Educational (60%), STEM tags (50%)
- Wishlist composition: 70% contain STEM-related tags
- Game engagement: Shape Sorter (80% completion), Memory Match (75%)
- Estimate: 2,500 users in this segment
→ Ad targeting: Google AdMob campaign for STEM-related products
```

#### FR-INSIGHTS-002: User Control Over Behavioral Data
- Consent form explicitly lists: search patterns, wishlist tracking, game analytics
- User can withdraw behavioral tracking anytime (opt-out)
- Opt-out immediate: future data not logged
- Opt-out does NOT prevent: listing toys, exchanging toys, playing games
- Opted-out users still see ads but targeting is non-personalized

---

## 5. Non-Functional Requirements

### 5.1 Performance

#### NFR-PERF-001: Response Times
- Page load (web): <2s on 4G
- Page load (mobile): <2.5s on 4G
- Search query: <500ms P95
- Image upload: complete in <5s for 5 images on 4G
- Image display: lazy-load with placeholder

#### NFR-PERF-002: Database Performance
- User profile load: <100ms
- Search query on 100k toys: <500ms
- Bulk analytics aggregation: <5s for 100k records
- RLS policy enforcement: <10ms overhead per query

#### NFR-PERF-003: Frontend Optimization
- Code splitting: separate bundle per route
- Image optimization: WebP format with fallback
- Caching: service worker for offline support (search cache)
- Bundle size: <300KB gzipped (initial load)

### 5.2 Scalability

#### NFR-SCALE-001: Concurrent Users
- Support 10,000 concurrent users on Supabase free tier
- Real-time subscriptions: 50,000 concurrent (shared pool)
- Database connections: pooled via PgBouncer

#### NFR-SCALE-002: Data Growth
- 100,000 toys (by 12 months)
- 1,000,000 exchanges (by 24 months)
- Index strategy: composite indexes on (category, is_active), (user_id, created_at)

#### NFR-SCALE-003: Horizontal Scaling
- Vercel: auto-scaling on traffic spikes
- Supabase: auto-scaling on database connections
- Firebase FCM: native scaling (Google infrastructure)

### 5.3 Availability & Reliability

#### NFR-AVAIL-001: Uptime SLA
- Target: 99.5% uptime (monthly)
- Acceptable downtime: 3.6 hours per month (maintenance windows)

#### NFR-AVAIL-002: Disaster Recovery
- Database backups: daily via Supabase (7-day retention)
- Database snapshots: weekly (30-day retention)
- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 24 hours
- Testing: monthly backup restoration drill

#### NFR-AVAIL-003: Graceful Degradation
- Realtime unavailable: fallback to polling (every 30s)
- Push notifications unavailable: user checks in-app only
- Image upload failure: retry up to 3 times with exponential backoff
- Search unavailable: show cached results from last 24h

### 5.4 Security

#### NFR-SEC-001: Data Protection
- All data encrypted in transit (HTTPS/TLS 1.3)
- Database encryption at rest (Supabase default)
- User passwords: bcrypt with salt (min 10 rounds)
- API keys: stored in environment variables (never logged)

#### NFR-SEC-002: Authentication & Authorization
- JWT tokens: signed with HS256
- Token validation: on every API request
- RLS policies: enforced at database layer (not frontend)
- Session timeout: 24 hours (automatic logout)

#### NFR-SEC-003: Vulnerability Management
- Dependency scanning: npm audit weekly
- Security headers: HTTPS-only, CSP, X-Frame-Options
- Input validation: client-side + server-side (never trust client)
- SQL injection prevention: parameterized queries (Supabase PostgREST)

#### NFR-SEC-004: Audit Logging
- Critical operations logged: auth, exchanges, disputes, data access
- Log retention: 12 months
- Logs stored in separate database table (not subject to user deletion)
- Access control: support team only (read-only)

### 5.5 Compliance & Privacy

#### NFR-GDPR-001: Consent Management
- Explicit consent for behavioral analytics (not pre-checked)
- Consent form version control (dated consent records)
- Consent withdrawal: immediate effect; future data not logged
- Consent audit: exportable list of all user consents

#### NFR-GDPR-002: Data Subject Rights
- Right to access: user can download all personal data (JSON export)
- Right to erasure: user can request deletion (30-day grace period)
- Right to data portability: export in standard format (JSON/CSV)
- Right to rectification: user can update profile info
- All requests logged; completion confirmed via email

#### NFR-GDPR-003: Data Processing Agreement
- DPA in place with Supabase (data processor)
- DPA in place with Firebase (data processor for notifications)
- Sub-processors listed: Google (AdMob), SendGrid (email)
- Regular audit of processor compliance

#### NFR-GDPR-004: Privacy by Design
- Data minimization: only collect what's needed
- Purpose limitation: behavioral data for ad targeting only
- Storage limitation: raw logs deleted after 90 days (aggregates retained)
- Integrity & confidentiality: RLS + encryption

### 5.6 Internationalization (i18n)

#### NFR-I18N-001: Language Support
- Languages: Polish (primary), German, English
- Translation completeness: 100% of UI text
- Language selection: persisted in user profile
- Default language: browser locale detection + user override

#### NFR-I18N-002: Locale-Specific Formatting
- Dates: `DD.MM.YYYY` (German), `DD/MM/YYYY` (Polish), `MM/DD/YYYY` (English)
- Numbers: `1,00` (German), `1,00` (Polish), `1.00` (English)
- Currency: EUR (all markets)
- Time zones: UTC (internal storage); user's local time (display)

#### NFR-I18N-003: Content Localization
- All UI text translated via next-intl
- Email templates translated for each language
- Error messages translated
- Help documentation translated (future Phase 2)

### 5.7 Accessibility

#### NFR-A11Y-001: WCAG 2.1 AA Compliance
- Color contrast: 4.5:1 for normal text
- Keyboard navigation: all features accessible via keyboard
- Screen reader support: ARIA labels on all interactive elements
- Focus indicators: visible outline on interactive elements

#### NFR-A11Y-002: Mobile Accessibility
- Tap targets: minimum 48x48px
- Text resizing: support up to 200% zoom
- Touch alternatives: no gesture-only interactions

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Devices                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web Browser │  │  iOS Wrapper │  │ Android App  │      │
│  │  (Next.js)   │  │ (Capacitor)  │  │ (Capacitor)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Vercel CDN    │
                    │  (Next.js App)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────────────┐
        ┌──────────┤ Supabase Backend        │
        │           │ - PostgreSQL Database   │
        │           │ - Auth (JWT)            │
        │           │ - Realtime WebSockets   │
        │           │ - Storage (RLS)         │
        │           │ - Edge Functions        │
        │           └────────┬────────────────┘
        │                    │
    ┌───▼────────┐     ┌─────▼──────┐
    │ Firebase    │     │  SendGrid  │
    │ Cloud       │     │  (Email)   │
    │ Messaging   │     └────────────┘
    └─────┬──────┘
          │ Push Notifications
          │
    ┌─────▼──────────┐
    │ User Device    │
    │ (Background)   │
    └────────────────┘
```

### 6.2 Data Models

#### Core Tables

```sql
-- Users & Authentication
auth.users (Supabase managed)
  id UUID PRIMARY KEY
  email TEXT UNIQUE
  password_hash TEXT (bcrypt)
  email_confirmed_at TIMESTAMP
  last_sign_in_at TIMESTAMP
  created_at TIMESTAMP

-- Parent Account Profiles (no child info stored)
profiles
  id UUID PRIMARY KEY (FK to auth.users)
  preferred_language TEXT (default: 'en') -- 'pl', 'de', 'en'
  preferred_timezone TEXT (default: 'UTC')
  location_postal_code TEXT (required)
  created_at TIMESTAMP
  updated_at TIMESTAMP
  deleted_at TIMESTAMP (soft delete for GDPR)

-- Consent & GDPR Tracking
consent_records
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  consent_type TEXT ('privacy_policy', 'behavioral_analytics', 'marketing_emails')
  accepted BOOLEAN
  timestamp TIMESTAMP
  ip_address INET
  user_agent TEXT
  version_id UUID (FK to consent_versions)

-- Tickets (Economy)
tickets
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  balance INTEGER (default: 10 for new accounts)
  frozen_listing_tickets INTEGER (default: 0)
  frozen_escrow_tickets INTEGER (default: 0)
  updated_at TIMESTAMP

-- Ticket Transactions (Audit Trail)
ticket_transactions
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  transaction_type TEXT ('listing', 'request', 'escrow_release', 'mini_game')
  amount INTEGER (signed: +ve or -ve)
  reference_id UUID (FK to exchanges/toys/game_sessions)
  created_at TIMESTAMP

-- Toys
toys
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  category TEXT (indexed)
  description TEXT (max 500 chars)
  tags TEXT[] (1-3 tags, indexed)
  age_group TEXT (indexed) -- '0-2', '3-5', '6-8', '9-11', '12-14', '15+'
  condition TEXT -- 'like_new', 'good', 'fair', 'well_loved'
  location_postal_code TEXT (indexed)
  images_count INTEGER (1-5)
  is_active BOOLEAN (default: true, indexed)
  rating_avg NUMERIC(2,1) (null initially)
  created_at TIMESTAMP (indexed)
  updated_at TIMESTAMP
  expires_at TIMESTAMP (90 days from creation)

-- Exchanges (Transaction Records)
exchanges
  id UUID PRIMARY KEY
  requester_id UUID (FK to profiles)
  owner_id UUID (FK to profiles)
  toy_id UUID (FK to toys)
  status TEXT (indexed) -- 'pending_requester_confirmation', 'pending_owner_response', 'exchange_confirmed', etc.
  delivery_method TEXT -- 'in_person', 'mail', 'courier'
  requester_message TEXT (max 500 chars, nullable)
  frozen_requester_tickets INTEGER (1 if active)
  frozen_owner_tickets INTEGER (1 if active)
  created_at TIMESTAMP
  updated_at TIMESTAMP
  confirmed_at TIMESTAMP (nullable)
  delivered_at TIMESTAMP (nullable)
  completed_at TIMESTAMP (nullable)
  expires_at TIMESTAMP (7 or 48 days depending on status)

-- Disputes
disputes
  id UUID PRIMARY KEY
  exchange_id UUID (FK to exchanges)
  filed_by_user_id UUID (FK to profiles)
  category TEXT -- 'toy_damaged', 'missing_items', 'no_delivery', 'other'
  description TEXT (max 1000 chars)
  resolution TEXT (nullable) -- 'refund_requester', 'refund_owner', 'close_no_action'
  resolved_at TIMESTAMP (nullable)
  created_at TIMESTAMP

-- Ratings
ratings
  id UUID PRIMARY KEY
  exchange_id UUID (FK to exchanges, unique)
  rating_by_user_id UUID (FK to profiles)
  rating_to_user_id UUID (FK to profiles)
  toy_quality_rating INTEGER (1-5)
  exchange_experience_rating INTEGER (1-5)
  comment TEXT (max 200 chars, nullable)
  created_at TIMESTAMP
  updated_at TIMESTAMP

-- Wishlists
wishlists
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  name TEXT (e.g., "Birthday gifts")
  description TEXT (nullable)
  created_at TIMESTAMP
  updated_at TIMESTAMP

-- Wishlist Items
wishlist_items
  id UUID PRIMARY KEY
  wishlist_id UUID (FK to wishlists)
  category TEXT
  tags TEXT[] (multi-select)
  created_at TIMESTAMP

-- Game Sessions
game_sessions
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  game_type TEXT -- 'shape_sorter', 'memory_match', 'color_clicker'
  completed BOOLEAN
  play_time_seconds INTEGER
  fragment_earned NUMERIC(2,2) -- 0.25 or 0.35 with ad
  watched_ad BOOLEAN
  created_at TIMESTAMP

-- Notification Preferences
notification_preferences
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  notify_exchange_request BOOLEAN (default: true)
  notify_exchange_confirmed BOOLEAN (default: true)
  notify_delivery_reminder BOOLEAN (default: true)
  notify_new_match BOOLEAN (default: true)
  notify_rating_received BOOLEAN (default: true)
  quiet_hours_start TIME (nullable, default: 21:00)
  quiet_hours_end TIME (nullable, default: 08:00)
  email_frequency TEXT -- 'per_event', 'daily_digest', 'off'
  created_at TIMESTAMP
  updated_at TIMESTAMP

-- Analytics: Search Behavior
search_analytics
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  category_filter TEXT[] (nullable)
  age_group_filter TEXT[] (nullable)
  tags_filter TEXT[] (nullable)
  distance_filter INTEGER (nullable)
  result_count INTEGER
  clicked_toy_id UUID (FK to toys, nullable)
  created_at TIMESTAMP

-- Analytics: Wishlist Behavior
wishlist_analytics
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  wishlist_id UUID (FK to wishlists)
  categories_selected TEXT[]
  tags_selected TEXT[]
  created_at TIMESTAMP

-- Analytics: Game Engagement
game_analytics
  id UUID PRIMARY KEY
  user_id UUID (FK to profiles)
  game_type TEXT
  completion_rate NUMERIC(3,2) -- 0.00 to 1.00
  total_plays INTEGER
  total_ads_watched INTEGER
  total_fragments_earned NUMERIC(4,2)
  last_play_at TIMESTAMP
  created_at TIMESTAMP
  updated_at TIMESTAMP

-- Audit Trail (Immutable)
audit_log
  id UUID PRIMARY KEY
  action TEXT -- 'user_registered', 'exchange_completed', 'data_deletion_requested'
  user_id UUID (FK to profiles, nullable for non-auth events)
  details JSONB
  ip_address INET
  user_agent TEXT
  created_at TIMESTAMP (immutable)
```

### 6.3 Database Views (Optimized Queries)

```sql
-- User Profile with Aggregated Ratings
user_profiles_with_ratings
  SELECT profiles.*,
         AVG(r.exchange_experience_rating) as avg_rating,
         COUNT(r.id) as total_ratings
  FROM profiles
  LEFT JOIN ratings r ON profiles.id = r.rating_to_user_id
  GROUP BY profiles.id;

-- Available Toys (Active & Not in Exchange)
available_toys
  SELECT toys.*,
         profiles.location_postal_code as owner_location
  FROM toys
  JOIN profiles ON toys.user_id = profiles.id
  WHERE toys.is_active = true
    AND toys.expires_at > NOW()
    AND toys.id NOT IN (
      SELECT toy_id FROM exchanges
      WHERE status IN ('pending_owner_response', 'exchange_confirmed')
    );

-- User Search Behavior Aggregates (For Ad Targeting)
user_behavioral_aggregates
  SELECT user_id,
         jsonb_object_agg(category, count) as category_searches,
         jsonb_object_agg(tag, count) as tag_searches,
         AVG(result_count) as avg_search_results
  FROM (
    SELECT user_id,
           UNNEST(category_filter) as category,
           COUNT(*) as count
    FROM search_analytics
    WHERE created_at > NOW() - INTERVAL '90 days'
    GROUP BY user_id, category
  )
  GROUP BY user_id;

-- Active Exchanges Summary
user_active_exchanges
  SELECT e.*,
         toys.category as toy_category,
         p.preferred_language as partner_language
  FROM exchanges e
  JOIN toys ON e.toy_id = toys.id
  JOIN profiles p ON CASE
    WHEN e.requester_id = {user_id} THEN e.owner_id = p.id
    ELSE e.requester_id = p.id
  END
  WHERE e.status NOT IN ('exchange_completed', 'closed');
```

### 6.4 API Endpoints (Next.js API Routes)

```
Authentication
POST   /api/auth/register           -- Register new user
POST   /api/auth/login              -- Login (Supabase manages)
POST   /api/auth/logout             -- Logout
POST   /api/auth/verify-email       -- Verify email token
POST   /api/auth/forgot-password    -- Request password reset
POST   /api/auth/reset-password     -- Complete password reset

Toys
POST   /api/toys                    -- Create listing (requires auth)
GET    /api/toys?category=X&tags=Y  -- Search toys (public)
GET    /api/toys/:id                -- Get toy details (public)
PUT    /api/toys/:id                -- Update toy (owner only)
DELETE /api/toys/:id                -- Delete/delist toy (owner only)

Exchanges
POST   /api/exchanges               -- Create exchange request
GET    /api/exchanges               -- Get user's exchanges (auth required)
PUT    /api/exchanges/:id           -- Update exchange status (owner/requester)
POST   /api/exchanges/:id/confirm   -- Confirm delivery (requester)

Wishlists
POST   /api/wishlists               -- Create wishlist
GET    /api/wishlists               -- Get user's wishlists
PUT    /api/wishlists/:id           -- Update wishlist
DELETE /api/wishlists/:id           -- Delete wishlist

Ratings
POST   /api/ratings                 -- Submit rating after exchange
GET    /api/ratings/:user_id        -- Get user's rating history

Games
POST   /api/games/:game_type/play   -- Record game session
GET    /api/games/daily-limit       -- Check remaining daily plays
POST   /api/games/claim-fragment    -- Claim fragment (after ad view)

Notifications
GET    /api/notifications           -- Get unread notifications (auth required)
PUT    /api/notifications/:id       -- Mark as read
PUT    /api/notifications/preferences -- Update notification settings

Profile & GDPR
GET    /api/profile                 -- Get user profile
PUT    /api/profile                 -- Update profile
POST   /api/profile/export-data     -- Export all personal data (JSON)
POST   /api/profile/delete-request  -- Request data deletion (30-day grace)
GET    /api/profile/search-history  -- Export search analytics

Analytics (Internal/Admin Only)
GET    /api/admin/analytics/user-segments   -- Anonymized user segments
GET    /api/admin/analytics/game-engagement -- Game stats
POST   /api/admin/notify-matches    -- Daily matching job (cron-triggered)
```

### 6.5 Real-time Subscriptions (Supabase Realtime)

```typescript
-- In-app notifications (always enabled, no user opt-out)
supabase
  .from(`exchanges:requester_id=eq.${userId}`)
  .on('*', (payload) => {
    // Exchange status update
  })
  .subscribe();

-- Ticket balance updates
supabase
  .from(`tickets:user_id=eq.${userId}`)
  .on('UPDATE', (payload) => {
    // Update balance in UI
  })
  .subscribe();

-- New toy listings in wishlist categories
supabase
  .from(`toys:user_id=neq.${userId}`)
  .on('INSERT', (payload) => {
    // Check if toy matches wishlist; send notification
  })
  .subscribe();
```

### 6.6 Firebase Cloud Messaging (Production Only)

```typescript
// Edge Function triggered on exchange status change
// Sends push notification to user's device
supabase_functions/notify_exchange_status.ts
  - Inputs: exchange_id, new_status, user_id
  - Actions:
    - Check notification_preferences (quiet hours, enabled types)
    - Build notification payload (localized message)
    - Send via Firebase FCM
  - Retry: exponential backoff up to 3 times

// Edge Function for daily wishlist matching
// Runs at 7 AM UTC
supabase_functions/daily_wishlist_matching.ts
  - Scan all wishlists
  - Find new toys matching criteria
  - Create match notifications
  - Send via Supabase Realtime (in-app)
  - Schedule Firebase FCM if not in-app notification seen after 30 min
```

---

## 7. Local Development Environment

### 7.1 Docker-First Development Philosophy

**Core Principle:** The entire application must run locally with zero cloud dependencies. This ensures:
- Fast feedback loop for development
- Offline capability for testing
- Reproducible environment across team
- Easy onboarding for new developers
- Cost-free local testing

### 7.2 Docker Compose Architecture

```yaml
version: '3.8'

services:
  # Supabase Stack (Local)
  supabase-db:
    image: supabase/postgres:15
    environment:
      POSTGRES_PASSWORD: postgres_password
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - supabase-db-data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d

  supabase-studio:
    image: supabase/studio:latest
    ports:
      - "3001:3000"  # Access at http://localhost:3001
    environment:
      SUPABASE_URL: http://supabase-api:3000
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      POSTGRES_PASSWORD: postgres_password

  supabase-api:
    image: supabase/postgrest:latest
    ports:
      - "3000:3000"
    environment:
      PGRST_DB_URI: postgresql://postgres:postgres_password@supabase-db:5432/postgres
      PGRST_DB_SCHEMA: public
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_MAX_ROWS: 10000

  # Next.js Development Server
  nextjs-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"  # Web app at http://localhost:3000
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NEXT_PUBLIC_SUPABASE_URL: http://localhost:3000
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      NODE_ENV: development
    depends_on:
      - supabase-api

  # Mock Email Service (Mailhog)
  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI at http://localhost:8025

  # Mock Firebase Notifications (Console Logger)
  # No container needed; logged to Next.js console

volumes:
  supabase-db-data:

networks:
  default:
    name: toy-for-toy-network
```

### 7.3 Local Development Setup Instructions

```bash
# 1. Clone repository
git clone <repo-url>
cd toy-for-toy

# 2. Copy environment template
cp .env.example .env.local

# 3. Generate secrets (first-time only)
npm run generate-local-secrets  # Generates JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY

# 4. Start Docker stack
docker-compose up -d

# 5. Wait for services to be ready (30 seconds)
# Verify:
#   - Database: psql -h localhost -U postgres -d postgres (password: postgres_password)
#   - Studio: http://localhost:3001
#   - API: curl http://localhost:3000/rest/v1/tables

# 6. Run database migrations
npm run db:migrate:local

# 7. Seed test data (optional)
npm run db:seed:local

# 8. Start Next.js dev server (in new terminal)
npm run dev

# 9. Access application
# Web: http://localhost:3000
# Admin/Studio: http://localhost:3001
# Email (Mailhog): http://localhost:8025
```

### 7.4 Mock Services Configuration

#### Mock Firebase Cloud Messaging
```typescript
// lib/firebase-mock.ts (development only)
export const sendPushNotification = async (
  userId: string,
  message: NotificationPayload
) => {
  // Development: log to console + Supabase logs
  console.log('[FCM Mock]', { userId, message });

  // Also save to notification_events table for testing
  await supabase
    .from('notification_events_mock')
    .insert({
      user_id: userId,
      message: message,
      sent_at: new Date(),
    });
};
```

#### Mock AdMob/AdSense
```typescript
// lib/ads-mock.ts (development only)
export const showRewardedAd = async () => {
  // Development: instant reward
  return {
    status: 'completed',
    reward_type: 'ticket_fragment',
    reward_amount: 0.1,
  };
};
```

### 7.5 Testing & Validation

```bash
# Unit & integration tests
npm test

# E2E tests (Playwright)
npm run test:e2e

# Database migration validation
npm run db:validate

# Schema export (for documentation)
npm run db:export-schema

# Generate TypeScript types from database
npm run generate-types
```

### 7.6 Troubleshooting Local Setup

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `lsof -i :3000` then `kill -9 <PID>` or change port in docker-compose |
| Database won't start | Check Docker disk space: `docker system prune -a` |
| Migrations fail | Verify Postgres is running: `docker-compose logs supabase-db` |
| CORS errors | Ensure API URL matches in `.env.local` |
| Realtime not working | Enable in Supabase Studio (Extension: "realtime") |

---

## 8. GDPR Compliance Plan

### 8.1 Regulatory Framework

**Applicability:**
- GDPR applies (EU-based users)
- CCPA applies (California-based users, future consideration)
- COPPA applies indirectly (parental consent for child-related data)

**Lawful Basis:**
- Processing: Legitimate interests (targeted advertising)
- Special category (children): Parental consent

### 8.2 Data Protection Principles

#### 1. Lawfulness, Fairness, Transparency
- Clear privacy policy (plain language)
- Explicit consent form for behavioral analytics
- Consent checkbox NOT pre-checked
- Right to withdraw consent anytime

#### 2. Purpose Limitation
- Behavioral data collected only for ad targeting
- Not used for automated decision-making
- Not shared with third parties except ad networks
- Sub-processor agreements in place

#### 3. Data Minimization
- Only collect: search filters, wishlist categories/tags, game engagement
- Do NOT collect: child names, birthdates, contact info, toy descriptions
- Behavioral data de-identified (no PII in aggregates)

#### 4. Accuracy
- Users can correct profile information anytime
- Search/wishlist data auto-generated (always accurate)

#### 5. Storage Limitation
- Raw behavioral logs: 90 days
- Aggregated analytics: indefinite
- User accounts: deleted if requested (GDPR right to erasure)
- Audit logs: 12 months (legal requirement)

#### 6. Integrity & Confidentiality
- Encryption in transit (HTTPS)
- Encryption at rest (database default)
- Access control: RLS policies enforce data isolation
- Penetration testing: annual audit

### 8.3 Consent Management

#### Consent Types Collected

1. **Privacy Policy & Terms of Service**
   - Required for account creation
   - Versioned (dated consent record stored)
   - Withdrawal: account deletion only

2. **Behavioral Analytics**
   - Optional (separate checkbox)
   - Covers: search filters, wishlist data, game engagement
   - Withdrawal: immediate; future data not logged
   - Withdrawal does NOT prevent: toy listing, exchanging, gaming

3. **Marketing Emails** (future)
   - Optional
   - Covers: new feature announcements, promotional offers
   - Withdrawal: unsubscribe link in all emails

#### Consent Form Language Example

```
PARENTAL CONSENT: BEHAVIORAL ANALYTICS

We collect information about how you use Toy-for-Toy to improve our
ad targeting. This helps us show you more relevant advertisements.

What we collect:
- Types of toys you search for (categories, tags)
- Your toy preferences (wishlists)
- Games you play and how long you play
- Frequency of activity

What we do NOT collect:
- Names, birthdates, or contact info of you or your children
- Specific toy listings you view
- Who you exchange with

How we use this data:
- Create anonymous segments (e.g., "parents interested in educational toys")
- Share segments with ad partners (Google, Meta)
- Ad partners show relevant ads based on your interests
- Improve our app based on user behavior

Your rights:
- Withdraw consent anytime (Settings → Privacy)
- Request download of your data (Settings → Export Data)
- Request deletion of your data (Settings → Delete Account)
- We delete behavioral data within 30 days of request

By checking this box, you consent to behavioral analytics tracking.
```

### 8.4 Data Subject Rights Implementation

#### Right to Access (Article 15)
```
Endpoint: POST /api/profile/export-data
Returns:
{
  "profile": { email, created_at, language, timezone },
  "exchanges": [ { id, status, created_at, ... } ],
  "ratings": [ { id, rating, ... } ],
  "behavioral_logs": [
    { type: "search", filters: ["category"], timestamp },
    { type: "wishlist", items: ["tag1", "tag2"], timestamp },
    { type: "game", game: "shape_sorter", timestamp }
  ],
  "export_timestamp": "2024-11-14T10:00:00Z",
  "export_valid_until": "2024-11-21T10:00:00Z" (7 days)
}
Format: JSON (portable)
```

#### Right to Erasure (Article 17)
```
Process:
1. User clicks "Delete Account"
2. Email confirmation sent (verify identity)
3. 7-day grace period (can cancel)
4. After 7 days:
   - User record soft-deleted
   - Behavioral logs deleted
   - Exchange history anonymized
   - Toy listings transferred to "System" account (if active exchanges)
   - Audit log entry created (immutable)
5. Confirmation email sent

Exceptions (not deleted):
- Audit trail (legal requirement)
- Anonymized aggregates (no PII)
- Exchange records (parties' right to history)
```

#### Right to Rectification (Article 16)
```
User can update:
- Email address
- Preferred language
- Timezone
- Location postal code

Process:
- Immediate update (no grace period)
- History not kept (current state only)
- No impact on past exchanges/analytics
```

#### Right to Data Portability (Article 20)
```
Endpoint: POST /api/profile/export-data
Format: JSON (standard, machine-readable)
Includes:
- Profile information
- All exchanges & ratings
- Search/wishlist analytics
- Game engagement statistics

Not included (not personal data):
- Toy listings (belong to platform after listing)
- Aggregated analytics (de-identified)
```

#### Right to Restrict Processing (Article 18)
```
Implementation: v2 feature (not MVP)
- User can flag account as "GDPR Restricted"
- Behavioral logging pauses
- Platform features still available (listing, exchanging)
- Restrictions lifted on request

Future: implement account restrictions table
```

### 8.5 Data Retention Policy

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Behavioral logs (raw) | 90 days | For analytics; individual privacy |
| Behavioral aggregates | Indefinite | De-identified; no privacy risk |
| User profile | Until deletion | Account essential |
| Exchanges | 3 years | Legal requirement (consumer rights) |
| Ratings | 3 years | User history; can request deletion |
| Dispute records | 3 years | Legal requirement |
| Audit logs | 12 months | Compliance; security audits |
| Consent records | 7 years | GDPR legal requirement |
| Email logs | 30 days | Troubleshooting only |
| Server logs | 7 days | Performance/security monitoring |

### 8.6 Data Processing Agreement (DPA)

**Supabase (Data Processor)**
- Standard DPA available at https://supabase.com/dpa
- Covers: PostgreSQL database, Auth, Storage, Realtime
- Sub-processors: AWS (hosting), Google (CDN)

**Firebase (Data Processor)**
- Standard DPA available at https://firebase.google.com/terms/data-processing-amendment
- Covers: Cloud Messaging, Crash Reporting (future)
- Sub-processor: Google Infrastructure

**SendGrid (Data Processor)**
- Standard DPA available at https://sendgrid.com/resource/dpa/
- Covers: Email delivery
- Scope: limited to transactional emails (no behavioral data)

### 8.7 Privacy by Design Measures

```
Data Collection Minimization
├─ Only collect: search filters, wishlist items, game engagement
├─ No collection: toy descriptions, exchange partner info, ratings text
├─ Aggregation: behavioral data anonymized immediately
└─ Retention: raw logs deleted after 90 days

Encryption & Pseudonymization
├─ In Transit: TLS 1.3 (HTTPS)
├─ At Rest: PostgreSQL encryption (default)
├─ In Processing: aggregates by category (no user ID mapping)
└─ Storage: RLS policies enforce user isolation

Access Control
├─ RLS Policies: every query filtered by user_id at database layer
├─ Token Validation: JWT verified on every API request
├─ Support Access: read-only; logged audit trail
└─ User Access: can download/delete own data anytime

Transparency
├─ Privacy Policy: plain language, <10 min read
├─ Consent Form: explicit opt-in (not pre-checked)
├─ Data Usage: behavioral analytics only
└─ Rights Explained: access, delete, download all explained
```

### 8.8 International Data Transfers

**Scope:** Supabase (US-based) processes EU user data

**Legal Mechanism:** Standard Contractual Clauses (SCCs)
- Supabase includes SCCs in DPA
- EU users' data transfers lawfully
- Schrems II compliant (annual review)

**Sub-processors:**
- AWS (US): Standard Contractual Clauses
- Google (US): Standard Contractual Clauses

---

## 9. Monetization Strategy

### 9.1 Ad Revenue Model

#### Display Advertising (In-App Banner)
- **Format:** Non-intrusive banners between toy listings
- **Frequency:** 1 ad per 5 listings (rotated view)
- **Targeting:** Behavioral segments based on search history
- **Revenue Model:** CPM (cost per mille) = EUR 2-8 per 1,000 impressions
- **Example:** 1,000 DAU × 5 ad impressions/day = 5,000 impressions/day
  - 150,000 impressions/month × EUR 0.005 CPM = EUR 750/month

#### Rewarded Video Ads (Mini-Games)
- **Format:** Voluntary video ads in/after games
- **Reward:** 0.1 ticket fragment (EUR 0.02-0.05 value)
- **Frequency:** 1 ad per game play (max 5 ads/day)
- **Targeting:** Behavioral; no targeting data needed (users already in app)
- **Revenue Model:** CPV (cost per view) = EUR 0.15-0.50 per view
- **Example:** 1,000 DAU × 2 ad views/day = 2,000 views/day
  - 60,000 views/month × EUR 0.30 CPV = EUR 18,000/month

#### Search Behavior Ad Targeting
- **Monetization:** Share anonymized behavioral aggregates with ad partners
- **Aggregates:** Categories searched, tags searched, engagement patterns
- **Revenue Model:** Data licensing = EUR 50-500/month per segment
- **Conservative estimate:** 20 segments × EUR 100 = EUR 2,000/month

### 9.2 Revenue Projections

**Conservative Scenario (Year 1)**
- Months 1-3: Acquisition focus; low revenue (EUR 500-1,000/month)
- Months 4-6: 500 DAU; EUR 3,000/month (banners + rewarded)
- Months 7-9: 1,000 DAU; EUR 8,000/month
- Months 10-12: 2,000 DAU; EUR 16,000/month
- **Year 1 Total:** EUR 30,000-50,000

**Optimistic Scenario (Year 1)**
- Months 1-3: Organic growth; EUR 2,000/month
- Months 4-6: 1,000 DAU; EUR 8,000/month
- Months 7-9: 3,000 DAU; EUR 25,000/month
- Months 10-12: 5,000 DAU; EUR 40,000/month
- **Year 1 Total:** EUR 100,000+

### 9.3 Ad Partner Integration

**Phase 1 (Development):** Mock ads in local environment
```typescript
// lib/ads-mock.ts
export const showRewardedAd = async () => ({
  status: 'completed',
  reward_amount: 0.1, // ticket fragment
});
```

**Phase 2 (Pre-Production):** AdMob/AdSense sandbox setup
- Sandbox credentials in `.env.production`
- Test ads served (non-monetized)
- Analytics verified

**Phase 3 (Production):** Live ad integration
- Live AdMob account
- Live revenue tracking
- Premium account features

### 9.4 Ad Placement Strategy

**Safe Zones** (User-Friendly)
- Between toy listings (not intrusive)
- After game completion (earned reward)
- In search results sidebar (secondary)
- Avoid: critical paths (checkout, exchanges)

**Avoid Zones**
- During mini-games (players expect uninterrupted gameplay)
- On exchange completion (sensitive moment)
- During dispute resolution (trust-critical)

### 9.5 Revenue Sharing (Future)
- Not in MVP scope
- Creators/influencers: 10-20% of ad revenue driven by their referrals
- Partner brands: sponsored toy categories (future)

---

## 10. MVP Scope & Phasing

### 10.1 Phase 1: Local Development (Weeks 1-8)

**Objective:** Complete, locally-runnable MVP with zero cloud dependencies

**Deliverables:**
- User registration & login (email/password)
- Toy listing & search (with mocked categories/tags)
- Exchange flow (request/accept/confirm)
- Ticket economy (allocation, freezing, release)
- Mini-games (Shape Sorter, Memory Match)
- Mock Firebase notifications (console logging)
- Mock AdMob (instant ad rewards)
- GDPR consent forms & data export
- Internationalization (Polish/German/English)
- Database schema & RLS policies
- Jest unit tests + E2E tests (Playwright)
- Local Docker Compose setup
- Documentation & setup guide

**Out of Scope (Phase 1):**
- Real Firebase Cloud Messaging
- Real AdMob/AdSense integration
- Email notifications (Mailhog mock only)
- Production Supabase deployment
- Mobile app (Capacitor) build
- Advanced analytics dashboards
- Dispute resolution UI (backend only)
- User reviews/ratings system (backend only)
- Wishlist matching engine

**Estimated Effort:** 120-160 hours (single developer) / 60-80 hours (team of 2)

### 10.2 Phase 2: Production Integration (Weeks 9-16)

**Objective:** Deploy to production with real cloud services

**Deliverables:**
- Supabase production setup (Europe region)
- Firebase Cloud Messaging integration
- Google AdMob integration (real account)
- SendGrid email integration
- Vercel deployment (web)
- Supabase Edge Functions (daily matching, notifications)
- Ratings & reviews system (UI)
- Dispute resolution (UI + support workflow)
- Wishlist matching engine (cron job)
- Advanced analytics (user segments, retention metrics)
- Mobile build (Capacitor iOS/Android)
- Performance optimization (image caching, code splitting)
- Security audit (penetration testing)
- GDPR audit (compliance verification)

**Out of Scope (Phase 2):**
- Local community management (future)
- In-app chat/messaging (future)
- Subscription tiers (future)
- Gamification rewards (beyond mini-games)
- Social features (sharing, referrals)

**Estimated Effort:** 120-160 hours (team of 2-3)

### 10.3 Phase 3: Scaling & Enhancement (Weeks 17+)

**Future roadmap (not in MVP):**
- Local community groups
- In-app messaging (chat)
- User profiles with reviews
- Wish fulfillment matching (ML-based)
- Subscription tiers (premium features)
- Gamification (badges, leaderboards)
- Social sharing (referral program)
- Content creators (influencer payouts)
- Marketplace (brand partnerships)
- Sustainability metrics (toys saved from landfill)

---

## 11. Success Metrics & Analytics

### 11.1 Key Performance Indicators (KPIs)

#### User Acquisition
- **Monthly Active Users (MAU):** Target 5,000 by end of Year 1
- **Daily Active Users (DAU):** Target 1,000 by Month 6
- **Cost per User Acquisition (CPA):** EUR 0.50-2.00 (organic only in MVP)
- **Sign-up Conversion Rate:** >15% (landing page → registered user)
- **Email Verification Rate:** >90% (registered → verified email)

#### Engagement
- **Daily Engagement Rate:** >40% (DAU / MAU)
- **Exchange Completion Rate:** >80% (requests accepted → exchanged confirmed)
- **Exchange Resolution Time:** Median 5 days (pending → confirmed)
- **Mini-Game Play Frequency:** 2+ plays per user per week
- **Toy Listing Frequency:** 3+ listings per user per month
- **Wishlist Creation Rate:** >30% of users have 1+ wishlist

#### Retention
- **30-Day Retention:** >40% (users active on day 30)
- **90-Day Retention:** >20% (users active on day 90)
- **Churn Rate:** <3% per month
- **Repeat Exchange Rate:** >60% (users with 2+ exchanges)

#### Monetization
- **Average Revenue Per User (ARPU):** EUR 0.50-1.00/month
- **Ad Impression CTR:** >2% (banner ads)
- **Rewarded Ad Completion Rate:** >80% (users watch to end)
- **Cost per Mille (CPM):** EUR 2-8 (display ads)
- **Cost per View (CPV):** EUR 0.15-0.50 (rewarded ads)
- **Monthly Recurring Revenue (MRR):** EUR 2,500-5,000 (Month 6 target)

#### Compliance & Trust
- **GDPR Complaint Rate:** <1% of MAU
- **Data Deletion Requests:** <5% of MAU
- **Dispute Rate:** <2% of completed exchanges
- **User Trust Score:** >4.0 / 5.0 (from surveys, target)
- **Support Ticket Resolution Time:** <48 hours

### 11.2 Analytics Implementation

#### Event Tracking (Behavioral)
```typescript
// Example events to track (via Supabase analytics table)
- user:registered
- toy:listed
- search:performed { category, tags, result_count }
- exchange:requested
- exchange:confirmed
- exchange:completed
- rating:submitted { quality, experience }
- game:played { game_type, completion_time }
- game:ad_watched
- notification:received
- notification:clicked

// Non-tracked (privacy):
- exchange partner names/contact info
- specific toys searched
- rating comments
- toy descriptions
```

#### Dashboards (Future - Phase 2)
```
Admin Dashboard
├─ User Growth
│  ├─ Daily/Weekly/Monthly sign-ups
│  ├─ Active users (DAU/WAU/MAU)
│  └─ Retention curves
├─ Engagement
│  ├─ Exchange completion rates
│  ├─ Mini-game stats
│  └─ Search patterns
├─ Monetization
│  ├─ Ad impressions & CTR
│  ├─ Revenue by source
│  └─ ARPU trend
└─ Operations
   ├─ Dispute rate
   ├─ Support tickets
   └─ System health

Analytics Dashboard (Public - Insights Page)
├─ Ecosystem Stats
│  ├─ Total exchanges completed
│  ├─ Toys exchanged
│  ├─ Tickets distributed
│  └─ CO2 saved (estimate)
└─ Your Stats
   ├─ Your exchanges
   ├─ Your ratings
   └─ Your mini-game stats
```

---

## 12. Risk Assessment

### 12.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Supabase RLS policies misconfigured | Medium | High | Unit tests for RLS; peer review; monthly audit |
| Real-time subscriptions unreliable | Low | Medium | Implement fallback polling; monitor heartbeat |
| Image upload slow on mobile | Medium | Medium | Compress on client; show progress bar; async upload |
| Database query performance degrades | Low | High | Index strategy; query optimization; load testing |
| Capacitor builds fail on production | Low | High | Test builds weekly; maintain build logs; CI/CD automation |
| Firebase FCM integration breaks | Low | Medium | Mock in development; test on staging; graceful degradation |

### 12.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Ad revenue lower than projected | Medium | High | Diversify revenue (future: subscriptions); optimize ad placement |
| User acquisition slower than expected | Medium | High | Marketing strategy (referral, PR); organic SEO; partnerships |
| Competitor enters market | Low | High | Focus on GDPR/privacy as differentiator; community building |
| Churn rate higher than target | Medium | High | Retention campaigns; improved onboarding; engagement gamification |
| Toy scarcity (not enough listings) | Low | Medium | Seed initial inventory; partnerships with toy libraries |

### 12.3 Legal & Compliance Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| GDPR violation (data breach) | Low | Critical | Encryption; RLS; regular security audits; incident response plan |
| Unauthorized toy exchanges (stolen items) | Low | Medium | Verify user identity; rating system; dispute resolution |
| Liability for defective toys | Low | High | Clear TOS; "as-is" disclaimers; insurance (future) |
| Child safety concern (grooming/exploitation) | Low | Critical | No direct messaging (future); parental controls; moderation |
| Payment fraud (no payment planned, but future) | N/A | N/A | Not applicable (no monetary transactions in MVP) |
| Data breach notification (GDPR requirement) | Low | High | Incident response plan; breach timeline (72 hours); notification template |

### 12.4 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Downtime during critical operation | Low | Medium | Supabase SLA (99.5%); manual failover plan; backup verification |
| Support team overwhelmed | Medium | Medium | Automated responses; FAQ; ticketing system; hiring plan |
| Bugs in production (data loss) | Low | High | Comprehensive testing; staging environment; database backups |
| Key team member unavailable | Low | Medium | Documentation; code reviews; knowledge sharing; cross-training |

---

## 13. Development Roadmap

### 13.1 Timeline Overview

```
Phase 1: Local Development (8 weeks)
├─ Week 1-2: Setup & Auth
├─ Week 2-3: Toy Listing & Search
├─ Week 4: Exchange Flow
├─ Week 5: Mini-Games
├─ Week 6: Notifications & Preferences
├─ Week 7: GDPR & Analytics
└─ Week 8: Testing & Documentation

Phase 2: Production Integration (8 weeks)
├─ Week 9-10: Supabase Setup & Firebase
├─ Week 11: Email & Notifications
├─ Week 12-13: Ratings & Disputes
├─ Week 14: Wishlist Matching Engine
├─ Week 15: Analytics Dashboards
└─ Week 16: Security & Compliance Audit

Phase 3: Launch & Scaling
├─ Marketing Campaign
├─ Beta Testing (1,000 users)
├─ Public Launch
└─ Ongoing Optimization
```

### 13.2 Detailed Milestone Timeline

#### Phase 1 Milestones

**Week 1-2: Project Setup & Authentication**
- [ ] Repository setup (monorepo structure)
- [ ] Docker Compose configuration (Supabase stack)
- [ ] Environment variables & secrets
- [ ] User registration endpoint (email/password validation)
- [ ] Email verification workflow (6-digit code)
- [ ] Login endpoint (Supabase JWT)
- [ ] Password reset flow (email token)
- [ ] Session management (token refresh)
- [ ] Consent form & GDPR data collection
- [ ] Tests: 30+ unit tests for auth
- **Definition of Done:** User can register, verify email, login, reset password

**Week 2-3: Toy Listing & Search**
- [ ] Toy data model (category, tags, age_group, condition, images)
- [ ] Image upload to Supabase Storage (RLS policies)
- [ ] Toy creation endpoint (cost 1 ticket, validation)
- [ ] Search endpoint (filter by category, tags, age_group, distance)
- [ ] Search UI with multi-select filters
- [ ] Toy detail page (photos, tags, condition)
- [ ] Toy listing management (edit, delete, expire)
- [ ] Search behavior analytics logging
- [ ] Database migrations (toys, images tables)
- [ ] Tests: 50+ tests for listing & search
- **Definition of Done:** User can list toy, search by filters, view details

**Week 3-4: Exchange Flow**
- [ ] Exchange request endpoint (1 ticket frozen in escrow)
- [ ] Exchange acceptance (owner response)
- [ ] Exchange decline (return ticket to requester)
- [ ] Exchange confirmation (delivery method agreed)
- [ ] Delivery confirmation (requester marks received)
- [ ] Auto-expiration (7 days pending owner, 48h pending delivery)
- [ ] Exchange history (user can view past exchanges)
- [ ] Status tracking UI (pending, confirmed, completed, closed)
- [ ] Notification on exchange state changes
- [ ] Database migrations (exchanges, escrow tracking)
- [ ] Tests: 60+ tests for exchange lifecycle
- **Definition of Done:** Users can request, confirm, and complete exchanges; tickets frozen/released correctly

**Week 5: Mini-Games**
- [ ] Shape Sorter game (React component, Tailwind)
- [ ] Memory Match game
- [ ] Color Clicker game
- [ ] Game session tracking (play_time, completion)
- [ ] Fragment allocation (0.25 per game, 0.1 per ad)
- [ ] Fragment-to-ticket conversion (at 1.0 threshold)
- [ ] Daily limit enforcement (5 plays per day)
- [ ] Game UI (instructions, score, rewards)
- [ ] Rewards display (fragments earned)
- [ ] Tests: 30+ tests for game mechanics
- **Definition of Done:** User can play games, earn fragments, see ticket increase

**Week 6: Notifications & Preferences**
- [ ] In-app notifications (Supabase Realtime)
- [ ] Notification preferences (by type, quiet hours)
- [ ] Notification history (user can view past)
- [ ] Mark as read functionality
- [ ] Settings page (notification toggles, quiet hours)
- [ ] Mock push notifications (console logging for FCM)
- [ ] Mock email notifications (Mailhog integration)
- [ ] Tests: 25+ tests for notifications
- **Definition of Done:** Notifications delivered in-app; user preferences respected

**Week 7: GDPR & Analytics**
- [ ] Consent tracking (consent_records table)
- [ ] Behavioral analytics logging (search, wishlist, games)
- [ ] Data export endpoint (JSON download)
- [ ] Data deletion request workflow (30-day grace)
- [ ] Privacy policy page
- [ ] Internationalization setup (next-intl)
- [ ] Translations (Polish, German, English)
- [ ] Language switcher UI
- [ ] Locale-specific formatting (dates, numbers)
- [ ] Tests: 20+ tests for GDPR
- **Definition of Done:** User can access privacy policy, consent to analytics, export/delete data in 3 languages

**Week 8: Testing & Documentation**
- [ ] Jest tests (80%+ coverage)
- [ ] E2E tests (Playwright) for key user journeys
- [ ] Database schema documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Setup guide (Docker Compose, local development)
- [ ] Troubleshooting guide
- [ ] Architecture diagram
- [ ] Database diagram
- [ ] Code review & refactoring
- [ ] Performance optimization
- **Definition of Done:** All automated tests pass; documentation complete; ready for Phase 2

---

## 14. Frequently Asked Questions (FAQ)

### User/Parent Questions

**Q: Is my child's data safe?**
A: Yes. We do NOT store your child's name, birthdate, or contact information. We only store your (parent) account information and your toy preferences. All data is encrypted and protected by EU data privacy laws (GDPR).

**Q: How do I know if a toy is safe?**
A: All toy exchanges are based on the rating system. Parents rate the quality of received toys and the reliability of exchange partners. Toys with low ratings are flagged for review. We recommend inspecting toys upon receipt, just as you would with used items.

**Q: Can I cancel an exchange?**
A: Yes, before the toy owner accepts your request (7-day window). After acceptance, you can file a dispute if the toy arrives in worse condition than advertised.

**Q: Do I have to watch ads?**
A: For mini-games, watching ads is optional and earns bonus fragments. Regular app usage shows contextual ads (like most free apps). You can opt out of behavioral ad targeting anytime.

**Q: How do I delete my account and data?**
A: Go to Settings → Privacy → Delete Account. We'll ask for email confirmation, then delete all your data within 30 days. Some anonymized data may remain for analytics, but no personally identifiable information.

### Developer Questions

**Q: Can I run the app offline?**
A: Partially. Local Docker setup allows registration, browsing, and games offline. Exchanges and notifications require internet (Supabase connection).

**Q: How do I test exchanges locally?**
A: Create two test user accounts, list toys on both, then exchange. The ticket freezing/release happens automatically. Check the database to verify escrow.

**Q: How do I generate translated strings?**
A: Use `npm run i18n:extract` to generate keys from source code, then translate in `/public/locales/{locale}/common.json`. Use `npm run i18n:validate` to check completeness.

**Q: Is Supabase safe for production?**
A: Yes. Supabase uses AWS infrastructure, SOC 2 certified, automatic backups, and encryption. For EU compliance, deploy in Europe region (supabase.co/eu-west-1).

**Q: How do I add new categories/tags?**
A: Categories and tags are hardcoded in the database seed and frontend. To add new ones:
1. Add to `supabase/seed.sql`
2. Update frontend enum in `lib/types.ts`
3. Run `npm run db:seed:local` to reload

---

## 15. Appendices

### A. Glossary

| Term | Definition |
|------|-----------|
| **Ticket** | Digital token representing 1 toy exchange; non-monetary |
| **Escrow** | Frozen tickets during active exchange; released upon completion |
| **Fragment** | Partial ticket (0.25); earned from mini-games; auto-converts at 1.0 |
| **Wishlist** | Saved search preferences; triggers notifications on matches |
| **RLS** | Row-Level Security; database policy enforcing user isolation |
| **Edge Function** | Serverless function running on Supabase edge nodes |
| **DAU** | Daily Active Users |
| **MAU** | Monthly Active Users |
| **ARPU** | Average Revenue Per User |
| **CPM** | Cost Per Mille (per 1,000 ad impressions) |
| **CPV** | Cost Per View (per ad watch) |
| **GDPR** | General Data Protection Regulation (EU privacy law) |
| **DPA** | Data Processing Agreement |
| **SLA** | Service Level Agreement |

### B. External Resources

**Documentation:**
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- Capacitor: https://capacitorjs.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- next-intl: https://next-intl-docs.vercel.app/

**Privacy & Compliance:**
- GDPR: https://gdpr-info.eu/
- COPPA: https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
- SendGrid DPA: https://sendgrid.com/resource/dpa/
- Supabase DPA: https://supabase.com/dpa
- Firebase DPA: https://firebase.google.com/terms/data-processing-amendment

**Tools & Services:**
- Firebase Console: https://console.firebase.google.com
- Supabase Dashboard: https://app.supabase.com
- Vercel Dashboard: https://vercel.com/dashboard
- Google AdMob: https://admob.google.com

### C. Example Environment Variables (.env.local)

```bash
# Supabase (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (generate with: openssl rand -hex 32)
NEXTAUTH_SECRET=your_generated_secret_here

# Firebase (Mock in Phase 1, Real in Phase 2)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=toy-for-toy-dev
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Email (Mock: Mailhog in Phase 1)
SENDGRID_API_KEY=SG.xxxxxx_Phase_2_only
MAILHOG_SMTP_HOST=localhost
MAILHOG_SMTP_PORT=1025

# App Configuration
NEXT_PUBLIC_APP_NAME=Toy-for-Toy
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_SUPPORT_EMAIL=support@toy-for-toy.local
NODE_ENV=development
```

### D. Database Schema SQL (Core Example)

```sql
-- Core table creation (simplified for brevity)

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en',
  location_postal_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 10,
  frozen_listing_tickets INTEGER DEFAULT 0,
  frozen_escrow_tickets INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS toys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL,
  age_group TEXT,
  condition TEXT,
  location_postal_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX idx_toys_category ON toys(category) WHERE is_active = true;
CREATE INDEX idx_toys_user_id ON toys(user_id);
CREATE INDEX idx_toys_created_at ON toys(created_at DESC);

-- RLS Policy (Example)
ALTER TABLE toys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active toys" ON toys
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own toys" ON toys
  FOR ALL USING (auth.uid() = user_id);
```

---

## 16. Document Control

**Document Information:**
- **Document ID:** PRD-TOY-FOR-TOY-001
- **Version:** 1.0
- **Last Updated:** November 14, 2024
- **Status:** Active
- **Owner:** Product Management
- **Reviewers:** Engineering Team, Legal (GDPR), Business

**Change Log:**
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 14, 2024 | Initial comprehensive PRD; Phases 1-2 detailed |

**Next Review:** December 14, 2024 (post-Phase 1)

---

**End of Product Requirements Document**
