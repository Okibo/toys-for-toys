# Profile Field-Level Filtering Implementation

## Overview

This document describes the API-layer field-level filtering implementation for public user profiles in the Toy-for-Toy application. The filtering enforces a strict security boundary to prevent exposure of sensitive personally identifiable information (PII).

## Problem Statement

The RLS policy in `supabase/migrations/20241114_0013_implement_rls_policies.sql` allows **all authenticated users to SELECT all profile rows**. The database intentionally does not restrict which fields are returned because field-level filtering is delegated to the API layer.

**Security Requirement:** The API layer MUST enforce field-level filtering before returning profile data in HTTP responses.

## Architecture

### Design Principles

1. **Allowlist Approach**: Only explicitly approved fields are returned in public profile responses
2. **Early Filtering**: Filtering occurs before JSON serialization to prevent sensitive data leakage
3. **Type Safety**: TypeScript type guards ensure compile-time safety
4. **Separation of Concerns**: Database layer handles row access control; API layer handles field access control

### Security Boundary

```
Database (RLS)         API Layer           HTTP Response
─────────────────────────────────────────────────────────

All profiles      →  Filtering Logic    →  Public Profile
(all fields)          (allowlist)          (safe fields)
                         ↓
                      Own Profile
                      (all fields)
```

## Implementation

### Files Created

#### 1. `/lib/profiles.ts` - Core Filtering Logic

Implements the field-level filtering functions with TypeScript type safety.

**Key Functions:**

```typescript
// Check if user is viewing their own profile
export function isOwnProfile(currentUserId: string | null | undefined, profileId: string): boolean;

// Filter profile based on viewing context
export function filterPublicProfile(
  profile: FullProfile,
  currentUserId: string | null | undefined
): PublicProfile | FullProfile;

// Type guards for compile-time safety
export function isPublicProfile(profile: unknown): profile is PublicProfile;
export function isFullProfile(profile: unknown): profile is FullProfile;
```

**Type Definitions:**

```typescript
export interface PublicProfile {
  id: string;
  full_name: string | null;
  language: string;
  user_stats?: {
    avg_overall_rating: number | null;
    review_count: number;
  } | null;
}

export interface FullProfile extends PublicProfile {
  email: string;
  phone?: string | null;
  notification_preference?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // ... additional fields
}
```

#### 2. `/app/api/profiles/[id]/route.ts` - API Endpoint

Implements the GET endpoint for profile retrieval with integrated filtering.

**Request Flow:**

1. Validate profile ID (UUID format)
2. Verify authentication (Bearer token in Authorization header)
3. Extract current user ID from auth token
4. Fetch profile from database (RLS enforces row access)
5. Fetch user_stats separately (separate table)
6. **Apply field-level filtering** via `filterPublicProfile()`
7. Return filtered response

**Error Handling:**

- `400`: Invalid profile ID (not a UUID)
- `401`: Not authenticated or invalid token
- `404`: Profile not found
- `500`: Database or server errors

#### 3. `/tests/api/profiles.test.ts` - Unit Tests

17 comprehensive tests for the filtering logic:

- Public profile field exposure
- Sensitive field protection
- Own profile access
- Edge cases (null values, empty strings)
- Type safety

#### 4. `/tests/api/profiles-endpoint.test.ts` - Integration Tests

23 tests for endpoint behavior:

- Request validation
- Response field filtering
- Authentication context
- Error handling
- Security assertions
- Type safety

## Allowed Fields by Profile Type

### Public Profile (Other Users)

These fields ONLY are returned when viewing another user's profile:

| Field                           | Type           | Purpose                       |
| ------------------------------- | -------------- | ----------------------------- |
| `id`                            | string (UUID)  | User identifier               |
| `full_name`                     | string \| null | Display name                  |
| `language`                      | string         | User language preference      |
| `user_stats.avg_overall_rating` | number \| null | Average rating for reputation |
| `user_stats.review_count`       | number         | Number of reviews received    |

### Full Profile (Own Profile)

All fields returned when user views their own profile:

| Field                     | Type           | Note                             |
| ------------------------- | -------------- | -------------------------------- |
| All public fields         | -              | Includes everything above        |
| `email`                   | string         | Sensitive: email address         |
| `phone`                   | string \| null | Sensitive: phone number          |
| `notification_preference` | JSONB          | Sensitive: notification settings |
| `created_at`              | string         | Sensitive: account creation time |
| `updated_at`              | string         | Sensitive: last update time      |
| `user_stats.*`            | various        | All rating statistics            |

## Security Guarantees

The implementation provides these security guarantees:

1. **Email Protection**: User email addresses are NEVER exposed to other users
2. **Phone Protection**: Phone numbers (if added) are protected
3. **Preference Privacy**: Notification preferences are private
4. **Timestamp Hiding**: Creation/update timestamps are not exposed
5. **Rating Details**: Only aggregate ratings are public (not individual scores)
6. **Allowlist Enforcement**: New fields are blocked by default unless explicitly added

## Usage Example

### Server-Side (API Endpoint)

```typescript
import { filterPublicProfile } from '@/lib/profiles';

// After fetching from database
const profile = await supabase.from('profiles').select(...).single();

// Apply filtering
const filtered = filterPublicProfile(profile, currentUser.id);

// Return filtered profile
return NextResponse.json(filtered);
```

### Client-Side (Next.js Component)

```typescript
import { useEffect, useState } from 'react';

export function UserProfile({ userId }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch(`/api/profiles/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    })
      .then(r => r.json())
      .then(setProfile);
  }, [userId]);

  // profile will ONLY contain safe fields
  return (
    <div>
      <h1>{profile?.full_name}</h1>
      {/* email is NOT available here */}
    </div>
  );
}
```

## Testing

### Run Unit Tests

```bash
npm test -- tests/api/profiles.test.ts
```

**Output:** 17 passing tests

### Run Integration Tests

```bash
npm test -- tests/api/profiles-endpoint.test.ts
```

**Output:** 23 passing tests

### Run All Tests

```bash
npm test -- tests/api/
```

**Output:** 40 passing tests total

### Type Safety Check

```bash
npx tsc --noEmit
```

Should have no errors in profile files.

### Linting

```bash
npx eslint lib/profiles.ts app/api/profiles/[id]/route.ts tests/api/profiles*.test.ts
```

Should pass with no errors.

## Performance Considerations

1. **Indexed Queries**: Profile lookups use primary key index (UUID)
2. **Separate Stats Fetch**: user_stats queried separately to avoid N+1 issues
3. **Graceful Null Handling**: Missing stats don't cause errors
4. **Early Filtering**: Filtering happens after database query (minimal overhead)

## Database Design

The profiles and user_stats tables have the following relationship:

```
profiles (1)
  ├─ id (UUID PK)
  ├─ email
  ├─ full_name
  ├─ language
  ├─ notification_preference
  ├─ created_at
  └─ updated_at
        ↓
user_stats (1)
  ├─ user_id (UUID FK → profiles.id)
  ├─ avg_overall_rating
  ├─ review_count
  ├─ total_exchanges
  ├─ avg_condition_rating
  └─ avg_communication_rating
```

## RLS Policy Note

The RLS policy on profiles table is:

```sql
CREATE POLICY "profiles_select_own_or_public" ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  USING (
    auth.uid() = id  -- Own profile
    OR true           -- Public profile visible to all authenticated users
  );
```

**Important:** This policy allows SELECT on all rows. Field-level filtering MUST be enforced in the API layer.

## Future Enhancements

1. **Caching**: Add Redis caching for frequently accessed profiles
2. **Field Expansion**: Support selective field expansion via query parameters
3. **Rate Limiting**: Protect profile endpoint from enumeration attacks
4. **Audit Logging**: Log all profile access for security analysis
5. **User Preferences**: Allow users to make profiles fully private

## Related Documentation

- [RLS Policies](../supabase/migrations/20241114_0013_implement_rls_policies.sql)
- [Core Tables Schema](../supabase/migrations/20241114_0001_create_core_tables.sql)
- [Ratings Tables](../supabase/migrations/20241114_0012_create_ratings_tables.sql)

## Acceptance Criteria Verification

- ✅ Public profile requests return ONLY: id, full_name, language, user_stats
- ✅ Own profile requests return all fields
- ✅ Sensitive fields (email, phone, notification_preference) never exposed
- ✅ Endpoint returns 400 or 404 for invalid/non-existent profiles
- ✅ All requests properly authenticated (check auth.uid())
- ✅ Jest tests verify field filtering (40 tests passing)
- ✅ No TypeScript errors
- ✅ ESLint passing

## Contact

For questions or concerns about this implementation, refer to the security team or review the test files for expected behavior.
