# Email/Password Authentication Setup

## Overview

The Toy-for-Toy application uses Supabase for email/password authentication with secure token management via httpOnly cookies. This document covers the configuration, environment variables, and token lifecycle.

## Architecture Overview

### Authentication Flow

```
User Registration/Login
    ↓
Next.js Frontend Form
    ↓
Supabase Auth API
    ↓
User Email Verification (if enabled)
    ↓
JWT Tokens Generated
    ↓
httpOnly Cookies (via auth-helpers)
    ↓
Automatic Token Refresh on Route Change
    ↓
Protected API Routes Verified Session
```

### Key Components

- **lib/auth-types.ts**: TypeScript interfaces for all auth data structures
- **lib/supabase-auth.ts**: Supabase client initialization with token management
- **@supabase/auth-helpers-nextjs**: Automatic session management with httpOnly cookies
- **PostgreSQL RLS Policies**: Row-level security enforcing data isolation by user_id

## Required Environment Variables

All variables must be set in `.env.local` (development) or configured in Vercel/production environment.

### Public Variables (Safe to Expose)

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous API Key
# Used for authentication and read operations protected by RLS
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Supabase Region (for GDPR compliance)
NEXT_PUBLIC_SUPABASE_REGION=eu-west-1
```

Where to find these values:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy **Project URL** and **Anon Public Key**

### Private Variables (Server-Side Only)

```bash
# Supabase Service Role Key
# NEVER expose to frontend - has full database access
# Use only in server API routes and Edge Functions
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Where to find this:

1. Supabase Dashboard > **Settings** > **API**
2. Copy **Service Role Key**
3. Add to `.env.local` (never commit to Git)

## Supabase Auth Configuration

### Email/Password Provider Setup

1. **Supabase Dashboard** > **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email settings:

   ```
   Provider: Email
   Enable Sign Up: Yes
   Require Email Confirmation:
     - Development: No (auto-confirm)
     - Production: Yes
   ```

### Redirect URLs Configuration

These URLs are where users are redirected after email verification, password reset, etc.

1. **Supabase Dashboard** > **Authentication** > **URL Configuration**
2. Add redirect URLs:

   ```
   Allowed Redirect URLs:
   - http://localhost:3000/auth/callback (development)
   - https://yourdomain.com/auth/callback (production)
   - https://yourdomain.com/auth/reset-password (password reset)
   ```

### Email Templates Configuration

1. **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Customize templates (optional):
   - **Confirmation Email**: Verification link for new signups
   - **Recovery Email**: Password reset link
   - **Magic Link Email**: One-time login link (if enabled)
   - **Invite Email**: Admin invitations (if enabled)

Each template can be customized with:

- Subject line
- Email body with {{ .Token }} placeholder
- Reply-to address

### Session & Token Configuration

1. **Supabase Dashboard** > **Authentication** > **Providers** > **Settings**

2. Configure token expiration:

   ```
   JWT Expiration Limit (seconds): 3600 (1 hour)
   JWT Secret: [auto-generated]
   Refresh Token Rotation: Enabled
   Refresh Token Reuse Interval: 10 seconds
   ```

3. MFA Configuration (optional):
   ```
   Enable Multi-Factor Authentication: Yes/No
   Enforce MFA for all users: Yes/No
   ```

## Token Lifecycle

### How Token Refresh Works

1. **Initial Login/Signup**

   ```
   User provides email + password
   ↓
   Supabase Auth validates credentials
   ↓
   Returns: access_token (1 hour) + refresh_token (30 days)
   ↓
   Both tokens stored in httpOnly cookies
   ↓
   Cookies sent automatically with all requests
   ```

2. **Automatic Refresh Before Expiry**

   ```
   User navigates to new page / makes API call
   ↓
   auth-helpers middleware checks token expiry
   ↓
   If access_token expiring soon:
     - Uses refresh_token to request new access_token
     - Supabase validates refresh_token
     - Returns new access_token
     - Updates httpOnly cookie
   ↓
   Request proceeds with fresh token
   ```

3. **Session Expiration**
   ```
   If refresh_token expires (30 days):
     - Cannot issue new access_token
     - User must re-login with email/password
   ↓
   Clear session and redirect to login
   ```

### Token Structure (JWT Payload)

The access_token contains claims used by the application:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User ID (matches auth.users.id)
  "email": "user@example.com",
  "aud": "authenticated",  // Audience (or "anon" for unauthenticated)
  "role": "authenticated",  // User role (affects RLS policies)
  "iat": 1692720000,       // Issued at
  "exp": 1692723600,       // Expires at (current_time + 3600 seconds)
  "app_metadata": {...},   // Admin-set metadata
  "user_metadata": {...}   // User-set metadata
}
```

The database decodes this token and uses the `sub` claim to enforce RLS policies:

```sql
-- Example RLS policy: Users can only read their own data
SELECT auth.uid() = user_id;  -- auth.uid() extracts "sub" from JWT
```

## Code Usage

### In API Routes (pages/api/)

```typescript
import { createClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Create client with session from request cookies
  const supabase = createClient({ req, res });

  // Get current user from session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Session is authenticated - can now query protected resources
  const { data, error } = await supabase.from('toys').select('*').eq('user_id', session.user.id); // RLS automatically filters by user_id

  return res.json({ data, error });
}
```

### In React Components

```typescript
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function MyComponent() {
  const { session, loading } = useSession();
  const supabase = useSupabaseClient();

  if (loading) return <div>Loading...</div>;

  if (!session) return <div>Not authenticated</div>;

  return <div>Hello {session.user.email}</div>;
}
```

### Signup Example

```typescript
import { supabaseAuthClient } from '@/lib/supabase-auth';
import type { SignUpPayload } from '@/lib/auth-types';

export async function signup(payload: SignUpPayload) {
  const { data, error } = await supabaseAuthClient.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.full_name,
        // GDPR: Don't include child data in auth metadata
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}
```

### Login Example

```typescript
import { supabaseAuthClient } from '@/lib/supabase-auth';
import type { LoginPayload } from '@/lib/auth-types';

export async function login(payload: LoginPayload) {
  const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) throw error;
  return data;
}
```

## GDPR Compliance

### Handling Child Data

**Important**: Child personal information should NOT be stored in auth metadata.

Correct approach:

```typescript
// ✓ CORRECT - Parental consent in auth
await supabase.auth.signUp({
  email: parent_email,
  password: password,
  options: {
    data: {
      full_name: 'Parent Name',
      parental_consent: true, // Parent's consent flag
      // NO child data here
    },
  },
});

// Child data stored separately in profiles table
await supabase.from('profiles').insert({
  user_id: parent_user_id,
  child_name: 'Child Name', // Stored separately
  child_age: 8,
  parental_consent_at: new Date(),
});
```

Incorrect approach:

```typescript
// ✗ WRONG - Child data in auth
await supabase.auth.signUp({
  email: parent_email,
  options: {
    data: {
      child_name: 'Child Name', // Should not be here
      child_age: 8, // Should not be here
      child_dob: '2016-01-15', // Should not be here
    },
  },
});
```

### User Data Deletion

When a parent requests account deletion:

```typescript
import { supabaseServiceRole } from '@/lib/supabase-service';

// 1. Delete all user data via RLS-protected API
await supabaseServiceRole.from('toys').delete().eq('user_id', userId);
await supabaseServiceRole.from('exchanges').delete().eq('user_id', userId);
await supabaseServiceRole.from('profiles').delete().eq('user_id', userId);

// 2. Delete auth user (also cascades deletes)
await supabaseServiceRole.auth.admin.deleteUser(userId);

// 3. Log deletion for compliance records
```

## Debugging

### Connection Test

Test that authentication is properly configured:

```typescript
import { testSupabaseAuthConnection } from '@/lib/supabase-auth';

const result = await testSupabaseAuthConnection();
console.log(result);
// Output:
// {
//   success: true,
//   message: "Connected and authenticated" or "Connected but not authenticated (expected)",
//   error: null
// }
```

### Check Token Expiry

```typescript
import { supabaseAuthClient } from '@/lib/supabase-auth';

const {
  data: { session },
} = await supabaseAuthClient.auth.getSession();

if (session) {
  const expiresAt = new Date(session.expires_at! * 1000);
  const secondsLeft = (expiresAt.getTime() - Date.now()) / 1000;

  console.log(`Token expires in ${Math.round(secondsLeft)} seconds`);
}
```

### View Logs in Supabase Dashboard

Monitor authentication events:

1. **Supabase Dashboard** > **Logs** > **Auth**
2. Filter by event type:
   - `signup`: User registration
   - `signed_in`: User login
   - `signed_out`: User logout
   - `token_refreshed`: Automatic token refresh
   - `password_recovery`: Password reset requested
   - `user_deleted`: User account deleted

## Common Issues

### "Missing NEXT_PUBLIC_SUPABASE_URL"

- Ensure `.env.local` has the Supabase URL
- Restart dev server after updating `.env.local`
- Check that variable is exported (NEXT*PUBLIC* prefix)

### "Invalid email" on signup

- Email format validation happens client-side and server-side
- Ensure email matches RFC 5322 standard
- Check Supabase auth settings for custom validation rules

### "User already exists"

- User with that email already has account
- Direct to password reset if they forgot password
- Check Supabase dashboard for duplicate users

### "Email not confirmed"

- User hasn't clicked verification link
- Resend verification email from login page
- Check email spam folder
- Verify redirect URL is configured (for email link to work)

### Session not persisting across page reloads

- Check browser localStorage is enabled
- Verify httpOnly cookies are being set (check dev tools > Storage)
- Check `persistSession: true` in supabase-auth.ts config

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [JWT Token Format](https://tools.ietf.org/html/rfc7519)
- [GDPR Compliance Guide](https://gdpr-info.eu/)
- [COPPA Compliance (US Child Privacy)](https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy)

## Implementation Checklist

- [ ] Set NEXT_PUBLIC_SUPABASE_URL in .env.local
- [ ] Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
- [ ] Enable Email provider in Supabase Dashboard
- [ ] Configure redirect URLs in Supabase
- [ ] Configure email templates (optional)
- [ ] Set session timeout to 3600 seconds (1 hour)
- [ ] Enable refresh token rotation
- [ ] Create auth UI components (signup, login, logout)
- [ ] Create middleware to protect routes
- [ ] Test email verification flow
- [ ] Test password reset flow
- [ ] Test automatic token refresh
- [ ] Verify GDPR compliance in signup flow
- [ ] Test on mobile (Capacitor)
- [ ] Test on production domain before deploying

## Next Steps

After setting up authentication, implement:

1. **Auth UI Pages**: Signup, login, password reset
2. **Protected Middleware**: Redirect unauthenticated users
3. **User Profiles**: Store user data with RLS protection
4. **Session Management**: Handle token expiry gracefully
5. **Error Handling**: User-friendly auth error messages
