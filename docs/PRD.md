# Product Requirements Document: Toy-for-Toy
## Cashless, GDPR-Compliant Toy Exchange Platform

**Document Version:** 1.0
**Last Updated:** November 13, 2025
**Status:** MVP Specification
**Prepared For:** Development Team, Stakeholders, Compliance Partners

---

## Executive Summary

Toy-for-Toy is a mobile and web-based platform that enables parents to exchange children's toys through a closed-loop, ticket-based economy system with zero monetary transactions between users. The platform monetizes through targeted advertising and rewarded mini-games while maintaining GDPR compliance for child data protection.

### Vision
To create a sustainable, eco-friendly, and economically fair toy-sharing ecosystem that reduces waste, extends toy lifecycles, and provides children with access to diverse toys without creating parental financial burden or platform dependency on user payments.

### Primary Business Goals
1. **Build a self-sustaining, ad-supported marketplace** with 10,000+ active monthly users within 12 months
2. **Achieve GDPR compliance certification** ensuring legal operation across EU markets
3. **Generate predictable ad revenue** of EUR 15K-25K monthly at scale (from display ads and rewarded video completion rates)
4. **Maximize user engagement** through retention-focused mini-games and smart matching algorithms
5. **Establish trusted toy exchange community** with 95%+ positive user feedback and <2% fraud/dispute rate

### Target Market
- **Primary Users:** Parents aged 30-55 in EU (initially Poland, expanding to Germany and English-speaking regions)
- **Secondary Users:** Children aged 4-14 (as participants, not direct users)
- **Segment Focus:** Eco-conscious, cost-aware families; parents seeking sustainable consumption alternatives

### Success Metrics (MVP Phase)
- 5,000 active monthly users (first 6 months)
- 2,000 completed exchanges per month (steady state)
- 40%+ monthly active user engagement rate
- 95%+ delivery confirmation completion rate
- <2% fraud/dispute escalations
- EUR 3K-5K monthly ad revenue (early stage)

---

## Product Overview

### Problem Statement
1. **Economic Barrier:** Parents struggle with rising toy costs; children lose interest quickly, creating waste
2. **Storage & Waste:** Homes accumulate unused toys; 90% end up in landfills annually
3. **Fairness & Trust:** Traditional gift economies lack mechanism to track "fairness" of exchanges
4. **Child Privacy Risk:** Most toy-sharing platforms lack robust child data protection

### Product Solution
Toy-for-Toy solves these through:
- **Ticket Economy:** Fair 1:1 exchange model removes monetary value, eliminating bargaining friction
- **Closed Loop System:** No cash out; tickets stay in ecosystem, creating sustainable engagement cycle
- **Smart Matching:** Algorithmic pairing of toy availability with wishlist preferences reduces friction
- **Parental Controls:** Built-in consent, visibility, and data deletion workflows for GDPR compliance

### Platform Positioning
- **Not a marketplace:** No buying/selling of toys for money
- **Not a gift economy:** Expects reciprocity through 1:1 ticket system
- **Not a storage service:** Toys must be active (listed or exchanged) to remain on platform
- **Ad-supported social exchange:** Community-driven with targeted monetization layer

---

## User Personas

### Primary User: Elena (Parent, 38)
**Goals:**
- Find toys her children enjoy without large spending
- Reduce household clutter sustainably
- Trust that exchanges are fair and delivery is secure

**Pain Points:**
- Overwhelmed with unused toys at home
- Concerned about child safety in online exchanges
- Skeptical of marketplace fairness for toy trading

**Engagement Pattern:** 3-4 times per week; exchanges toys for different age/interest groups

### Secondary User: Marcus (Parent/Tech-Savvy, 42)
**Goals:**
- Teach children environmental responsibility
- Access to premium/niche toys through equal exchange
- Minimize shipping costs and logistical complexity

**Pain Points:**
- Frustrated with damaged toys from shipping
- Concerns about meeting sellers in person
- Complexity of managing multiple exchanges simultaneously

**Engagement Pattern:** 1-2 times per week; strategic planner of exchanges

### Tertiary User: Sofia (Child, 7)
**Goals:**
- Play with diverse toys without parent buying new ones
- Earn rewards through mini-games (gamification engagement)
- Share toy preferences with parents

**Pain Points:**
- Can't directly control toy selection (parental mediation)
- Wants immediate gratification (shipping delays frustrate)
- Limited understanding of exchange fairness

**Engagement Pattern:** 2-3 times per week for games and wishlist creation

---

## User Stories & Acceptance Criteria

### Epic 1: User Onboarding & Profile Management

**US1.1: Parent Registration & Consent**
```
As a parent
I want to register with my email and set up parental controls
So that I can manage my children's toy exchanges securely and compliantly
```
**Acceptance Criteria:**
- [ ] Sign-up flow: Email → Password → Parental Consent → Child Profile Creation
- [ ] Explicit GDPR consent checkbox with link to full privacy policy
- [ ] Option to select data processing level (minimal tracking vs. personalized ads)
- [ ] Consent receipt saved to account (audit trail for compliance)
- [ ] Multi-child account support (add/remove children anytime)
- [ ] Two-factor authentication optional but recommended

**US1.2: Child Profile Setup**
```
As a parent
I want to create profiles for each child with age and interests
So that the system can recommend matching toys accurately
```
**Acceptance Criteria:**
- [ ] Fields: Child name, birthdate, interests (multi-select tags), allergies/safety notes
- [ ] Parent explicitly confirms: "I have parental authority and consent to share this data"
- [ ] Child interests use predefined taxonomy (not free-text) to standardize matching
- [ ] Age group auto-calculated and displayed (0-3, 4-7, 8-12, 13+)
- [ ] Parent can hide child profile at any time (not permanent deletion during MVP)
- [ ] Parental email receives confirmation of each profile created

**US1.3: Initial Ticket Allocation**
```
As a new user
I want to understand my starting ticket balance
So that I know how many toys I can request immediately
```
**Acceptance Criteria:**
- [ ] New parent accounts receive 3 starter tickets (not earned, promotional)
- [ ] Allocation displays with explanation: "3 free tickets to get started"
- [ ] Cannot use tickets until first toy is listed (forces bidirectional participation)
- [ ] Tickets appear in wallet with clear "pending activation" status
- [ ] User receives email with ticket explanation and tutorial link

### Epic 2: Toy Listing & Inventory Management

**US2.1: List a Toy**
```
As a parent
I want to list a toy with photos, condition, and category tags
So that other parents can find and request it
```
**Acceptance Criteria:**
- [ ] Form fields: Toy name, description, condition (like-new/good/fair/poor), category, tags, age range
- [ ] Photo upload: Minimum 1 photo, maximum 5, with compression (max 2MB each)
- [ ] Category dropdown (toys, books, games, sports, pretend-play, etc.)
- [ ] Tags auto-complete from predefined list (e.g., "building blocks" tag under "Toys" category)
- [ ] Condition selector with image examples for clarity
- [ ] Age range multi-select (system suggests based on toy category)
- [ ] Listing costs 1 ticket (deducted upon submission)
- [ ] Confirmation: "Toy listed! You've earned 1 ticket when it's exchanged"
- [ ] Toy appears in "My Active Listings" immediately (pending moderation)
- [ ] 24h moderation window; toy hidden from search if not approved

**US2.2: Manage Active Listings**
```
As a parent
I want to view, edit, and delist toys from my inventory
So that I can keep my listings accurate and remove items I no longer want to share
```
**Acceptance Criteria:**
- [ ] Dashboard shows: Active listings, Pending exchanges, Completed exchanges, Deactivated toys
- [ ] Edit listing: Update photos, description, condition, tags (not after exchange initiated)
- [ ] Delist toy: Available if no active exchange; immediate removal from search
- [ ] View listing analytics: Times viewed, Wishlisted by X users, Requests received
- [ ] Bulk actions: Delist multiple toys at once

**US2.3: Toy Moderation & Safety**
```
As a platform
I want to moderate toy listings for safety and appropriateness
So that only age-appropriate, safe toys are exchanged
```
**Acceptance Criteria:**
- [ ] Moderation queue visible to staff only
- [ ] Criteria: Age-appropriate, no prohibited items (weapons, choking hazards, recalls), clear photos
- [ ] Automated reject triggers: Photos with faces, adult items, non-toys
- [ ] Moderator can approve/reject with optional feedback message to user
- [ ] Rejected toys: User receives email explanation and can resubmit after correction
- [ ] Approved toys indexed and searchable within 1 hour of approval

---

### Epic 3: Smart Wishlist & Matching Engine

**US3.1: Create & Manage Wishlist**
```
As a parent
I want to add toys to a wishlist for my child
So that the system can notify me when matching toys become available
```
**Acceptance Criteria:**
- [ ] Wishlist creation per child profile
- [ ] Add toys via: Search catalog, Browse categories, Scan toy photos (future)
- [ ] Add custom wish: "Blue LEGO set" (free-text) with optional category/tag suggestions
- [ ] Max 50 items per child wishlist (prevents abuse)
- [ ] Display wishlist in priority order (drag-to-reorder)
- [ ] Remove/archive wishlist items with single click
- [ ] Wishlist privacy: Hidden from other users (not public)
- [ ] Share wishlist with partner parent via link (optional feature, Phase 2)

**US3.2: Smart Matching Algorithm**
```
As a user
I want the system to notify me when toys matching my child's interests become available
So that I discover relevant exchanges without manual searching
```
**Acceptance Criteria:**
- [ ] Matching runs daily at 2 AM UTC (low-load time)
- [ ] Score function: Tags match (40%), Age range match (30%), Condition preference (20%), Recency bonus (10%)
- [ ] Match threshold: Minimum 60% similarity to trigger notification
- [ ] Results: Top 3 matching toys per child per day (prevents notification spam)
- [ ] Notification timing: Digest delivered once per day (not real-time) unless user selects "instant"
- [ ] Analytics: Track which matches convert to requests (optimization metric)
- [ ] User can disable matching for any child anytime (preference setting)

**US3.3: Manual Toy Discovery**
```
As a parent
I want to browse and search for toys to request
So that I can find specific toys or discover serendipitous exchanges
```
**Acceptance Criteria:**
- [ ] Search bar with autocomplete (searches: Toy name, description, category, tags)
- [ ] Filter by: Category, Age range, Condition, Last listed date
- [ ] Sort by: Newest first, Popularity (wishlist count), Condition, Relevance
- [ ] Browse by category hierarchy: "Toys" → "Building Blocks" (with tag filters)
- [ ] Toy detail view: Photos, description, condition, lister profile, request button
- [ ] "Similar toys" recommendations at bottom of detail view
- [ ] Infinite scroll or pagination (20 toys per page)
- [ ] Save search filters (remember user preferences)

---

### Epic 4: Exchange & Escrow System

**US4.1: Request a Toy**
```
As a parent
I want to request a toy from another parent's listing
So that I can initiate an exchange
```
**Acceptance Criteria:**
- [ ] Request button on toy detail view (only if user has tickets)
- [ ] Select which child the toy is for (dropdown from child profiles)
- [ ] Add optional message to lister (e.g., "My daughter loves cars!")
- [ ] Confirmation: "You're about to spend 1 ticket. Proceed?"
- [ ] Upon request: 1 ticket debited from user account (deducted immediately)
- [ ] Lister receives notification: "New request for [Toy]! [Parent name] has X completed exchanges"
- [ ] Requester sees exchange in "My Pending Requests" with status "awaiting response"
- [ ] Status transitions: pending_request → accepted → in_transit → delivered → confirmed → completed
- [ ] Timeout: If lister doesn't respond in 48h, request auto-cancels and ticket refunded

**US4.2: Accept/Decline Exchange Request**
```
As a toy lister
I want to accept or decline requests for my toy
So that I maintain control over who receives my items
```
**Acceptance Criteria:**
- [ ] Notification shows requester's: Name, profile badge (completed exchanges count), message
- [ ] Accept button: "Accept & Arrange Delivery"
- [ ] Decline button: "Decline" (requester's ticket refunded)
- [ ] Upon accept: Both users enter exchange flow; toy marked "unavailable" in listings
- [ ] Escrow triggered: Requester's 1 ticket frozen; lister "earns" 1 pending ticket
- [ ] Both users see: Exchange ID, partner profile, next steps (arrange delivery)
- [ ] In-app messaging enabled between parties for coordination

**US4.3: Escrow & Ticket Freezing**
```
As the platform
I want to hold tickets in escrow during exchange
So that neither party can reverse the transaction unfairly
```
**Acceptance Criteria:**
- [ ] Requester's ticket frozen upon acceptance (visible in wallet as "frozen")
- [ ] Lister's earned ticket frozen until delivery confirmed (visible as "pending")
- [ ] Frozen tickets cannot be used for other exchanges
- [ ] If either party disputes, frozen tickets remain locked (admin review)
- [ ] Database schema: exchanges table with status enum (pending_request, accepted, in_transit, delivered, confirmed, completed, disputed, canceled)
- [ ] RLS policy: Users can only see their own exchanges; disputes visible to admins only
- [ ] Timeout logic: If no delivery confirmation within 7 days, auto-complete and release tickets

**US4.4: Delivery & Confirmation**
```
As a parent
I want to confirm delivery of a toy I received
So that the exchange completes and tickets are released
```
**Acceptance Criteria:**
- [ ] Upon toy arrival, requester clicks "Confirm Delivery Received"
- [ ] Confirmation dialog: "I confirm I received the toy in [condition]" (required field)
- [ ] Condition options: Like listed, Minor wear, Significant damage, Item missing/incomplete
- [ ] Photos optional but encouraged (upload up to 2 photos of delivered item)
- [ ] Upon confirmation:
  - [ ] Requester's frozen ticket is consumed (removed from wallet)
  - [ ] Lister's pending ticket is released (added to wallet)
  - [ ] Exchange marked "completed" with timestamp
  - [ ] Both parties receive completion email with option to rate each other
- [ ] If recipient reports damage/mismatch: Exchange marked "disputed" for admin review
- [ ] Dispute timeline: Must be reported within 7 days of confirmation

**US4.5: Auto-Completion Timeout**
```
As the platform
I want to auto-complete exchanges after 7 days to prevent indefinite locks
So that tickets are released and users can continue exchanging
```
**Acceptance Criteria:**
- [ ] If recipient doesn't confirm delivery within 7 days of "in_transit", auto-complete
- [ ] Auto-completion triggers: Email notification to recipient before (48h warning)
- [ ] Upon auto-completion:
  - [ ] Lister's pending ticket released
  - [ ] Recipient receives email: "Your exchange auto-completed. Confirm delivery within 48h if needed."
- [ ] If auto-completion occurs, recipient loses opportunity to report damage (strict timeout)
- [ ] Exchange marked "auto_completed" (system flag for analytics)

---

### Epic 5: Mini-Games & Rewards

**US5.1: Daily Mini-Game Access**
```
As a child
I want to play daily mini-games to earn ticket fragments
So that I can contribute to my family's toy exchange capability
```
**Acceptance Criteria:**
- [ ] Access "Games" tab from main navigation
- [ ] Display: 3 available games, game descriptions, fragment reward amounts
- [ ] Daily reset: One play per game per child per calendar day (UTC timezone)
- [ ] Game categories: Puzzle (match colors), Memory (flip cards), Trivia (toy facts)
- [ ] Each game takes 2-5 minutes to complete
- [ ] Completion triggers: "You earned 0.5 ticket fragments! (1 fragment = 0.25 of a ticket)"
- [ ] Parental control: Parent can disable games for any child anytime
- [ ] Game analytics: Track completion rate, time spent, engagement metrics

**US5.2: Rewarded Video Ads**
```
As a game player
I want the option to watch a video ad to earn bonus fragments
So that I have an additional earning mechanism without payment
```
**Acceptance Criteria:**
- [ ] After game completion: "Watch a video for +0.25 bonus fragments?"
- [ ] Video ad served by Google AdMob (pre-configured network)
- [ ] Ad video must be watched completely (skip button disabled after 5s)
- [ ] Completion: Fragments credited immediately; UI feedback: "Ad watched! +0.25 fragments added"
- [ ] Frequency cap: Maximum 2 rewarded videos per game per child per day
- [ ] Failed video load: Graceful fallback (still award fragments, no ad shown)
- [ ] GDPR: Ad targeting uses only age/interests; no PII or location data

**US5.3: Fragment-to-Ticket Conversion**
```
As a user
I want to convert ticket fragments to whole tickets
So that I can use earnings toward toy requests
```
**Acceptance Criteria:**
- [ ] Conversion rate: 4 fragments = 1 ticket (clear ratio)
- [ ] Manual conversion: User clicks "Redeem" in wallet (no automatic conversion)
- [ ] Conversion history: Visible in transaction log with timestamps
- [ ] Minimum redemption: 1 fragment must accumulate before "Redeem" button appears
- [ ] Redemption restrictions: Cannot redeem below 1 total fragment (anti-gaming)
- [ ] Converted tickets appear in wallet immediately with source: "Earned from games"
- [ ] Analytics: Track conversion rate and fragment accumulation per user cohort

**US5.4: Game Moderation & Child Safety**
```
As a platform
I want to ensure games are age-appropriate and don't expose children to harmful content
So that parents trust the gaming experience
```
**Acceptance Criteria:**
- [ ] Games content reviewed by team before launch
- [ ] No ads shown to children under 6 (only unlocked at age 7+)
- [ ] Ad content filtering: Only G-rated, family-appropriate ads served
- [ ] Session limits: Optional parental control to cap game time (e.g., 15 min/day)
- [ ] Games tested for accessibility (color blind, hearing impaired modes)
- [ ] COPPA/GDPR compliance: No data tracking beyond basic play metrics

---

### Epic 6: Notifications & Communication

**US6.1: Smart Notifications**
```
As a user
I want to receive timely notifications about toy matches and exchange status
So that I stay informed without being overwhelmed
```
**Acceptance Criteria:**
- [ ] Notification types: Match found, Request received, Exchange status update, Game reward earned, Account alert
- [ ] Delivery channels: In-app (notification center), Email, Push notification (mobile)
- [ ] Frequency control: User can set per-notification-type (instant, daily digest, weekly, never)
- [ ] Smart timing: Email digests sent at user's preferred time (configurable)
- [ ] Push notifications: Firebase FCM, triggered by Supabase Edge Function
- [ ] Do-not-disturb: Quiet hours (e.g., 9 PM - 8 AM) respected for push notifications
- [ ] Unsubscribe link in every email (compliant with CAN-SPAM)

**US6.2: In-App Messaging (Exchange Coordination)**
```
As an exchange participant
I want to message the other parent to coordinate toy handoff
So that we can agree on delivery logistics
```
**Acceptance Criteria:**
- [ ] Messaging only available during active exchange (not general social feature)
- [ ] Message thread scoped to single exchange (not persistent general chat)
- [ ] Message content: Text only, max 500 chars per message (MVP scope)
- [ ] Delivery: Real-time via Supabase Realtime subscription
- [ ] Notification: Opposing user gets notification when message arrives
- [ ] Moderation: Auto-flag messages with phone numbers, addresses, payment requests
- [ ] Message retention: Deleted 30 days after exchange completion (privacy)
- [ ] Blocklist: Users can block all communication from specific parents (after dispute)

**US6.3: Notification Preferences**
```
As a user
I want granular control over how and when I'm notified
So that notifications serve me without creating digital noise
```
**Acceptance Criteria:**
- [ ] Settings page: Notification preferences per type and channel
- [ ] Channels: In-app, Email, SMS (future), Push (mobile)
- [ ] Notification frequency options: Instant, Daily digest, Weekly digest, Never
- [ ] Quiet hours: Set do-not-disturb window for push notifications
- [ ] Per-child preferences: Different notification rules for different child profiles
- [ ] Defaults: Intelligent (matches turned on, transactional always on, marketing off)
- [ ] Opt-out link in every marketing email

---

### Epic 7: Trust & Safety Mechanisms

**US7.1: User Ratings & Reviews**
```
As a user
I want to rate and review other parents after exchanges
So that the community can identify trustworthy users
```
**Acceptance Criteria:**
- [ ] Ratings available after exchange completion (within 7 days)
- [ ] Rating scale: 1-5 stars for two dimensions:
  - [ ] Item condition matched listing (1-5)
  - [ ] Communication & responsiveness (1-5)
- [ ] Optional text review (0-500 chars): "The toy arrived in perfect condition. Great communication!"
- [ ] Both parties rate simultaneously (mutual visibility after both rated)
- [ ] Badge system: "Trusted" badge displayed on profile after 10+ positive ratings
- [ ] Calculation: Average rating visible on profile (e.g., "4.8/5.0 from 23 exchanges")
- [ ] Fraud detection: Sudden drop in ratings triggers admin review

**US7.2: Report & Block Users**
```
As a user
I want to report problematic users and prevent communication
So that I feel safe from harassment or fraud
```
**Acceptance Criteria:**
- [ ] Report button on user profile and in exchange message thread
- [ ] Report categories: Inappropriate behavior, Fraudulent item, Harassment, Safety concern
- [ ] Optional details field: "Describe the issue" (0-500 chars)
- [ ] Reporting user remains anonymous (reporter not revealed to reported user)
- [ ] Block functionality: User can block another parent (no future contact)
- [ ] Blocked state: Blocked users cannot see blocked user's profile or toys
- [ ] Admin review: Reports queued for human review within 24h
- [ ] Escalation path: Serious reports (safety threats) escalated to compliance team immediately

**US7.3: Fraud Prevention**
```
As the platform
I want to detect and prevent fraudulent exchanges
So that the community remains trustworthy and safe
```
**Acceptance Criteria:**
- [ ] Automated checks:
  - [ ] Duplicate accounts (same email, IP address, device ID)
  - [ ] Rapid toy listing/delisting patterns (>10 listings in 1 day)
  - [ ] Uncompleted exchanges (>3 cancellations in 30 days)
  - [ ] Low rating + multiple disputes (automatic account review flag)
- [ ] Rate limiting: API calls throttled per user to prevent scraping
- [ ] Anti-automation: CAPTCHA at suspicious account activities
- [ ] Action log: All account actions logged for audit trail (dispute investigation)

---

### Epic 8: GDPR Compliance & Data Management

**US8.1: Parental Consent Flows**
```
As a parent
I want to explicitly consent to child data collection
So that I understand and control what data is stored about my children
```
**Acceptance Criteria:**
- [ ] At account creation: Explicit checkbox "I consent to store [Child Name]'s profile for toy matching and age-appropriate recommendations"
- [ ] Consent receipt: Email confirmation with what data is collected
- [ ] Granular consent options:
  - [ ] "Minimal" (name, age, interests only - no analytics)
  - [ ] "Standard" (+ anonymized game engagement metrics)
  - [ ] "Enhanced" (+ targeted ad preferences for ad network)
- [ ] Revocation: Parent can revoke consent anytime → child data purged within 30 days
- [ ] Multi-language: Consent text provided in Polish, German, English
- [ ] Signature/timestamp: Digital consent record with IP address for audit

**US8.2: Data Subject Access Requests (DSAR)**
```
As a parent
I want to download a copy of all data held about my account and children
So that I can exercise my GDPR right to access
```
**Acceptance Criteria:**
- [ ] DSAR request form in account settings: "Download my data"
- [ ] Processing: User receives structured export within 10 working days
- [ ] Format: JSON or CSV containing:
  - [ ] Account data (email, phone, registration date)
  - [ ] Child profiles (name, age, interests)
  - [ ] Exchange history (toys listed, requests made, completed exchanges)
  - [ ] Messages (anonymized with other party name removed)
  - [ ] Ratings & reviews (as given, not as received to protect privacy)
- [ ] Privacy: Requires user password confirmation for security
- [ ] Download link: Emailed to account email (not stored permanently)

**US8.3: Data Deletion & Right to Erasure**
```
As a parent
I want to permanently delete my account and all associated data
So that I can exercise my right to be forgotten
```
**Acceptance Criteria:**
- [ ] Account deletion request in settings: "Delete account and all data"
- [ ] Confirmation: "This action is permanent. All toys, messages, and activity will be deleted. Proceed?"
- [ ] Grace period: 30-day waiting period before permanent deletion (user can cancel anytime)
- [ ] During grace period: Account marked "scheduled for deletion"; limited access allowed
- [ ] After 30 days: Automatic hard deletion of:
  - [ ] Account, child profiles, settings
  - [ ] Personal messages (deleted permanently; only counts retained for statistics)
  - [ ] Ratings/reviews authored by user (anonymized: "Former user" replaces name)
  - [ ] Toy photos (deleted; toys removed from listings)
- [ ] Exception: Exchange history retained in anonymized form for fraud investigation (legal hold)
- [ ] Confirmation email: Sent before and after deletion

**US8.4: Privacy Policy & Data Transparency**
```
As a user
I want a clear, child-friendly privacy policy
So that I understand how data is handled
```
**Acceptance Criteria:**
- [ ] Privacy policy available in Polish, German, English
- [ ] Sections: Data collected, Use of data, Child safety, Ad targeting, Third-party services, Rights
- [ ] Child-friendly summary: 1-page simplified explanation for children (age 7+)
- [ ] Update process: Changes to policy notified 30 days in advance; re-consent required for material changes
- [ ] Accessibility: Plain language, font size 14+, high contrast
- [ ] Contact info: Data Protection Officer email and postal address for inquiries

---

### Epic 9: Internationalization (i18n) & Localization

**US9.1: Multi-Language Support**
```
As a user
I want to use the app in my preferred language
So that the experience is native and accessible
```
**Acceptance Criteria:**
- [ ] Supported languages: Polish (primary), German, English (MVP)
- [ ] Language selector in account settings and at login screen
- [ ] Default: Polish for accounts created with @pl domain; German for @de; English otherwise
- [ ] All UI text translated (no English text in non-English interfaces)
- [ ] Direction support: All languages left-to-right (future: right-to-left if Arabic added)
- [ ] Language persistence: Remembered across sessions (stored in user preferences)

**US9.2: Locale-Specific Formatting**
```
As a user
I want dates, numbers, and currency to display in my local format
So that I understand information correctly
```
**Acceptance Criteria:**
- [ ] Dates: DD.MM.YYYY for Polish/German; DD/MM/YYYY for English
- [ ] Numbers: "1.234,56" (Polish/German) vs "1,234.56" (English)
- [ ] Currency: EUR displayed as "14,99 zł" (Polish) or "14,99 EUR" (German)
- [ ] Time: 24-hour format for Polish/German; 12-hour (AM/PM) for English (configurable)
- [ ] Addresses: Format matched to country standard (e.g., "Zip City Country" for US, "Street Zip City" for EU)

**US9.3: Translation Management**
```
As a developer
I want a centralized translation management system
So that adding new languages is scalable
```
**Acceptance Criteria:**
- [ ] Translation files: JSON structure in `/locales/[lang]/common.json`
- [ ] Keys: Hierarchical (e.g., `nav.games.title`, `errors.invalid_email`)
- [ ] Fallback: Missing translations fall back to English (not blank UI)
- [ ] Context variables: Support for dynamic values in translations (e.g., "Hello, {{name}}")
- [ ] Pluralization: Rules for singular/plural forms (Polish has complex plurals)
- [ ] Date/time format library: Use `date-fns` with locale support
- [ ] Testing: Automated checks for missing or incomplete translations per language

---

## Functional Requirements

### Core Features: Detailed Specifications

#### 1. Ticket Economy System

**System Overview:**
The ticket system is the economic engine of the platform. It ensures fair exchange without monetary transactions and prevents system gaming.

**Ticket Lifecycle:**

| State | Description | User View | Conditions |
|-------|-------------|-----------|------------|
| **Owned** | User possesses ticket | Wallet shows "3 available" | Can use for toy requests |
| **Frozen (Request)** | Deducted upon toy request | Wallet shows "1 frozen - awaiting response" | Wait for lister to accept/decline |
| **Earned (Escrow)** | Earned from successful toy listing | Wallet shows "1 pending - delivery awaited" | Wait for recipient to confirm delivery |
| **Refunded** | Returned if request declined or auto-expires | Wallet shows "+1 returned" | Instant, available for reuse |
| **Consumed** | Permanently removed on exchange completion | No longer visible | Exchange marked "completed" |

**Rules:**
- Minimum balance check: User must have 1+ ticket to make request
- No negative balances: Users cannot overdraft tickets
- Fragment accumulation: Earned from games, redeemable at 4:1 ratio
- Starter allocation: New users receive 3 free tickets (not fragments) for onboarding
- Expiration: Tickets do not expire (no time limit)
- Transfer: Tickets cannot be gifted or transferred between users (single wallet per account)

**Database Schema (Simplified):**
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  balance INT DEFAULT 0,
  available INT DEFAULT 0,           -- balance - frozen
  frozen INT DEFAULT 0,              -- in active exchanges
  earned_from_games INT DEFAULT 0,   -- fragments (0-4)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE exchanges (
  id UUID PRIMARY KEY,
  requester_id UUID NOT NULL,
  lister_id UUID NOT NULL,
  toy_id UUID NOT NULL,
  status ENUM ('pending_request', 'accepted', 'in_transit', 'delivered', 'confirmed', 'completed', 'disputed', 'canceled'),
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (requester_id, lister_id, toy_id) REFERENCES auth.users(id), toys(id)
);
```

**Anti-Gaming Mechanisms:**
- Rapid listing/delisting: Flagged if >10 listings per hour from single user
- Fragment farming: Max 2 rewarded ads per game per child per day
- Ticket hoarding: No limit, but accounts with 50+ unused tickets reviewed for gaming patterns
- Refund loops: Max 3 request cancellations per month per user (soft limit; tracked)

---

#### 2. Secure Exchange (Escrow Mechanism)

**Exchange Flow Diagram:**

```
User A (Requester)        │         User B (Lister)
                          │
Sees toy (available)      │
Request toy (1 ticket)    │
 ├─ Ticket frozen         │
 ├─ Awaiting response     │         Notification: "Request for [Toy]"
 │                        │         Accept/Decline dialog
 │                        │    (Accept) → Toy marked unavailable
 │                        ├─────────────→ Exchange created
 ├─────────────────────────── Escrow Activated ──────────────────
 │ Frozen: 1 ticket       │         Pending: 1 ticket (earned)
 │                        │
 Arrange delivery         │         Confirm ready to ship
 Message partner          │         Message partner
                          │
 Item arrives             │         Item shipped (notification)
 ├─ In-transit status     │
 ├─ Message: "Arrived ok?"│
                          │
 Confirm delivery         │
 ├─ Takes photo (opt)     │
 ├─ Select condition      │
                          │
 Frozen ticket consumed   │         Earned ticket released to wallet
 (removed from wallet)    │
 Exchange completed       │         Notification: "Exchange completed!"
```

**Delivery Confirmation Process:**

1. **Requester Action:** "Confirm Delivery Received"
   - Displays toy details and expected condition
   - Requester selects actual condition received: Like listed / Minor wear / Damage / Missing parts
   - Optional: Upload 1-2 photos of condition
   - Submit: "I confirm delivery as [condition]"

2. **Validation & Dispute Handling:**
   - If condition matches (Minor wear or better): Auto-approve
   - If damage reported: Exchange marked "disputed" → Admin review within 24h
   - If missing parts: Admin contacts lister within 24h with evidence

3. **Resolution Options:**
   - Agreed condition: Tickets released normally; no refund
   - Acceptable damage: Requester keeps ticket; exchange marked "completed_with_damage"
   - Fraud detected (major damage, wrong item): Admin offers refund to requester; may ban lister

**Timeout & Auto-Completion:**
- In-transit timeout: 7 days
- Warning: Email 48h before auto-completion
- Action: Auto-mark "delivered" if no confirmation (tickets released)
- Note: Cannot dispute after auto-completion (incentivizes prompt action)

**Data Schema:**
```sql
ALTER TABLE exchanges ADD COLUMN (
  delivery_confirmed_at TIMESTAMP,
  delivery_condition VARCHAR,                -- 'like_listed', 'minor_wear', 'damage', 'missing_parts'
  delivery_photos_count INT DEFAULT 0,
  dispute_reason VARCHAR,
  dispute_resolution VARCHAR,
  admin_notes TEXT
);
```

**RLS Policy:**
```sql
-- Users can only see their own exchanges
CREATE POLICY exchanges_select ON exchanges
  FOR SELECT USING (
    requester_id = auth.uid() OR lister_id = auth.uid() OR
    (SELECT user_id FROM users WHERE id = auth.uid() LIMIT 1) IS ADMIN
  );
```

---

#### 3. Smart Wishlist & Matching

**Toy Taxonomy:**

The system uses a hierarchical category-tag structure for accurate matching.

**Top-Level Categories:**
1. **Building & Construction:** LEGO, blocks, magnet tiles, construction sets
2. **Vehicles:** Cars, trains, airplanes, ride-ons
3. **Action & Pretend Play:** Dolls, action figures, costumes, play sets
4. **Games & Puzzles:** Board games, card games, jigsaws, brain teasers
5. **Sports & Outdoor:** Balls, bikes, scooters, skates, garden toys
6. **Arts & Crafts:** Coloring supplies, clay, DIY kits, craft materials
7. **Musical:** Instruments, karaoke, music makers
8. **Electronic & Tech:** Tablets, robots, coding kits, interactive toys
9. **Books & Learning:** Picture books, early readers, educational materials
10. **Bath & Sensory:** Bath toys, sensory boards, fidgets

**Sample Tags (under Categories):**
- Building: "LEGO bricks", "Wooden blocks", "Magnetic tiles", "Construction vehicles"
- Action: "Superheroes", "Dinosaurs", "Police", "Fairy tale", "Pirate"
- Age-specific tags: "0-3 months", "6-12 months", "Toddler (1-3)", "Preschool (4-5)", "School-age (6-8)"

**Matching Algorithm:**

```
Score = (0.40 × Tag Match) + (0.30 × Age Match) + (0.20 × Condition) + (0.10 × Recency)

Tag Match (0-100%):
  - Exact tag match: 100%
  - Partial match (1/3 tags): 70%
  - Category match only: 40%
  - No match: 0%

Age Match (0-100%):
  - Toy age range includes child age: 100%
  - Child age ±1 year from range: 80%
  - Child age ±2 years from range: 50%
  - No age tag on toy: 100% (assume flexible)

Condition (0-100%):
  - Toy condition ≥ wishlist preference: 100%
  - Toy condition 1 level below: 70%
  - Toy condition 2+ levels below: 0%
  (Prevent listing "poor" condition when wishlist specifies "like-new")

Recency Bonus (0-100%):
  - Listed within 7 days: 100%
  - Listed within 14 days: 80%
  - Listed within 30 days: 60%
  - Listed >30 days ago: 40%
  (Encourages fresh inventory)

Match Trigger Threshold: Score ≥ 60 → Notification sent
```

**Daily Matching Process:**

1. **Trigger:** 02:00 UTC daily
2. **Query:** For each user with active wishlist items
   - Get all available toys (status = "active", not under exchange)
   - Exclude toys by user themselves
   - Exclude toys by blocked users
3. **Scoring:** Calculate score for each wishlist item × available toy
4. **Selection:** Top 3 matches per child profile
5. **Deduplication:** Don't notify about same toy twice in one week
6. **Send:** Format digest and queue notification (email or push per user preference)

**Wishlist Privacy:**
- Wishlists are private (not visible to other users)
- Matching is one-directional: Users don't see "who wishlisted my toy"
- Analytics only: Track "times wishlisted" as metric for toy popularity

---

#### 4. Mini-Games Design

**Game 1: Color Match Puzzle**
- **Duration:** 2-3 minutes
- **Mechanic:** Match pairs of colored blocks; 12 pairs per game
- **Difficulty:** 3 levels (increases grid size and time pressure)
- **Reward:** 0.5 fragments on completion
- **Optional Ad:** 0.25 bonus fragments for watching video
- **Learning:** Pattern recognition, memory
- **Child-Safe:** No player data collection beyond completion count

**Game 2: Memory Cards**
- **Duration:** 2-4 minutes
- **Mechanic:** Flip cards to match toy images; 16-20 cards depending on age
- **Difficulty:** 3 levels (card count increases, timeout tightens)
- **Reward:** 0.5 fragments on completion
- **Optional Ad:** 0.25 bonus fragments
- **Learning:** Memory, concentration, visual recognition
- **Progression:** Unlock "expert" level after 5 completions

**Game 3: Toy Trivia**
- **Duration:** 2-3 minutes
- **Mechanic:** Answer 5 questions about toys, sustainability, or fun facts
- **Difficulty:** Age-adjusted (4-7: simple, 8-12: moderate, 13+: challenging)
- **Reward:** 0.5 fragments on completion
- **Optional Ad:** 0.25 bonus fragments
- **Learning:** General knowledge, environmental awareness
- **Sample Q:** "Which toy is better for the environment? (A) Plastic toy (B) Wooden toy (C) Both if reused"

**Game Analytics (Non-Invasive):**
- Per-game: Completion count, average time, difficulty level chosen
- Per-child: Total fragments earned, games played per week, completion rate
- Platform: Aggregate game popularity, difficulty distribution
- No tracking of individual game actions (move-by-move), only completion outcome
- No profiling or ML model training on game data

**Parental Controls:**
- Disable games entirely for a child (setting: "Games disabled")
- Daily session limit: Optional cap (e.g., "Max 15 minutes/day")
- Time-of-day restrictions: Optional (e.g., "Games allowed 3-6 PM only")
- Ad opt-out: Parent can disable rewarded ads (fragments still earned)

---

#### 5. Notification System

**Notification Types & Triggers:**

| Type | Trigger | Channels | Frequency Control |
|------|---------|----------|-------------------|
| **Match Found** | Matching algorithm finds score ≥60 | Email, Push | Daily digest / Instant |
| **Request Received** | Another user requests my toy | In-app, Email, Push | Instant (priority) |
| **Request Response** | Lister accepts/declines my request | In-app, Email, Push | Instant (priority) |
| **Exchange Status** | Exchange state changes (accepted, in-transit, etc.) | In-app, Email, Push | Instant (priority) |
| **Delivery Overdue** | Exchange not confirmed after 5 days | Email | Once (escalation) |
| **Game Reward** | Child completes game | In-app, Push | Instant (optional) |
| **Message Received** | Partner sends message in exchange chat | In-app, Push | Instant |
| **Account Alert** | Security events (login, new device) | Email | Instant (security) |
| **Platform Update** | New feature, maintenance, policy change | Email | Weekly digest |

**Notification Channels:**

1. **In-App Notification Center:**
   - Persistent notification icon with count badge
   - Notification list sorted by date (newest first)
   - Mark as read/unread
   - Delete individual notifications
   - Retention: 30 days, oldest auto-deleted

2. **Email Notifications:**
   - Transactional (instant): Requests, responses, delivery overdue
   - Digest (daily): Matches, game rewards, messages
   - Marketing (weekly): Platform updates, feature announcements
   - User control: Toggle each notification type on/off

3. **Push Notifications (Mobile):**
   - Firebase FCM integration
   - Real-time delivery (in-transit, message received)
   - Action buttons: "Accept" / "Decline" directly from notification
   - Smart timing: Respect quiet hours (user-defined do-not-disturb window)
   - Retention: Notification center shows last 50 notifications

**Intelligent Batching:**
- Same notification type within 12 hours: Deduplicate
- Example: "3 matches found for your wishlists" (single notification vs. three separate)

---

#### 6. Child Safety & Moderation

**Content Moderation Pipeline:**

1. **Automatic Filtering (ML):**
   - Flag toy descriptions containing: weapons, adult items, recall notices
   - Flag photos: Human faces, nudity, violence, adult items
   - Action: Quarantine for manual review (user notified of delay)

2. **Human Moderation (Team):**
   - Review queue: Flagged toys and reports
   - Approval criteria: Age-appropriate, safe, descriptive photos, complete information
   - Rejection: Email user with specific reason and resubmission guidance
   - Turnaround: 24 hours during business hours

3. **Post-Listing Monitoring:**
   - Report button: Any user can report inappropriate toy
   - Investigation: Admin contacts lister with evidence, gives 48h to fix
   - Escalation: Repeated violations → Temporary suspension (7 days) → Permanent ban

**Prohibited Items (Hard Block):**
- Weapons, explosives, sharp objects
- Electronics not age-appropriate (adult tablets, phones)
- Choking hazards (small parts for under-3)
- Recalled toys (cross-reference with EU recall database)
- Adult toys or materials
- Consumables (food, medicines)

**Message Moderation:**
- Automated keyword detection: Phone numbers, addresses, payment requests, harmful content
- Action: Flag message; block sending if severe; admin review
- User warning: "This message contains contact info. For safety, use in-app messaging only."

---

## Non-Functional Requirements

### Performance Requirements

| Metric | Target | Details |
|--------|--------|---------|
| Page Load | <2s (first paint) | Initial web load on 3G connection |
| Search Response | <500ms | Toy search with filters |
| Matching Algorithm | Completes within 1 hour | Daily run window: 02:00-03:00 UTC |
| API Response | <200ms (p95) | Standard REST endpoints (excluding file uploads) |
| Mobile App Launch | <3s | From OS launch to interactive UI |
| Notification Delivery | <5 minutes | From event trigger to FCM receipt |
| Photo Upload | <10s | 2MB image with compression |
| Realtime Sync | <1s latency | Message delivery, ticket balance updates |

### Scalability Requirements

- **User Base:** Target 50,000 MAU by end of Year 2
- **Daily Transactions:** 5,000+ exchanges per day at scale
- **Concurrent Users:** 500+ simultaneous active users (peak)
- **Database:** PostgreSQL vertical scaling; sharding considered at 100K MAU
- **Storage:** Supabase Storage with CDN; 10TB+ toy images at scale
- **API Gateway:** Rate limiting per user (1,000 requests/hour)

### Security Requirements

1. **Authentication:**
   - JWT tokens (Supabase Auth) with 1-hour expiration
   - Refresh token rotation
   - Optional 2FA (TOTP-based)
   - Session timeout: 30 minutes of inactivity

2. **Authorization:**
   - Row-Level Security (RLS) enforced at database level
   - User can only access own data (exchanges, messages, children profiles)
   - Admin flag for moderation team (separate table)
   - No client-side authorization; all checks server-side

3. **Data Encryption:**
   - TLS 1.3 for all transit (HTTPS)
   - At-rest: Supabase handles encryption keys
   - Sensitive fields: Messages encrypted at application level (AES-256) if cross-border concerns

4. **API Security:**
   - Rate limiting: 1,000 requests per hour per IP
   - Input validation: All user inputs sanitized (SQL injection prevention)
   - CSRF tokens on state-changing operations
   - CORS: Restricted to trusted domains

5. **Third-Party Integrations:**
   - Firebase FCM: Service account keys stored in environment, never exposed
   - Google AdMob: No user PII passed; only age/interests sent
   - SendGrid: API keys rotated quarterly; email templates sanitized
   - Supabase: Service role key never exposed to client; used only on server

### Compliance Requirements

1. **GDPR (EU Regulations):**
   - Explicit consent for child data collection
   - Right to access (DSAR): Provide data export within 10 days
   - Right to erasure: Delete account and data within 30 days
   - Privacy policy: Clear, child-friendly language
   - Data Processing Agreement (DPA) for team members handling data
   - Data Retention: Only retain data necessary for service (6-month policy post-deletion)
   - International Transfers: Standard contractual clauses for US-based services (Vercel, Firebase)

2. **COPPA (US Child Protection, if expanding):**
   - Parental consent required for children under 13
   - Limited data collection and use
   - No behavioral tracking or profiling
   - Parental notification and control mechanisms

3. **Age-Appropriate Design (UK Age Assurance):**
   - No algorithm recommending harmful content
   - Parental controls default to most restrictive setting
   - No nudging or dark patterns to increase engagement
   - Transparent about commercial elements (ads, games)

---

## Technical Architecture

### System Design Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Clients                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web Browser │  │  iOS App     │  │ Android App  │      │
│  │  (Next.js)   │  │(Capacitor)   │  │ (Capacitor)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    ▼                ▼
         ┌──────────────────┐  ┌──────────────────┐
         │   Vercel (Web)   │  │  Capacitor Core  │
         │  Next.js Server  │  │  (Device APIs)   │
         └──────────────────┘  └──────────────────┘
                    │                │
                    └────────┬────────┘
                             ▼
         ┌────────────────────────────────────────┐
         │    Supabase (Backend Services)         │
         │  ┌────────────┐  ┌────────────────┐   │
         │  │ PostgreSQL │  │ Auth & RLS     │   │
         │  └────────────┘  └────────────────┘   │
         │  ┌────────────┐  ┌────────────────┐   │
         │  │ Realtime   │  │ Storage (CDN)  │   │
         │  └────────────┘  └────────────────┘   │
         │  ┌────────────┐  ┌────────────────┐   │
         │  │ Edge Fns   │  │ Vector DB      │   │
         │  └────────────┘  └────────────────┘   │
         └────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌────────┐ ┌────────────┐
   │Firebase │ │SendGrid│ │Google AdMob│
   │  FCM    │ │        │ │ / AdSense  │
   └─────────┘ └────────┘ └────────────┘
```

### Data Models (Core Tables)

**Simplified ERD:**

```
┌─────────────────┐         ┌──────────────┐
│   auth.users    │────────▶│  profiles    │
│  (Supabase)     │         │ (parent info)│
└─────────────────┘         └──────────────┘
        │                           │
        │                           │
        ├─────┬─────────────┐       │
        │     │             │       │
        ▼     ▼             ▼       ▼
    ┌──────┐  ┌─────┐  ┌──────────┐
    │ kids │  │toys │  │ exchanges│
    └──────┘  └─────┘  └──────────┘
        │      │        │
        │      │        ├─────────────────────┐
        │      │        ▼                     ▼
        │      │    ┌────────┐           ┌──────────┐
        │      │    │messages│           │ ratings  │
        │      │    └────────┘           └──────────┘
        │      │
        ▼      ▼
    ┌──────────────────┐
    │ wishlists        │
    │ (kid → category) │
    └──────────────────┘

┌──────────────┐  ┌──────────────────┐  ┌─────────────┐
│   tickets    │  │     games        │  │  fragments  │
└──────────────┘  └──────────────────┘  └─────────────┘

┌──────────────┐  ┌──────────────────┐  ┌─────────────┐
│  blocklist   │  │  notifications   │  │ notification│
│              │  │                  │  │ preferences │
└──────────────┘  └──────────────────┘  └─────────────┘
```

### API Endpoints (RESTful)

**Authentication:**
- `POST /auth/signup` - Register new parent account
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout and revoke token
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/password-reset` - Request password reset email
- `POST /auth/verify-email` - Verify email after signup

**Profiles & Kids:**
- `GET /profile` - Get user profile info
- `PUT /profile` - Update profile (email, preferences, language)
- `POST /kids` - Create child profile
- `GET /kids` - List all child profiles for user
- `PUT /kids/:id` - Update child profile
- `DELETE /kids/:id` - Delete child profile (soft delete, data anonymized)
- `POST /kids/:id/consent` - Record parental consent (GDPR audit)

**Toys:**
- `POST /toys` - List new toy (costs 1 ticket)
- `GET /toys` - Search toys with filters (pagination)
- `GET /toys/:id` - Get toy detail view
- `PUT /toys/:id` - Update toy listing (only if no active exchange)
- `DELETE /toys/:id` - Delist toy (only if no active exchange)
- `POST /toys/:id/wishlist` - Add toy to child's wishlist
- `DELETE /toys/:id/wishlist` - Remove from wishlist

**Exchanges:**
- `POST /exchanges` - Request toy (creates exchange, debits 1 ticket)
- `GET /exchanges` - List user's exchanges (filtered by status)
- `GET /exchanges/:id` - Get exchange detail (with messages)
- `POST /exchanges/:id/accept` - Lister accepts request
- `POST /exchanges/:id/decline` - Lister declines request (refunds ticket)
- `POST /exchanges/:id/confirm-delivery` - Requester confirms receipt
- `POST /exchanges/:id/dispute` - Requester reports issue

**Messages:**
- `POST /exchanges/:id/messages` - Send message in exchange chat
- `GET /exchanges/:id/messages` - Get message thread
- `DELETE /messages/:id` - Delete own message (soft delete, anonymized)

**Tickets & Wallet:**
- `GET /wallet` - Get ticket balance (owned, frozen, earned, pending)
- `POST /wallet/redeem-fragments` - Convert fragments to ticket
- `GET /wallet/history` - Transaction history (last 30 days)

**Notifications:**
- `GET /notifications` - Get notification center (last 50)
- `PUT /notifications/:id/read` - Mark notification as read
- `DELETE /notifications/:id` - Delete notification
- `PUT /notification-preferences` - Update notification settings per type

**Games:**
- `POST /games/:game-id/complete` - Submit game completion
- `GET /games/:game-id/leaderboard` - Get top players (anonymized)

**Wishlist:**
- `GET /wishlists/:kid-id` - Get child's wishlist
- `POST /wishlists/:kid-id/items` - Add item to wishlist
- `DELETE /wishlists/:kid-id/items/:item-id` - Remove from wishlist

**Admin Endpoints (Moderation Team Only):**
- `GET /admin/moderation-queue` - List pending toy approvals
- `POST /admin/toys/:id/approve` - Approve toy
- `POST /admin/toys/:id/reject` - Reject toy (with reason)
- `GET /admin/reports` - List user/toy reports
- `POST /admin/users/:id/review` - Investigate user account
- `POST /admin/users/:id/suspend` - Suspend user (7-30 days)
- `POST /admin/users/:id/ban` - Permanently ban user
- `POST /admin/exchanges/:id/resolve` - Resolve disputed exchange

---

### Frontend Architecture

**Tech Stack:**
- Framework: Next.js 14+ (App Router)
- UI Library: shadcn/ui
- Styling: Tailwind CSS
- State Management: Zustand (lightweight) + Supabase Realtime subscriptions
- Forms: React Hook Form + Zod validation
- Internationalization: next-i18next
- Mobile: Capacitor (wraps web app for iOS/Android)

**Key Directory Structure:**
```
/app
├── (auth)                  # Auth pages (login, signup, consent)
├── (app)                   # Protected routes (require JWT)
│   ├── dashboard          # Main app hub
│   ├── toys               # Toy listing/discovery
│   ├── exchanges          # Active exchanges
│   ├── games              # Mini-games interface
│   ├── wallet             # Ticket balance view
│   └── settings           # Account, preferences, GDPR
├── api                    # Next.js API routes (middleware)
└── layout.tsx             # Root layout with Supabase client

/components
├── ui                     # shadcn/ui components
├── toys                   # Toy-specific components (ToyCard, SearchFilter)
├── exchanges              # Exchange flow components
├── games                  # Game containers and UI
├── notifications          # Notification center
└── ads                    # Ad placement components

/lib
├── supabase.ts           # Supabase client initialization
├── hooks                 # Custom React hooks (useExchanges, useMatching, etc.)
├── utils                 # Utilities (formatters, validators)
├── types.ts              # TypeScript interfaces
└── gdpr-utils.ts         # GDPR request handlers

/public
├── images                # Static assets
├── locales               # i18n JSON files
│   ├── pl                # Polish translations
│   ├── de                # German translations
│   └── en                # English translations
└── games                 # Game assets

/supabase
├── migrations            # Schema changes
├── functions             # Edge Functions (serverless logic)
└── policies              # RLS policies
```

---

### Backend Architecture (Supabase)

**PostgreSQL Schema Highlights:**

```sql
-- RLS Policy Example: Users see only their own exchanges
CREATE POLICY exchanges_rls ON exchanges
  USING (requester_id = auth.uid() OR lister_id = auth.uid() OR admin_check());

-- Realtime Broadcasting: Enable for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE exchanges, tickets, messages;

-- Constraints: Prevent invalid state transitions
ALTER TABLE exchanges
  ADD CONSTRAINT valid_status CHECK (status IN (...));
```

**Edge Functions (Serverless Logic):**

1. **Matching Function** (Runs daily at 02:00 UTC)
   - Input: None (triggered by cron)
   - Logic: Calculate matching scores, send notifications
   - Output: Notifications queued to FCM

2. **Exchange Timeout Handler** (Runs every hour)
   - Input: None (cron)
   - Logic: Check exchanges stuck in "in_transit" for >7 days; auto-complete
   - Output: Ticket releases, notifications sent

3. **Fragment Validation** (Runs on demand)
   - Input: User ID, fragment count
   - Logic: Validate 4+ fragments before redemption; prevent double-counting
   - Output: Ticket credited or error returned

4. **GDPR Data Export** (Runs on user request)
   - Input: User ID
   - Logic: Compile all user data (exchanges, messages, child profiles) into JSON
   - Output: Signed download URL sent via email

5. **Toy Moderation Webhook** (Runs on toy creation)
   - Input: New toy object
   - Logic: Call ML API to flag for review; queue if needed
   - Output: Moderation queue entry created

---

### Mobile Integration (Capacitor)

**Capacitor Config:**
```json
{
  "appId": "com.toyfortoy.app",
  "appName": "Toy-for-Toy",
  "webDir": "out",
  "ios": {
    "preferredConfig": "Debug"
  },
  "android": {
    "minSdkVersion": 21
  },
  "plugins": {
    "FirebaseMessaging": {
      "senderId": "YOUR_FCM_SENDER_ID"
    },
    "Camera": {},
    "Share": {}
  }
}
```

**Native Features:**
- Push notifications via Firebase FCM
- Photo capture (toy images from camera)
- File sharing (send exchange details to SMS/email)
- Deep linking (notification → exchange detail)

---

## GDPR Compliance Plan

### Legal Framework

**Applicability:** GDPR applies because:
1. Service offered to EU residents (primary: Poland, Germany)
2. Personal data of children collected (under 16, parental consent required)
3. Data processing occurs in EU (Supabase hosted in EU region)

**Responsibility Model:**
- **Data Controller:** Company (Toy-for-Toy entity)
- **Data Processor:** Supabase, Firebase, SendGrid, Vercel (via Data Processing Agreements)
- **Joint Controller:** None (single entity responsible)

### Key Obligations & Implementation

#### 1. Lawful Basis for Processing

**For Parent Data (Email, Name):**
- Lawful basis: Contract (necessary to provide service)
- Consent: Not required (contractual necessity)
- Retention: Until account deletion (user can delete anytime)

**For Child Data (Age, Interests):**
- Lawful basis: **Parental Consent** (GDPR Article 8)
- Consent requirement: Parent must explicitly consent
- Verifiable consent: Email confirmation + IP log + timestamp
- Revocation: Parent can withdraw at any time → data deleted within 30 days

**For Marketing/Ads:**
- Lawful basis: Consent (separate checkbox)
- Consent: "I agree to targeted ads based on child's age/interests"
- Mechanism: Easy opt-out (unsubscribe link in all marketing emails)
- Default: Marketing consent OFF (opt-in model, not pre-checked)

#### 2. Consent Flows

**Initial Registration (Parent):**
```
Step 1: Email + Password
Step 2: "Create child profile?" → Name, DOB, Interests
Step 3: EXPLICIT CONSENT CHECKBOX:
  [ ] "I confirm that I am the parent/guardian of [Child Name]
       and consent to store their profile for toy matching and
       age-appropriate recommendations.
       Privacy Policy: [link]"

Step 4: OPTIONAL MARKETING CONSENT:
  [ ] "I'd like to receive news and offers about Toy-for-Toy"

Step 5: CONFIRMATION EMAIL with:
  - Consent details (what data, how long)
  - Consent revocation link
  - Privacy policy
  - Data Subject Access Request instructions
```

**Child Data Changes:**
- Parent can edit child profile → "Confirm changes" dialog
- Consent timestamp updated each time
- Email sent: "Profile updated on [date]"

**Consent Withdrawal:**
```
Account Settings → Privacy & Data → Revoke Consent for [Child Name]
→ "Revoking consent will delete all data about [Child Name]
    within 30 days. This action cannot be undone. Proceed?"
→ 30-day grace period (can cancel revocation)
→ Final deletion confirmation email sent
```

#### 3. Privacy Policy & Transparency

**Document Requirements:**

- **Language:** Polish (primary), German, English + child-friendly summary
- **Sections:**
  1. Data Controller & DPO info
  2. What data is collected (list with purpose)
  3. Why data is collected (lawful basis)
  4. How data is shared (third parties, cross-border)
  5. How long data is kept (retention schedule)
  6. User rights (access, correction, erasure, complaint)
  7. Cookies & tracking (explain Supabase, Firebase, Google Analytics)
  8. Contact: DPO email, postal address, phone

- **Child-Friendly Version (age 7+):**
  - Simple language (10th-grade reading level)
  - Examples instead of legal terms
  - Visual diagrams (flow of data collection)
  - "What happens to your information?" section
  - "You have the right to..." bullet points

- **Accessibility:**
  - Font size: 14pt+ for body text
  - Line spacing: 1.5+ for readability
  - High contrast: WCAG AA compliant
  - PDF option available (downloadable)

#### 4. Data Subject Access Requests (DSAR)

**Process:**

1. **Request Initiation:**
   - User clicks: Settings → Privacy → "Download my data"
   - or Email to: dpo@toyfortoy.example.com

2. **Verification:**
   - Confirm user identity (password or email verification link)
   - Log request (timestamp, user ID, verification method)

3. **Data Compilation (within 10 working days):**
   - Account data: Email, phone, registration date, preferences
   - Child profiles: All info (name, age, interests, consent records)
   - Exchanges: Full history (who, when, outcome, messages)
   - Messages: Non-anonymized (user's own messages in plain text)
   - Ratings: As given by user (not ratings received, to protect others)
   - Game activity: Aggregate stats only (no move-by-move data)
   - Consent records: All consent/withdrawal timestamps
   - Access logs: Login history (last 30 days)

4. **Delivery:**
   - Format: JSON (primary) + CSV (for exchanges/messages)
   - Size limit: <50MB (split into parts if needed)
   - Encryption: ZIP with password (sent separately via email)
   - Expiry: Download link valid 7 days
   - Confirmation email sent once downloaded

5. **Special Cases:**
   - If data shared with third parties: Note in export ("Shared with: Firebase FCM")
   - If derived data (ML models): Include training parameters in appendix
   - If data cannot be provided: Document reason (e.g., "Game move data not retained")

#### 5. Right to Erasure (Right to Be Forgotten)

**Process:**

1. **Request:**
   - Settings → Delete Account → "Delete all my data and my child profiles"
   - Confirmation: "This is permanent. Your account will be deleted after 30 days."

2. **Grace Period (30 days):**
   - Account marked "scheduled_deletion" in database
   - User can log in during grace period
   - "Your account is scheduled for deletion. [Cancel request]"
   - User can cancel anytime (account restored immediately)

3. **Automatic Deletion (after 30 days):**

   **Permanently Deleted:**
   - Account & auth record
   - Child profiles & interests
   - Personal messages (all)
   - Consent records
   - Settings & preferences
   - Payment methods (if any)

   **Anonymized (not deleted):**
   - Exchange history (counts only, no names, dates removed)
   - Ratings received (reviewer name anonymized to "Former user")
   - Toy descriptions (if still active, photo removed if user requests)
   - Game stats (aggregate only, no personal trace)

   **Retained for Legal/Safety (no PII):**
   - Abuse/fraud flags (to prevent reregistration of banned accounts)
   - Dispute records (anonymized, for fraud investigation)
   - Billing records (if applicable, required by tax law for 7 years)

4. **Confirmation:**
   - Email sent before deletion: "Your account will be permanently deleted in X days"
   - Email sent after deletion: "Your account has been deleted. Your data will be purged within 7 days."

#### 6. Data Retention Policy

| Data Category | Retention Period | Reason for Retention | Deletion Method |
|---------------|------------------|---------------------|-----------------|
| Account (active) | Until deletion | Operational necessity | Hard delete |
| Child profiles | Until revoked/deletion | Parental consent term | Hard delete |
| Exchanges (completed) | 6 months after completion | Dispute resolution window | Hard delete, counts retained |
| Messages | 30 days after exchange completion | Coordination needs | Soft delete (anonymized) |
| Consent records | Until revoked + 3 years | Legal compliance (GDPR audit) | Hard delete |
| Game activity | 1 year | Engagement analytics | Aggregate purge |
| Login logs | 30 days | Security audit trail | Hard delete |
| Access logs (failed) | 7 days | Fraud detection | Hard delete |
| Backup data | 30 days beyond retention | Disaster recovery | Hard delete |

#### 7. Cross-Border Data Transfers

**Challenge:** US-based services (Vercel, Firebase) + EU data

**Solution (Standard Contractual Clauses):**

1. **Data Processing Agreements (DPA) with:**
   - Vercel (hosting)
   - Firebase (push notifications)
   - SendGrid (email)
   - Google Analytics (if used)

2. **Safeguards:**
   - Standard Contractual Clauses (EU Standard Terms)
   - Data transfer addendum specifying:
     - What data is transferred
     - Purpose (email delivery, analytics, push notifications)
     - No secondary use (no profiling, ML training)
     - Data minimization (only necessary fields)
   - Encryption in transit (TLS)
   - Sub-processor list (Firebase → Google, etc.)

3. **Transparency:**
   - Privacy policy discloses: "Your data may be transferred to [countries]"
   - If using US cloud: Note Privacy Shield status; reference Schrems II implications

#### 8. Data Protection Impact Assessment (DPIA)

**Conduct DPIA for:**
- Child data processing (high-risk due to children)
- Automated matching (profiling with age/interests)
- Ad targeting (behavioral classification)

**DPIA Documentation:**
- Description of processing
- Necessity & proportionality assessment
- Risk analysis (unauthorized access, profiling, etc.)
- Mitigation measures (encryption, RLS, consent)
- Residual risks and acceptance

**Outcome:** Document filed; no significant risks if mitigations implemented

#### 9. Data Protection Officer (DPO)

**Requirement:** If processing large amounts of child data, designate DPO

**Responsibilities:**
- Oversee GDPR compliance
- Handle user complaints and DSAR requests
- Conduct audits and reviews
- Contact point for supervisory authorities

**Contact Information (Public):**
- DPO Email: `dpo@toyfortoy.example.com`
- DPO Postal: [Legal Address]
- DPO Phone: [Contact Number]
- Listed in Privacy Policy

#### 10. Breach Notification Plan

**If Personal Data Breach Occurs:**

1. **Assessment (immediate):**
   - What data was exposed?
   - How many users affected?
   - What is likelihood of harm?

2. **Notification (within 72h if high risk):**
   - Inform supervisory authority (DPA in country of residence)
   - If high-risk: Notify affected users directly
   - Notification includes: What happened, risks, measures taken

3. **Documentation:**
   - Breach register (date, nature, impact, response)
   - Retain records for 3 years

---

## Monetization Strategy

### Ad-Supported Model (No User Payments)

**Core Principle:** Revenue from ads, not from users. Tickets are free; value is user engagement + attention.

### Ad Placements

#### 1. Display Ads (Native & Banner)

**Placement Locations:**

| Location | Type | Frequency | Revenue Est. |
|----------|------|-----------|--------------|
| Toy detail (below description) | Native ad (other toys) | 1 per page | 0.02-0.05 EUR/view |
| Toy search results (every 5th item) | Banner 300x250 | 5 per page | 0.03-0.06 EUR/view |
| Exchange flow (awaiting response) | Leaderboard / Video | 1 per flow | 0.05-0.10 EUR/view |
| Games screen (above game list) | Banner 320x50 (mobile) | 1 per screen | 0.02-0.04 EUR/view |
| Notification digest (footer) | Contextual ad | 1 per email | 0.01-0.02 EUR/view |

**Ad Network:** Google AdMob (mobile) + Google AdSense (web)
**Targeting:** Age group + category preferences (no PII)
**Opt-Out:** Users can disable ads (feature, Phase 2) via premium tier or earned tokens

#### 2. Rewarded Video Ads

**Mechanic:** User watches 15-30s video to earn game bonus

**Implementation:**
- After game completion: "Watch a video for +0.25 bonus fragments?"
- Ad played via AdMob
- On completion: Fragments credited
- Frequency: Max 2 per game per child per day
- Revenue: ~0.50-2.00 EUR per completed video (higher rates than display)

**Conversion Metrics:**
- Expected CTR: 30-50% (voluntary, incentivized)
- Completion rate: 70-90% (users motivated by reward)
- RPM (Revenue per 1000 impressions): 15-30 EUR

#### 3. Sponsored Toy Listings (Future, Phase 2)

**Concept:** Toy manufacturers can feature new toys on platform for fee

**Implementation:**
- Premium listing: "Featured" badge, top search results
- Cost: EUR 50-200 per toy per month (promotional)
- Moderation: Same safety rules as user toys
- Disclosure: "Brand partnership" label visible
- Restriction: Max 10% of search results can be sponsored

**Revenue Potential:** EUR 5K-10K/month at scale

---

### Revenue Projections

**User Growth Scenario:**

| Month | MAU | Toy Exchanges/Day | Display Ad Impressions | Rewarded Video Views | Est. Monthly Revenue |
|-------|-----|-------------------|------------------------|----------------------|----------------------|
| M1-3 (Launch) | 500 | 50 | 10K | 100 | EUR 500 |
| M6 | 2,000 | 200 | 40K | 400 | EUR 2,000 |
| M12 | 5,000 | 500 | 100K | 1,000 | EUR 5,000 |
| M18 | 10,000 | 1,000 | 200K | 2,000 | EUR 12,000 |
| M24 | 15,000 | 1,500 | 300K | 3,000 | EUR 18,000 |
| M36 | 30,000 | 3,000 | 600K | 6,000 | EUR 35,000 |

**Assumptions:**
- Display ad rate: 0.03 EUR CPM (cost per 1000 impressions)
- Rewarded video: 0.50 EUR per completion
- Ad load: 2-3 ad opportunities per active user per week
- Fill rate: 80% (revenue lost to unsold impressions)

**Break-Even:** ~3,000 MAU (estimated EUR 3K/month ad revenue)

---

## MVP Scope & Roadmap

### Phase 1: MVP (Months 1-3)

**In Scope:**
- Core ticket economy (list toy, request, escrow, confirm delivery)
- Basic toy discovery (search, categories, filters)
- Child profile creation with consent flow
- Simple wishlist + daily matching (email digest)
- 1 mini-game (Color Match Puzzle)
- In-app messages (exchange coordination only)
- User ratings & reviews
- Basic notifications (email + in-app)
- Display ads on toy detail pages
- GDPR: Consent, privacy policy, basic data deletion

**Out of Scope (Phase 2+):**
- Mobile apps (Capacitor build)
- Advanced matching (AI-based personalization)
- Multiple mini-games
- Rewarded video ads
- SMS notifications
- User-to-user messaging (not exchange-scoped)
- Admin moderation UI (backend only)
- Advanced analytics dashboard
- Sponsored listings
- Parental controls (games, session limits)
- European language support (Phase 2)

### Phase 2: Polish & Growth (Months 4-6)

**Features:**
- Capacitor mobile app builds (iOS + Android beta)
- 2nd & 3rd mini-games (Memory, Trivia)
- Rewarded video ads integration
- German & English language support
- Push notifications (Firebase FCM)
- Parental controls (game time limits, ad opt-out)
- Admin moderation interface (web dashboard)
- GDPR: DSAR automation, data export portal
- Rating explanations (optional text comments)
- Toy photo moderation (AI + human review)

**Success Metrics:**
- 3,000+ MAU
- 500 exchanges/day
- 40%+ weekly active user rate
- EUR 3K-5K monthly ad revenue
- 95%+ delivery confirmation rate
- <1% fraud/dispute rate

### Phase 3: Scale & Trust (Months 7-12)

**Features:**
- Analytics dashboard (user growth, exchange metrics)
- Sponsored toy listings (brand partnerships)
- Advanced matching (ML recommendations)
- User blocklist & report system
- Community badges (Trusted, Eco-Hero, etc.)
- Parental dashboard (view child activity, manage consents)
- Newsletter & digest emails
- SEO content (blog, landing pages)
- Affiliate program (refer friends for bonus tickets)
- International expansion (France, Netherlands)

**Success Metrics:**
- 10,000+ MAU
- 1,500+ exchanges/day
- EUR 12K-15K monthly revenue
- 98%+ on-time delivery rate
- <0.5% fraud rate
- 4.5+ avg rating across platform

### Phase 4+: Internationalization & Monetization

**Focus:** Expand to 5+ countries, introduce premium features (ad-free tier, priority matching), and diversify revenue (subscription model for advanced features, TBD in future PRD)

---

## Success Metrics & KPIs

### Engagement Metrics

| Metric | Target (M6) | Target (M12) | Measurement |
|--------|------------|------------|--------------|
| **Monthly Active Users (MAU)** | 2,000 | 5,000 | Unique user logins/month |
| **Daily Active Users (DAU)** | 400 | 1,500 | Unique user logins/day |
| **Weekly Active Users (WAU)** | 800 | 3,000 | Unique user logins/week |
| **User Retention (30-day)** | 35% | 45% | % users active on day 30 |
| **Frequency (avg. logins/user/week)** | 1.5 | 2.0 | Mean login frequency |

### Exchange Metrics

| Metric | Target (M6) | Target (M12) | Measurement |
|--------|------------|------------|--------------|
| **Exchanges per Day** | 200 | 500 | Active exchanges created/day |
| **Exchanges per User (lifetime)** | 3 | 8 | Total exchanges per user |
| **Completion Rate** | 85% | 90% | % of exchanges marked "completed" |
| **Avg. Time to Completion** | 7 days | 6 days | From request to delivery confirmed |
| **Delivery Confirmation Rate** | 90% | 95% | % of exchanges with delivery confirmed |

### Quality & Trust Metrics

| Metric | Target (M6) | Target (M12) | Measurement |
|--------|------------|------------|--------------|
| **Avg. User Rating** | 4.3/5.0 | 4.5/5.0 | Mean rating across all users |
| **Fraud/Dispute Rate** | 3% | 1.5% | Disputed exchanges / total |
| **Response Rate (lister)** | 80% | 90% | % of requests with accept/decline |
| **Defect Rate (condition mismatch)** | 10% | 5% | % of deliveries reported as damaged |
| **Repeat User Rate** | 40% | 55% | % of users with 3+ exchanges |

### Business Metrics

| Metric | Target (M6) | Target (M12) | Measurement |
|--------|------------|------------|--------------|
| **Ad Impressions/Month** | 40K | 100K | Total ad views |
| **Click-Through Rate (CTR)** | 2% | 2.5% | Clicks / impressions |
| **Cost per Install (CPI, if paid ads)** | EUR 2 | EUR 1.50 | Marketing spend / new installs |
| **Monthly Ad Revenue** | EUR 2K | EUR 5K | Total ad network payouts |
| **CAC Payback Period** | N/A | <6 mo | Revenue / CAC |
| **User Lifetime Value (LTV)** | EUR 15 | EUR 40 | Estimated lifetime ad revenue/user |

### Operational Metrics

| Metric | Target (M6) | Target (M12) | Measurement |
|--------|------------|------------|--------------|
| **Toy Listing Moderation Time** | <4h | <2h | From submission to approval |
| **Support Response Time** | <24h | <4h | From user inquiry to support reply |
| **API Uptime** | 99.5% | 99.9% | % of time API is responsive |
| **Page Load Time (p95)** | <2s | <1.5s | Time to interactive |
| **Mobile App Crash Rate** | <0.1% | <0.05% | Crashes / sessions |

### Analytics & Compliance

| Metric | Target | Measurement |
|--------|--------|------------|
| **GDPR Consent Rate** | >95% | % of accounts with explicit consent |
| **Parental Consent Recorded** | 100% | All child data with verified consent |
| **Data Deletion Requests (processed)** | <5 | Expected low volume; all <10 working days |
| **Privacy Policy Completion** | >90% | Users who read before creating account |
| **Report Processing Time (abuse)** | <24h | From report submission to admin action |

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| **Supabase Outage** (DB unavailable) | High | Low (99.9% SLA) | Backup database snapshot daily; failover plan documented |
| **Realtime sync lag** (message/ticket delays) | Medium | Medium | Implement polling fallback; monitor latency metrics |
| **Firebase FCM failure** (push not sent) | Medium | Low | Email fallback for urgent notifications |
| **Third-party API rate limiting** | Low | Medium | Implement request batching; monitor quota usage |
| **Mobile app crash on launch** | High | Low | Thorough testing on 10+ device models before release |
| **Scalability bottleneck** (slow at 50K users) | High | Medium | Database indexing, CDN for static assets, API caching |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| **Low user adoption** (<500 MAU at M6) | High | Medium | Strong go-to-market (parenting influencers, eco communities); product-market fit validation |
| **High churn rate** (>50% monthly) | High | Medium | Engagement focus (games, matching), user interviews, iterate UI |
| **Fraud/scams escalate** (damaged toys, no-shows) | High | Medium | Strict moderation, user verification, dispute resolution SLA |
| **Ad revenue lower than projected** | High | High (market-dependent) | Diversify: sponsored listings (Phase 2), premium features (Phase 3) |
| **Competitors enter market** | Medium | High | Brand differentiation (eco-focus, community), speed to scale |
| **User churn to competitor** | High | Medium | Lock-in strategies: badges, leaderboards, exclusive events (careful not to dark-pattern) |

### Legal & Compliance Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| **GDPR violation** (non-consensual data use) | Critical | Low | Strict consent implementation, DPA review, regular audits |
| **Child safety incident** (inappropriate contact) | Critical | Low | Message moderation, blocklist, report system, Terms of Service |
| **Toy safety issue** (recall not flagged) | High | Low | Integrate EU recall database; automated flagging |
| **Data breach exposure** (PII leaked) | High | Low | Encryption, RLS enforcement, regular security audits, breach response plan |
| **Regulatory request** (DPA audit) | Medium | Low | Document compliance; designate DPO; maintain audit logs |
| **Terms of Service violation** (user abuse) | Medium | Medium | Clear policies, enforcement team, appeal process |

### Market & User Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| **Market skepticism** (cashless economy novel) | Medium | Medium | Clear education; transparent economy mechanics; community stories |
| **Logistics challenges** (shipping costs, delays) | Medium | High | Encourage local exchanges; integrate shipping partnerships (Phase 2) |
| **Toxic community** (harassment, scams) | Medium | Medium | Strong moderation, user ratings, blocklist, community guidelines |
| **Parent concerns** (child privacy, safety) | High | Medium | Transparent privacy policy, parental dashboard, trust badges |
| **Seasonal demand fluctuation** (low in summer) | Low | High | Diversify with seasonal campaigns; games provide off-season engagement |

---

## Timeline & Milestones

### High-Level Development Roadmap

**Phase 1: MVP (Months 1-3)**

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| **Project Setup** | Week 1 | Repo initialized, dev env, Supabase project created, CI/CD pipeline |
| **Backend Core** | Week 3 | Database schema, auth, RLS policies, Core APIs (toys, exchanges, tickets) |
| **Frontend MVP** | Week 5 | Pages: Login, Dashboard, Toy Search, Toy Detail, Create Exchange, Wallet |
| **Games MVP** | Week 6 | Color Match game, basic UI, fragment reward system |
| **Notifications** | Week 7 | Email notifications, notification preferences, in-app notification center |
| **GDPR Compliance** | Week 8 | Consent flow, privacy policy, DSAR skeleton, data deletion handler |
| **Ad Integration** | Week 8 | Google AdMob/AdSense setup, ad placement on toy detail |
| **Internal Testing** | Week 9 | QA testing, performance testing, security audit |
| **Soft Launch** | Week 10 | Invite 100 beta users, gather feedback, iterate |
| **Bug Fixes & Polish** | Week 11-12 | Fix reported issues, improve UX, performance optimization |
| **Public Launch** | Week 12 | Release v1.0 to public, announce via PR |

**Phase 2: Growth (Months 4-6)**

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| **Mobile Apps** | Month 4 | Capacitor setup, iOS + Android beta builds |
| **Additional Games** | Month 4 | Memory card game, Toy trivia game |
| **Rewarded Ads** | Month 4 | AdMob rewarded video integration, testing |
| **Internationalization** | Month 5 | German & English translations, locale formatting |
| **Push Notifications** | Month 5 | Firebase FCM integration, push testing on mobile |
| **Admin Dashboard** | Month 5 | Moderation UI, toy approval, report handling |
| **Parental Controls** | Month 5 | Game time limits, ad opt-out, child privacy settings |
| **GDPR Portal** | Month 6 | DSAR automation, data export, easy deletion |
| **App Store Release** | Month 6 | iOS App Store + Google Play Store submission, approval |
| **Growth Campaign** | Month 6 | Influencer partnerships, eco-community outreach |

**Phase 3: Scale & Trust (Months 7-12)**

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| **Sponsored Listings** | Month 7 | Brand partnership system, payment processing (Phase 3 business) |
| **Advanced Matching** | Month 8 | ML recommendations, personalized match algorithm |
| **Community Features** | Month 8 | Badges, leaderboards, user profiles, follow system |
| **Analytics Dashboard** | Month 8 | KPI tracking, user growth charts, export reports |
| **International Expansion** | Month 9 | France + Netherlands setup, language support, local partnerships |
| **Affiliate Program** | Month 9 | Referral system, bonus ticket rewards |
| **Performance Optimization** | Month 10 | Database indexing, caching, CDN optimization, mobile performance |
| **Security Audit** | Month 10 | Third-party penetration test, compliance review |
| **Year 1 Review** | Month 12 | Retrospective, strategy for Year 2, roadmap updates |

---

## Appendix: Glossary & Definitions

| Term | Definition |
|------|-----------|
| **Ticket** | Virtual currency (1 ticket = 1 toy exchange right) |
| **Fragment** | Earned from games; 4 fragments = 1 ticket |
| **Exchange** | Transaction between two parents involving 1 toy for 1 ticket |
| **Escrow** | Ticket held by system during exchange (not accessible to either user) |
| **Lister** | Parent who lists toy for exchange |
| **Requester** | Parent who requests toy from lister |
| **Wishlist** | Per-child list of desired toys for matching |
| **Matching** | Algorithmic pairing of child wishlists with available toys |
| **RLS** | Row-Level Security (database security enforced at Supabase) |
| **GDPR** | General Data Protection Regulation (EU privacy law) |
| **COPPA** | Children's Online Privacy Protection Act (US law, future consideration) |
| **DPA** | Data Processing Agreement (legal contract with third parties) |
| **DSAR** | Data Subject Access Request (user right to download personal data) |
| **DPO** | Data Protection Officer (compliance role) |
| **i18n** | Internationalization (multi-language support) |
| **FCM** | Firebase Cloud Messaging (push notification service) |
| **MAU** | Monthly Active Users (engagement metric) |
| **DAU** | Daily Active Users (engagement metric) |
| **RPM** | Revenue Per 1000 impressions (ad metric) |
| **CTR** | Click-Through Rate (ad metric) |
| **CAC** | Customer Acquisition Cost (marketing metric) |
| **LTV** | Lifetime Value (user value metric) |
| **SLA** | Service Level Agreement (uptime guarantee) |

---

## Document Approval & Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Product Owner** | [To be assigned] | [TBD] | |
| **Engineering Lead** | [To be assigned] | [TBD] | |
| **Legal/Compliance** | [To be assigned] | [TBD] | |
| **Design Lead** | [To be assigned] | [TBD] | |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-13 | AI-Generated | Initial comprehensive PRD for MVP phase |

---

## References & Supporting Documents

- [README.md](/Users/pawelkalkun/Projects/private/toys-for-toys/README.md) - Project overview
- [CLAUDE.md](/Users/pawelkalkun/Projects/private/toys-for-toys/CLAUDE.md) - Development guidelines
- [Supabase Documentation](https://supabase.com/docs) - Backend platform
- [Next.js Documentation](https://nextjs.org/docs) - Frontend framework
- [GDPR Compliance Checklist](https://gdpr-info.eu/) - EU regulation reference
- [COPPA Guidelines](https://www.ftc.gov/business-guidance/privacy-security/coppa) - US child protection
- [Google AdMob Best Practices](https://support.google.com/admob/) - Ad integration
- [Firebase Documentation](https://firebase.google.com/docs) - Push notifications

---

**END OF DOCUMENT**

This PRD is a living document and will be updated as the product evolves. For questions, clarifications, or updates, contact the Product Owner.
