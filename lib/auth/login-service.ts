/**
 * Login Service Layer
 * Handles user authentication and credential verification
 */

import { getSupabaseAuth, getSupabaseServerClient } from '@/lib/auth/supabase-server';

export interface LoginResult {
  success: true;
  user_id: string;
  email: string;
}

export interface LoginError {
  success: false;
  code: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'USER_NOT_FOUND' | 'SERVICE_ERROR';
  message: string;
}

/**
 * Verify user email is verified in profile
 */
async function isEmailVerified(userId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_email_verified')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking email verification:', error);
      return false;
    }

    return data?.is_email_verified === true;
  } catch (error) {
    console.error('Exception checking email verification:', error);
    return false;
  }
}

/**
 * Authenticate user with email and password via Supabase Auth
 * Returns user info if successful
 */
async function authenticateWithSupabase(
  email: string,
  password: string
): Promise<{ userId: string; email: string } | null> {
  const auth = getSupabaseAuth();

  try {
    // Use Supabase signInWithPassword to verify credentials
    const { data, error } = await auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.warn(`Login failed for ${email}: Invalid credentials`);
      return null;
    }

    return {
      userId: data.user.id,
      email: data.user.email || email,
    };
  } catch (error) {
    console.error('Exception during authentication:', error);
    return null;
  }
}

/**
 * Log login attempt (success or failure) for audit trail
 */
async function logLoginAttempt(
  email: string,
  success: boolean,
  userId?: string,
  ipAddress?: string
): Promise<void> {
  const supabase = getSupabaseServerClient();

  try {
    await supabase.from('audit_logs').insert([
      {
        action: 'login_attempt',
        success,
        email,
        user_id: userId || null,
        ip_address: ipAddress || null,
        timestamp: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    // Log audit errors but don't fail the login process
    console.error('Failed to log login attempt:', error);
  }
}

/**
 * Main login handler
 * Validates email/password, checks email verification, and returns user info
 */
export async function loginUser(
  email: string,
  password: string,
  ipAddress?: string
): Promise<LoginResult | LoginError> {
  try {
    // Authenticate with Supabase
    const authResult = await authenticateWithSupabase(email, password);

    if (!authResult) {
      await logLoginAttempt(email, false, undefined, ipAddress);
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      };
    }

    const { userId } = authResult;

    // Check if email is verified
    const emailVerified = await isEmailVerified(userId);

    if (!emailVerified) {
      await logLoginAttempt(email, false, userId, ipAddress);
      return {
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address first',
      };
    }

    // Log successful login
    await logLoginAttempt(email, true, userId, ipAddress);

    return {
      success: true,
      user_id: userId,
      email: authResult.email,
    };
  } catch (error) {
    console.error('Login service error:', error);
    return {
      success: false,
      code: 'SERVICE_ERROR',
      message: 'An error occurred during login',
    };
  }
}

/**
 * Verify that a user exists (without exposing whether email exists)
 * Used for login error messages to prevent email enumeration
 */
export async function userExistsByEmail(email: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (error?.code === 'PGRST116') {
      // "no rows" error - user doesn't exist
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking user existence:', error);
    // On database error, assume user exists for safety
    return true;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, is_email_verified, language')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}
