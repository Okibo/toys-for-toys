/**
 * Cookie Handler Module
 * Manages secure httpOnly cookie operations for token storage
 *
 * Security Features:
 * - httpOnly flag prevents JavaScript access (XSS protection)
 * - Secure flag requires HTTPS in production
 * - SameSite=Strict prevents CSRF attacks
 * - Path restriction limits scope
 * - Max-Age for automatic expiration
 *
 * Cookie Policy:
 * - Access Token: 24 hours, httpOnly, Secure, SameSite=Strict
 * - Refresh Token: 7 days, httpOnly, Secure, SameSite=Strict
 */

/**
 * Cookie options interface
 */
export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
  maxAge: number; // in seconds
  path: string;
}

/**
 * Default cookie options for authentication tokens
 */
const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 86400, // 24 hours
  path: '/'
};

/**
 * Cookie configuration for different token types
 */
const COOKIE_CONFIG = {
  accessToken: {
    name: '__auth_access',
    maxAge: 24 * 60 * 60 // 24 hours in seconds
  },
  refreshToken: {
    name: '__auth_refresh',
    maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
  }
};

/**
 * Build Set-Cookie header value
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 * @returns Set-Cookie header value
 */
function buildSetCookieHeader(name: string, value: string, options: CookieOptions): string {
  let header = `${name}=${value}`;

  if (options.maxAge) {
    header += `; Max-Age=${options.maxAge}`;
  }

  if (options.path) {
    header += `; Path=${options.path}`;
  }

  if (options.secure) {
    header += '; Secure';
  }

  if (options.httpOnly) {
    header += '; HttpOnly';
  }

  if (options.sameSite) {
    header += `; SameSite=${options.sameSite}`;
  }

  return header;
}

/**
 * Set access and refresh tokens in httpOnly cookies
 * Should be called in API route handlers
 *
 * Example usage:
 * ```typescript
 * export async function POST(req: Request) {
 *   const res = new Response(JSON.stringify({ success: true }));
 *   setTokenCookies(res, accessToken, refreshToken);
 *   return res;
 * }
 * ```
 *
 * @param res - Response object
 * @param accessToken - Access token value
 * @param refreshToken - Refresh token value
 */
export function setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
  if (!(res instanceof Response)) {
    throw new Error('Invalid response object');
  }

  const accessOptions: CookieOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    maxAge: COOKIE_CONFIG.accessToken.maxAge
  };

  const refreshOptions: CookieOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    maxAge: COOKIE_CONFIG.refreshToken.maxAge
  };

  // Set access token cookie
  const accessCookie = buildSetCookieHeader(
    COOKIE_CONFIG.accessToken.name,
    accessToken,
    accessOptions
  );

  // Set refresh token cookie
  const refreshCookie = buildSetCookieHeader(
    COOKIE_CONFIG.refreshToken.name,
    refreshToken,
    refreshOptions
  );

  // Append to Set-Cookie header
  res.headers.append('Set-Cookie', accessCookie);
  res.headers.append('Set-Cookie', refreshCookie);
}

/**
 * Get cookie value from request
 * Works with both Request object and NextRequest
 *
 * @param req - Request object (either fetch API or Next.js)
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookieFromRequest(req: Request | any, name: string): string | null {
  try {
    // Try NextRequest.cookies (Next.js)
    if (req.cookies && typeof req.cookies.get === 'function') {
      const cookie = req.cookies.get(name);
      return cookie?.value || null;
    }

    // Try Cookie header (standard)
    const cookieHeader = req.headers?.get?.('cookie') || req.headers?.cookie;
    if (!cookieHeader) {
      return null;
    }

    // Parse Cookie header
    const cookies = cookieHeader.split(';').map((c: string) => c.trim());
    for (const cookie of cookies) {
      const [cookieName, ...cookieValue] = cookie.split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue.join('='));
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get access token from request
 *
 * @param req - Request object
 * @returns Access token or null
 */
export function getAccessTokenFromRequest(req: Request | any): string | null {
  return getCookieFromRequest(req, COOKIE_CONFIG.accessToken.name);
}

/**
 * Get refresh token from request
 *
 * @param req - Request object
 * @returns Refresh token or null
 */
export function getRefreshTokenFromRequest(req: Request | any): string | null {
  return getCookieFromRequest(req, COOKIE_CONFIG.refreshToken.name);
}

/**
 * Clear authentication cookies (logout)
 * Sets Max-Age=0 to delete cookies
 *
 * @param res - Response object
 */
export function clearTokenCookies(res: Response): void {
  if (!(res instanceof Response)) {
    throw new Error('Invalid response object');
  }

  const clearOptions: CookieOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    maxAge: 0
  };

  const accessCookie = buildSetCookieHeader(
    COOKIE_CONFIG.accessToken.name,
    '',
    clearOptions
  );

  const refreshCookie = buildSetCookieHeader(
    COOKIE_CONFIG.refreshToken.name,
    '',
    clearOptions
  );

  res.headers.append('Set-Cookie', accessCookie);
  res.headers.append('Set-Cookie', refreshCookie);
}

/**
 * Get cookie configuration object
 * Useful for other modules that need to set custom cookies
 *
 * @param type - Cookie type ('access' or 'refresh')
 * @returns Cookie options
 */
export function getCookieOptions(type: 'access' | 'refresh'): CookieOptions {
  const baseOptions = { ...DEFAULT_COOKIE_OPTIONS };

  if (type === 'access') {
    return {
      ...baseOptions,
      maxAge: COOKIE_CONFIG.accessToken.maxAge
    };
  }

  return {
    ...baseOptions,
    maxAge: COOKIE_CONFIG.refreshToken.maxAge
  };
}

/**
 * Get Set-Cookie header value for manual cookie setting
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param type - Token type ('access' or 'refresh')
 * @returns Set-Cookie header value
 */
export function getSetCookieHeader(
  name: string,
  value: string,
  type: 'access' | 'refresh' = 'access'
): string {
  const options = getCookieOptions(type);
  return buildSetCookieHeader(name, value, options);
}

/**
 * Check if request contains valid authentication cookies
 *
 * @param req - Request object
 * @returns True if both access and refresh tokens are present
 */
export function hasAuthCookies(req: Request | any): boolean {
  const accessToken = getAccessTokenFromRequest(req);
  const refreshToken = getRefreshTokenFromRequest(req);

  return !!(accessToken && refreshToken);
}

/**
 * Get all auth cookies as object
 *
 * @param req - Request object
 * @returns Object with access and refresh tokens
 */
export function getAuthCookies(req: Request | any): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  return {
    accessToken: getAccessTokenFromRequest(req),
    refreshToken: getRefreshTokenFromRequest(req)
  };
}

/**
 * Parse cookie header string into key-value pairs
 * Utility function for manual cookie parsing
 *
 * @param cookieHeader - Cookie header value
 * @returns Object with cookie names as keys and values
 */
export function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...value] = cookie.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(value.join('='));
    }
  });

  return cookies;
}
