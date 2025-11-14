/**
 * lib/auth-types.ts
 *
 * TypeScript types for Supabase authentication.
 * Defines the shape of auth-related data structures used throughout the application.
 *
 * These types are aligned with:
 * - Supabase Auth API responses
 * - Next.js auth-helpers expectations
 * - GDPR compliance (child data handling)
 */

/**
 * Represents a Supabase authenticated user.
 * Contains user identity and metadata from the auth system.
 *
 * IMPORTANT: This is returned by Supabase Auth and should NOT be confused
 * with profile data (which is stored separately in the profiles table).
 */
export interface AuthUser {
  /** Unique user identifier (UUID) from auth.users table */
  id: string;

  /** User's email address (required for email/password auth) */
  email: string;

  /** User's phone number (optional, set during signup or profile setup) */
  phone?: string;

  /** Custom user metadata stored by the application
   *  Can include: full_name, avatar_url, locale, theme_preference, etc.
   *  GDPR: Only include non-sensitive metadata here
   */
  user_metadata?: Record<string, unknown>;

  /** App-specific metadata (set by admin, not user-editable)
   *  GDPR: Use this for parental consent, age group classification
   */
  app_metadata?: Record<string, unknown>;

  /** JWT audience claim - identifies which Supabase instance user belongs to */
  aud: string;

  /** ISO timestamp when user account was created */
  created_at: string;

  /** ISO timestamp of user's last sign-in */
  last_sign_in_at?: string;

  /** Whether user's email is confirmed (false until email verification link clicked) */
  email_confirmed_at?: string;

  /** Whether user's phone is confirmed (optional) */
  phone_confirmed_at?: string;

  /** User's confirm status
   *  - null: Email verification pending
   *  - "email": Email verified
   *  - "phone": Phone verified
   */
  confirmed_at?: string | null;
}

/**
 * Represents an authenticated session with JWT tokens.
 * Automatically managed by @supabase/auth-helpers-nextjs via httpOnly cookies.
 *
 * IMPORTANT: Tokens are never exposed to JavaScript in secure mode.
 * Token refresh happens automatically on API requests and route changes.
 */
export interface AuthSession {
  /** JWT access token (short-lived, ~1 hour)
   *  Contains user claims including sub (user_id), email, aud
   *  Used for API authentication via Authorization: Bearer header
   */
  access_token: string;

  /** Refresh token (long-lived, ~30 days)
   *  Used to obtain new access tokens without re-authenticating
   *  Stored securely in httpOnly cookie
   */
  refresh_token: string;

  /** Number of seconds until access_token expires
   *  Default: 3600 (1 hour)
   */
  expires_in: number;

  /** Token type (always "Bearer")
   *  Used in HTTP Authorization header: "Authorization: Bearer {access_token}"
   */
  token_type: string;

  /** Authenticated user object associated with this session */
  user: AuthUser;

  /** ISO timestamp when session was created */
  created_at?: string;

  /** ISO timestamp when session expires */
  expires_at?: string;
}

/**
 * Payload for user signup with email and password.
 * Used when creating new user accounts during registration.
 *
 * GDPR Compliance:
 * - full_name is optional but recommended for parental identification
 * - Parental consent flag should be stored separately in app_metadata
 * - No child personal data should be included in signup
 */
export interface SignUpPayload {
  /** User's email address (will be used for login)
   *  Must be a valid, unique email
   *  Verification email will be sent unless auto-confirm is enabled
   */
  email: string;

  /** User's password (will be hashed via bcrypt with Supabase)
   *  Requirements (can be configured in Supabase):
   *  - Minimum length (default: 6 characters)
   *  - Can enforce complexity rules
   *  SECURITY: Never log or transmit in plain text
   */
  password: string;

  /** User's full name (optional, stored in user_metadata)
   *  For Toy-for-Toy: Use for account owner name (parent/guardian)
   *  Child data should NOT be stored in auth metadata
   */
  full_name?: string;

  /** Custom metadata for signup (optional)
   *  GDPR: Use for storing parent consent, parental controls preference
   *  Example: { parental_consent: true, lang: 'en' }
   */
  data?: Record<string, unknown>;
}

/**
 * Payload for user login with email and password.
 * Used when existing users authenticate.
 */
export interface LoginPayload {
  /** Email address associated with the account */
  email: string;

  /** Password for the account (sent securely via HTTPS only)
   *  SECURITY: Never stored in plain text anywhere
   */
  password: string;
}

/**
 * Payload for password reset request.
 * Initiates password recovery flow via email.
 */
export interface PasswordResetPayload {
  /** Email address of account to reset password for */
  email: string;

  /** Redirect URL after password reset link is clicked
   *  Should point to a route like /auth/reset-password
   *  SECURITY: Must be a registered redirect URL in Supabase
   */
  redirectUrl?: string;
}

/**
 * Payload for confirming new password after reset.
 * Used after user clicks password reset email link.
 */
export interface PasswordResetConfirmPayload {
  /** New password to set */
  password: string;

  /** Confirmation of new password (for UI validation) */
  passwordConfirmation: string;

  /** Access token from password reset email link
   *  Usually extracted from query params: ?token=...
   */
  token?: string;
}

/**
 * Structured error response from authentication operations.
 * Returned by Supabase Auth and should be normalized by the application.
 *
 * SECURITY: Never expose sensitive error details to frontend users.
 * Log full errors server-side, show generic messages to users.
 */
export interface AuthError {
  /** Machine-readable error code for client-side handling
   *  Examples: "user_not_found", "invalid_credentials", "email_not_confirmed"
   *  SECURITY: Safe to expose to client
   */
  code: string;

  /** Human-readable error message (varies, can change without notice)
   *  SECURITY: Good for logging, avoid using for client-side logic
   */
  message: string;

  /** HTTP status code if this is an API error */
  status?: number;

  /** Original error from Supabase (for debugging, server-side only) */
  originalError?: Error | unknown;
}

/**
 * Authentication state object used in hooks and context.
 * Represents the current authentication state of the user.
 *
 * Usage:
 * ```typescript
 * const [authState, setAuthState] = useState<AuthState>({
 *   session: null,
 *   user: null,
 *   loading: true,
 *   error: null,
 * });
 * ```
 */
export interface AuthState {
  /** Current session (null if not authenticated) */
  session: AuthSession | null;

  /** Current authenticated user (null if not authenticated) */
  user: AuthUser | null;

  /** True while auth state is being determined on app startup */
  loading: boolean;

  /** Auth error (null if no error) */
  error: AuthError | null;

  /** True if user's email has been verified
   *  Important for email confirmation flow
   */
  isEmailConfirmed?: boolean;
}

/**
 * Response from an auth operation (signup, login, password reset, etc.)
 * Provides structured result with either data or error, never both.
 */
export interface AuthOperationResult<T = AuthSession> {
  /** Operation succeeded - contains the result data */
  success: boolean;

  /** Result data on success (null on error) */
  data: T | null;

  /** Error on failure (null on success) */
  error: AuthError | null;

  /** User message for client display (safe to show to users) */
  message?: string;
}

/**
 * Email template types used by Supabase Auth.
 * These can be customized in Supabase dashboard.
 */
export type EmailTemplateType =
  | 'confirmation' // Email confirmation on signup
  | 'recovery' // Password reset
  | 'magic_link' // Passwordless auth (magic link)
  | 'invite'; // Admin invitation

/**
 * Authentication configuration options.
 * Used to initialize Supabase client with auth-specific settings.
 */
export interface AuthConfig {
  /** Supabase project URL (from environment variable) */
  url: string;

  /** Supabase anonymous API key (from environment variable) */
  anonKey: string;

  /** Session timeout in seconds (default: 3600 = 1 hour)
   *  After this time, user must re-authenticate
   */
  sessionTimeout?: number;

  /** Redirect URL after successful authentication
   *  Should be a protected route that checks for session
   */
  redirectUrl?: string;

  /** Redirect URL for password reset flow
   *  Should be a page with form to enter new password
   */
  resetPasswordUrl?: string;

  /** Whether to automatically refresh tokens
   *  Enabled by default; auth-helpers handles this
   */
  autoRefreshToken?: boolean;

  /** Whether to persist session across browser tabs
   *  Enabled by default for better UX
   */
  persistSession?: boolean;

  /** Detection method for auth state changes
   *  'broadcast' (default): Uses localStorage, works across tabs
   *  'polling': Periodic server checks (slower, more reliable)
   *  'none': No automatic detection
   */
  detectSessionInUrl?: boolean;
}
