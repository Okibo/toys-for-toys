/**
 * POST /api/auth/signup
 * User registration endpoint
 *
 * Accepts: { email, password, language? }
 * Returns: 200 { success, data: { user_id, email, is_email_verified } }
 *          400 { success: false, error }
 *          409 { success: false, error }
 *          500 { success: false, error }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEmail, getNormalizedEmail } from '@/lib/auth/email-validator';
import { validatePassword } from '@/lib/auth/password-validator';
import { isSignupAllowed, getRateLimitHeaders, SIGNUP_RATE_LIMIT } from '@/lib/auth/rate-limiter';
import { getSupabaseServerClient, getSupabaseAuth } from '@/lib/auth/supabase-server';
import { generateVerificationCode, getCodeExpiryTime } from '@/lib/auth/verification-code';
import { generateVerificationEmail, getVerificationEmailSubject } from '@/lib/email/verification-template';
import { sendEmail } from '@/lib/email/send-email';
import type {
  SignupRequest,
  SignupResponse,
  SignupErrorResponse,
} from '@/lib/auth/types';

/**
 * Get client IP address from request
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Check if email already exists in profiles table
 */
async function emailExists(email: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    // If error is "no rows", email doesn't exist
    if (error?.code === 'PGRST116') {
      return false;
    }

    // If there's data, email exists
    return !!data;
  } catch {
    // If there's a database error, assume email might exist for safety
    throw new Error('Database error checking email uniqueness');
  }
}

/**
 * Create user in Supabase Auth
 */
async function createAuthUser(email: string, password: string) {
  const auth = getSupabaseAuth();

  const { data, error } = await auth.createUser({
    email,
    password,
    email_confirm: false, // User must verify email
  });

  if (error) {
    throw new Error(`Auth user creation failed: ${error.message}`);
  }

  return data.user;
}

/**
 * Create profile record
 */
async function createProfile(userId: string, email: string, language: string = 'en') {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.from('profiles').insert([
    {
      id: userId,
      email,
      is_email_verified: false,
      language,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    throw new Error(`Profile creation failed: ${error.message}`);
  }

  return data;
}

/**
 * Create initial ticket record (10 tickets for new users)
 */
async function createTickets(userId: string) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.from('tickets').insert([
    {
      user_id: userId,
      balance: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    throw new Error(`Ticket record creation failed: ${error.message}`);
  }

  return data;
}

/**
 * Store verification code in database
 */
async function storeVerificationCode(email: string, code: string, expiresAt: string) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.from('verification_codes').insert([
    {
      email,
      code,
      expires_at: expiresAt,
      attempts: 0,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    throw new Error(`Verification code storage failed: ${error.message}`);
  }

  return data;
}

/**
 * Handle signup request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse | SignupErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      },
    });
  }

  const clientIp = getClientIp(req);

  // Check rate limit
  if (!isSignupAllowed(clientIp)) {
    const headers = getRateLimitHeaders('signup', clientIp, SIGNUP_RATE_LIMIT);
    return res.status(429).set(headers).json({
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many signup attempts. Please try again later.',
        details: [`Reset in ${headers['Retry-After']} seconds`],
      },
    });
  }

  try {
    const { email, password, language = 'en' } = req.body as SignupRequest;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email address',
          details: emailValidation.errors,
        },
      });
    }

    const normalizedEmail = getNormalizedEmail(email) || email;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet security requirements',
          details: passwordValidation.errors,
        },
      });
    }

    // Check if email already exists
    const exists = await emailExists(normalizedEmail);
    if (exists) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'An account with this email address already exists',
          details: ['Please use a different email or try logging in'],
        },
      });
    }

    // Create auth user
    const authUser = await createAuthUser(normalizedEmail, password);

    // Create profile record
    await createProfile(authUser.id, normalizedEmail, language);

    // Create initial tickets
    await createTickets(authUser.id);

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = getCodeExpiryTime();

    // Store verification code
    await storeVerificationCode(normalizedEmail, code, expiresAt);

    // Send verification email
    const emailContent = generateVerificationEmail(code, normalizedEmail, language);
    const subject = getVerificationEmailSubject(language);
    await sendEmail({
      to: normalizedEmail,
      subject,
      html: emailContent.html,
      plainText: emailContent.plainText,
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Signup successful. Please check your email to verify your account.',
      data: {
        user_id: authUser.id,
        email: normalizedEmail,
        is_email_verified: false,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Determine if this is a known error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('duplicate key') || errorMessage.includes('Duplicate')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'An account with this email address already exists',
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during signup. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? [errorMessage] : undefined,
      },
    });
  }
}
