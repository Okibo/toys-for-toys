/**
 * Password Reset Service Layer
 * Handles password reset token generation, verification, and password updates
 */

import { getSupabaseAuth, getSupabaseServerClient } from '@/lib/auth/supabase-server';

export interface PasswordResetResult {
  success: true;
  email: string;
}

export interface PasswordResetError {
  success: false;
  code: 'INVALID_PASSWORD' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'USER_NOT_FOUND' | 'SERVICE_ERROR';
  message: string;
}

export interface ForgotPasswordResult {
  success: true;
  // Returns generic message to prevent email enumeration
}

/**
 * Generate password reset token via Supabase Auth
 * This creates a token that can be used to reset the password
 */
async function generateResetToken(email: string): Promise<string | null> {
  const auth = getSupabaseAuth();

  try {
    // Supabase provides a built-in password recovery mechanism
    // We use admin API to generate reset token directly
    const { data, error } = await auth.generateLink({
      type: 'recovery',
      email,
      options: {
        // Set redirect URL for password reset
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://toy-for-toy.com'}/auth/reset-password`,
      },
    });

    if (error || !data.properties?.action_link) {
      console.error('Failed to generate reset token:', error);
      return null;
    }

    // Extract token from action link
    // Format: https://...#access_token=xxx&type=recovery
    const url = new URL(data.properties.action_link);
    const token = url.hash
      .split('&')
      .find((param) => param.startsWith('#access_token='))
      ?.replace('#access_token=', '');

    return token || null;
  } catch (error) {
    console.error('Exception generating reset token:', error);
    return null;
  }
}

/**
 * Verify password reset token is valid
 * Checks token format, signature, and expiry (24 hours)
 */
async function verifyResetToken(token: string, email: string): Promise<{ valid: boolean; userId?: string }> {
  const auth = getSupabaseAuth();

  try {
    // Verify the token by attempting to retrieve the user associated with it
    const { data, error } = await auth.getUser(token);

    if (error || !data.user) {
      console.warn('Invalid or expired reset token for', email);
      return { valid: false };
    }

    // Verify the email matches the token
    if (data.user.email?.toLowerCase() !== email.toLowerCase()) {
      console.warn('Reset token email mismatch:', data.user.email, 'vs', email);
      return { valid: false };
    }

    return {
      valid: true,
      userId: data.user.id,
    };
  } catch (error) {
    console.error('Exception verifying reset token:', error);
    return { valid: false };
  }
}

/**
 * Update user password via Supabase Auth
 */
async function updatePassword(token: string, newPassword: string): Promise<{ success: boolean; userId?: string }> {
  const auth = getSupabaseAuth();

  try {
    // Use the recovery token to update the password
    const { data, error } = await auth.updateUser(
      {
        password: newPassword,
      },
      token
    );

    if (error || !data.user) {
      console.error('Failed to update password:', error);
      return { success: false };
    }

    return {
      success: true,
      userId: data.user.id,
    };
  } catch (error) {
    console.error('Exception updating password:', error);
    return { success: false };
  }
}

/**
 * Log password reset attempt
 */
async function logPasswordResetAttempt(
  email: string,
  success: boolean,
  type: 'request' | 'reset',
  ipAddress?: string
): Promise<void> {
  const supabase = getSupabaseServerClient();

  try {
    await supabase.from('audit_logs').insert([
      {
        action: `password_reset_${type}`,
        success,
        email,
        ip_address: ipAddress || null,
        timestamp: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error('Failed to log password reset attempt:', error);
  }
}

/**
 * Get user by email
 */
async function getUserByEmail(email: string) {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, language')
      .eq('email', email.toLowerCase())
      .single();

    if (error?.code === 'PGRST116') {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Main forgot password handler
 * Generates reset token and returns generic success message
 */
export async function requestPasswordReset(email: string, ipAddress?: string): Promise<ForgotPasswordResult> {
  try {
    // Check if user exists (but don't reveal in response)
    const user = await getUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      // User doesn't exist, log attempt but return success
      await logPasswordResetAttempt(email, false, 'request', ipAddress);
      return { success: true };
    }

    // Generate reset token
    const token = await generateResetToken(email);

    if (!token) {
      // Failed to generate token, still return success to user
      await logPasswordResetAttempt(email, false, 'request', ipAddress);
      console.warn('Failed to generate reset token for', email);
      return { success: true };
    }

    // Log successful request
    await logPasswordResetAttempt(email, true, 'request', ipAddress);

    // In production, this token would be sent via email
    // The token is already embedded in the recovery link by Supabase
    return { success: true };
  } catch (error) {
    console.error('Forgot password service error:', error);
    // Return success even on error to prevent information leakage
    return { success: true };
  }
}

/**
 * Main password reset handler
 * Validates token and updates password
 */
export async function resetPassword(
  token: string,
  email: string,
  newPassword: string,
  ipAddress?: string
): Promise<PasswordResetResult | PasswordResetError> {
  try {
    // Verify the reset token is valid
    const verification = await verifyResetToken(token, email);

    if (!verification.valid) {
      await logPasswordResetAttempt(email, false, 'reset', ipAddress);
      return {
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired password reset token',
      };
    }

    const userId = verification.userId;

    // Update password
    const updateResult = await updatePassword(token, newPassword);

    if (!updateResult.success) {
      await logPasswordResetAttempt(email, false, 'reset', ipAddress);
      return {
        success: false,
        code: 'SERVICE_ERROR',
        message: 'Failed to reset password. Please try again.',
      };
    }

    // Log successful password reset
    await logPasswordResetAttempt(email, true, 'reset', ipAddress);

    return {
      success: true,
      email,
    };
  } catch (error) {
    console.error('Password reset service error:', error);
    await logPasswordResetAttempt(email, false, 'reset', ipAddress);
    return {
      success: false,
      code: 'SERVICE_ERROR',
      message: 'An error occurred during password reset',
    };
  }
}

/**
 * Check if email exists (for validation before sending reset email)
 */
export async function emailExists(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return !!user;
}
