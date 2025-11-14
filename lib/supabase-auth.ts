/**
 * lib/supabase-auth.ts
 *
 * Supabase Authentication client initialization and helpers.
 *
 * This module sets up the Supabase client using @supabase/auth-helpers-nextjs,
 * which provides secure session management with httpOnly cookies.
 *
 * Key Points:
 * - Uses @supabase/auth-helpers-nextjs for automatic token refresh
 * - Tokens stored in secure httpOnly cookies (not accessible to JavaScript)
 * - Session persists across page reloads and browser tabs
 * - Token refresh happens automatically on API requests
 * - No manual JWT handling needed
 *
 * Token Lifecycle:
 * 1. User signs up/logs in → Supabase issues access_token (1 hour) + refresh_token (30 days)
 * 2. Both tokens stored in httpOnly cookies by auth-helpers
 * 3. On route change or API call → auth-helpers checks if access_token expired
 * 4. If expired → automatically calls refresh endpoint using refresh_token
 * 5. New access_token issued, old one discarded
 * 6. If refresh_token expired → user must sign in again
 *
 * Usage in Components:
 * ```typescript
 * import { createClient } from '@supabase/auth-helpers-nextjs';
 * import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
 *
 * // Server-side (API routes, SSR):
 * const supabase = createClient(); // Uses cookies automatically
 * const { data: { session } } = await supabase.auth.getSession();
 *
 * // Client-side (React components):
 * const { session } = useSession(); // Hook provided by auth-helpers
 * const supabase = useSupabaseClient(); // Client with session attached
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthConfig } from './auth-types';

/**
 * Validate that required environment variables are set.
 * Called during module initialization to fail fast if credentials missing.
 *
 * Required Variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous API key
 *
 * These must be set in:
 * - .env.local (development)
 * - .env.production.local (staging/production)
 * - Vercel environment variables (production)
 *
 * @throws Error if required variables are missing
 */
function validateAuthEnvironment(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'This must be set to your Supabase project URL (https://your-project.supabase.co)'
    );
  }

  if (!anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
        'This must be set to your Supabase anonymous API key'
    );
  }

  // Validate URL format
  if (!url.startsWith('https://') || !url.includes('supabase.co')) {
    throw new Error(
      'Invalid NEXT_PUBLIC_SUPABASE_URL format. ' +
        'Must be a valid Supabase project URL like https://your-project.supabase.co'
    );
  }

  // Validate key format (basic check)
  if (anonKey.length < 20) {
    throw new Error(
      'Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format. ' +
        'Key appears to be too short. Check your credentials'
    );
  }
}

/**
 * Initialize and export the Supabase client for authentication.
 *
 * Browser Environment:
 * - Uses @supabase/supabase-js directly
 * - Tokens stored in localStorage (by default, but auth-helpers overrides with cookies)
 * - Automatically handles token refresh
 *
 * Server Environment (API routes, middleware):
 * - Should use createClient from @supabase/auth-helpers-nextjs
 * - Which uses cookies from request context
 * - Automatically includes session in requests
 *
 * SECURITY NOTES:
 * 1. Only anonymous key exposed (NEXT_PUBLIC_* prefix)
 * 2. Service role key never exposed to client
 * 3. All data access protected by RLS policies in database
 * 4. Tokens refreshed automatically without user interaction
 *
 * @returns Initialized Supabase client
 * @throws Error if environment variables not set
 */
function createAuthClient(): SupabaseClient {
  validateAuthEnvironment();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Automatic token refresh when token expires
      autoRefreshToken: true,

      // Persist session across page reloads
      persistSession: true,

      // Detect session in URL (for magic links, password resets)
      detectSessionInUrl: true,

      // Storage backend for tokens (localStorage by default, overridden by auth-helpers in Next.js)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,

      // Store tokens only in localStorage (httpOnly cookies handled by auth-helpers middleware)
      storageKey: 'sb-toys-for-toys-auth-token',

      // Flow type for URL-based auth redirects
      flowType: 'pkce', // More secure than implicit flow
    },

    // Retry configuration for network failures
    global: {
      headers: {
        // Custom header to identify API client (for monitoring)
        'X-Client-Info': 'supabase-auth-client',
      },
    },
  });
}

// Initialize client at module load time
// Validates environment variables immediately, fails fast if missing
let cachedSupabaseAuthClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase auth client.
 * Uses lazy initialization to avoid errors during build time.
 *
 * @returns Initialized Supabase client
 * @throws Error if environment variables not set
 */
export function getSupabaseAuthClient(): SupabaseClient {
  if (!cachedSupabaseAuthClient) {
    cachedSupabaseAuthClient = createAuthClient();
  }
  return cachedSupabaseAuthClient;
}

/**
 * Export the Supabase client for use in components and API routes.
 *
 * IMPORTANT - Usage by Context:
 *
 * BROWSER/CLIENT COMPONENTS:
 * - Use hook from @supabase/auth-helpers-react
 * - Example: const supabase = useSupabaseClient();
 * - This provides client with session attached from cookies
 *
 * API ROUTES (pages/api/):
 * - Use createClient from @supabase/auth-helpers-nextjs with request context
 * - Example: const supabase = createClient({ req, res });
 * - This reads session from cookies in the request
 *
 * MIDDLEWARE (middleware.ts):
 * - Use createMiddlewareClient from @supabase/auth-helpers-nextjs
 * - This protects routes and refreshes tokens before route handler executes
 *
 * DIRECT USAGE (not recommended):
 * - If you must use this directly, ensure you handle sessions manually
 * - Only suitable for unauthenticated operations
 */
export const supabaseAuthClient = getSupabaseAuthClient();

/**
 * Get the current authentication configuration.
 * Returns configuration derived from environment variables.
 *
 * Refresh token rotation ensures security by invalidating old tokens.
 * When refresh_token is used, Supabase automatically rotates it.
 *
 * @returns AuthConfig object with current settings
 */
export function getAuthConfig(): AuthConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    sessionTimeout: 3600, // 1 hour
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  };
}

/**
 * Helper to check if we're in a server or client environment.
 * Useful for conditional logic in isomorphic code.
 *
 * @returns true if running in Node.js environment, false if browser
 */
export function isServerEnvironment(): boolean {
  return typeof window === 'undefined';
}

/**
 * Helper to check if we're in a browser environment.
 *
 * @returns true if running in browser, false if Node.js
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Test the Supabase authentication configuration.
 * Useful for debugging connection issues.
 *
 * IMPORTANT: Call this only in development/debugging.
 * Do NOT call in production code as it may leak information.
 *
 * @returns Object with test results
 */
export async function testSupabaseAuthConnection(): Promise<{
  success: boolean;
  message: string;
  error: string | null;
}> {
  try {
    if (isServerEnvironment()) {
      return {
        success: false,
        message: 'Cannot test auth connection in server environment',
        error: 'Server-side testing not supported. Use Supabase dashboard instead.',
      };
    }

    // Try to get current session (will be null if not authenticated, which is OK)
    const { data, error } = await supabaseAuthClient.auth.getSession();

    if (error) {
      return {
        success: false,
        message: 'Failed to retrieve session',
        error: error.message,
      };
    }

    return {
      success: true,
      message: data.session
        ? 'Connected and authenticated'
        : 'Connected but not authenticated (expected)',
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to test Supabase connection',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default supabaseAuthClient;
