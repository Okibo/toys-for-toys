/**
 * Supabase Server Client Module
 * Creates Supabase client with service role key for backend operations
 *
 * CRITICAL: This uses the service_role key which has elevated permissions.
 * Never expose this key to the frontend. Only use in backend API routes.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Get the Supabase URL
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL environment variable is not set. ' +
      'Please configure Supabase credentials in your environment.'
    );
  }
  return url;
}

/**
 * Get the Supabase service role key
 *
 * CRITICAL: This key has elevated permissions and must never be exposed to the client.
 */
function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY environment variable is not set. ' +
      'Please configure Supabase service role key in your environment. ' +
      'This is required for backend authentication operations.'
    );
  }
  return key;
}

/**
 * Singleton instance of Supabase client with service role key
 */
let supabaseServerClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Supabase server client with service role key
 * Uses singleton pattern to avoid recreating client on every request
 *
 * @returns Supabase client with service_role access
 * @throws Error if environment variables are not configured
 */
export function getSupabaseServerClient() {
  if (!supabaseServerClient) {
    const url = getSupabaseUrl();
    const serviceRoleKey = getServiceRoleKey();

    supabaseServerClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseServerClient;
}

/**
 * Get Supabase auth admin interface for elevated operations
 *
 * @returns Supabase auth admin interface
 */
export function getSupabaseAuth() {
  const client = getSupabaseServerClient();
  return client.auth.admin;
}

/**
 * Type exports for database schema
 */
export type Database = any;
