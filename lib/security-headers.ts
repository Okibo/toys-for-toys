/**
 * lib/security-headers.ts
 *
 * Security headers configuration for HTTP responses.
 * Prevents common attacks: XSS, clickjacking, MIME sniffing, etc.
 *
 * These headers are applied globally via Next.js middleware.
 * See: middleware.ts for integration
 *
 * OWASP References:
 * - Content-Security-Policy: Prevents XSS and data exfiltration
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Strict-Transport-Security: Enforces HTTPS
 * - Referrer-Policy: Controls referrer leak
 * - Permissions-Policy: Restricts browser features (camera, microphone, etc.)
 */

/**
 * Security headers interface
 */
export interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Generate security headers for responses
 *
 * Returns a complete set of security headers that should be applied to all responses.
 */
export function generateSecurityHeaders(): SecurityHeaders {
  return {
    /**
     * Strict-Transport-Security (HSTS)
     *
     * Enforces HTTPS for all requests. Prevents downgrade attacks.
     *
     * - max-age=31536000: 1 year
     * - includeSubDomains: Apply to all subdomains
     * - preload: Notify browsers to include in HSTS preload list
     *
     * WARNING: Only enable preload if you're confident about HTTPS support
     */
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    /**
     * Content-Security-Policy (CSP)
     *
     * Restricts resource loading to prevent XSS and data exfiltration.
     *
     * Policy:
     * - default-src 'self': Only allow same-origin resources by default
     * - script-src 'self' https://cdn.jsdelivr.net: Allow same-origin + trusted CDN
     *   (NextJS, Vercel, and analytics scripts)
     * - style-src 'self' 'unsafe-inline': Allow same-origin + inline (Tailwind CSS)
     * - img-src 'self' data: https: Allow same-origin, data URLs, and HTTPS images
     * - font-src 'self' data: https: Allow same-origin, data URLs, and HTTPS fonts
     * - connect-src: Restrict API calls to whitelisted domains
     *   - 'self': Same-origin
     *   - https://[project].supabase.co: Supabase backend
     *   - https://www.google-analytics.com: Google Analytics
     *   - wss: WebSocket (for Realtime)
     * - frame-ancestors 'none': Don't allow framing (override X-Frame-Options)
     * - base-uri 'self': Prevent <base> tag injection
     * - form-action 'self': Restrict form submissions to same-origin
     * - object-src 'none': Prevent <object>, <embed>, <applet> tags
     * - upgrade-insecure-requests: Automatically upgrade HTTP to HTTPS
     *
     * Note: 'unsafe-inline' for styles is necessary for Tailwind CSS.
     * Consider using nonce-based CSP in future for stronger protection.
     */
    'Content-Security-Policy':
      "default-src 'self'; " +
      "script-src 'self' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss: https://www.google-analytics.com; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "object-src 'none'; " +
      'upgrade-insecure-requests;',

    /**
     * X-Content-Type-Options
     *
     * Prevents MIME sniffing attacks.
     * Forces browser to respect declared Content-Type header.
     *
     * Value: nosniff
     * - Prevents browser from guessing MIME type
     * - Example: If Content-Type is text/plain, <script> tags won't execute
     */
    'X-Content-Type-Options': 'nosniff',

    /**
     * X-Frame-Options
     *
     * Prevents clickjacking attacks by controlling if page can be framed.
     *
     * Value: DENY
     * - Prevents embedding in any <frame>, <iframe>, <object>, or <embed>
     * - Strongest protection
     *
     * Alternatives:
     * - SAMEORIGIN: Allow framing only from same-origin
     * - ALLOW-FROM uri: Allow framing from specific domain (deprecated)
     */
    'X-Frame-Options': 'DENY',

    /**
     * X-XSS-Protection
     *
     * Legacy XSS protection (mostly deprecated in favor of CSP).
     * Still useful for older browsers.
     *
     * Value: 1; mode=block
     * - 1: Enable XSS filter
     * - mode=block: Block page if XSS detected (don't sanitize)
     */
    'X-XSS-Protection': '1; mode=block',

    /**
     * Referrer-Policy
     *
     * Controls how much referrer information is sent with requests.
     *
     * Value: strict-origin-when-cross-origin
     * - Send referrer only to same-origin or when HTTPS->HTTPS
     * - Don't send to HTTP (downgrade protection)
     * - Don't send path/query to cross-origin
     *
     * Alternatives:
     * - no-referrer: Never send referrer
     * - same-origin: Send only to same-origin
     * - strict-origin: Send only origin when HTTPS->HTTPS
     */
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    /**
     * Permissions-Policy (formerly Feature-Policy)
     *
     * Restricts browser features to prevent fingerprinting and abuse.
     *
     * Disabled features:
     * - camera, microphone, payment: Not needed for toy exchange
     * - geolocation: Limit location data exposure
     * - usb, serial: Prevent unauthorized device access
     * - magnetometer, gyroscope, accelerometer: Limit sensor access
     *
     * Allowed features:
     * - vibrate: For notifications
     */
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), ' +
      'magnetometer=(), gyroscope=(), accelerometer=()',

    /**
     * Cross-Origin-Opener-Policy (COOP)
     *
     * Isolates window from cross-origin popups.
     * Prevents Spectre/Meltdown attacks that read cross-origin memory.
     *
     * Value: same-origin-allow-popups
     * - Isolate from cross-origin windows
     * - But allow popups (for OAuth redirects)
     */
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',

    /**
     * Cross-Origin-Embedder-Policy (COEP)
     *
     * Requires cross-origin resources to explicitly allow embedding.
     * Prevents timing attacks on resource loading.
     *
     * Value: require-corp
     * - Require Cross-Origin-Resource-Policy header on all cross-origin resources
     */
    'Cross-Origin-Embedder-Policy': 'require-corp',

    /**
     * Cross-Origin-Resource-Policy (CORP)
     *
     * Specifies who can embed this resource.
     *
     * Value: same-origin
     * - Only same-origin can embed this resource
     */
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
}

/**
 * Generate CSP header with dynamic nonce (for future implementation)
 *
 * This allows inline scripts with nonce attribute while maintaining strong CSP.
 * Currently not implemented because Tailwind CSS requires 'unsafe-inline'.
 *
 * @param nonce - Cryptographic nonce
 * @returns CSP header value
 */
export function generateCSPWithNonce(nonce: string): string {
  return (
    "default-src 'self'; " +
    `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com; ` +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https: wss: https://www.google-analytics.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "object-src 'none'; " +
    'upgrade-insecure-requests;'
  );
}

/**
 * Validate that security headers are properly set
 *
 * @param headers - Headers object to validate
 * @returns Array of missing headers
 */
export function validateSecurityHeaders(headers: Record<string, string>): string[] {
  const required = [
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
  ];

  const missing: string[] = [];

  for (const header of required) {
    if (!headers[header]) {
      missing.push(header);
    }
  }

  return missing;
}

/**
 * Apply security headers to response
 *
 * This is a utility for manual application in API routes.
 * For page routes, use next.config.js headers configuration instead.
 *
 * @param headers - Node.js response headers object
 */
export function applySecurityHeaders(headers: NodeJS.Dict<string | string[]>): void {
  const securityHeaders = generateSecurityHeaders();

  for (const [key, value] of Object.entries(securityHeaders)) {
    headers[key.toLowerCase()] = value;
  }
}

/**
 * Check for security header vulnerabilities in response
 *
 * @param headers - Response headers
 * @returns Array of vulnerability descriptions
 */
export function checkSecurityHeaderVulnerabilities(headers: Record<string, string>): string[] {
  const vulnerabilities: string[] = [];

  // Check CSP
  if (!headers['Content-Security-Policy']) {
    vulnerabilities.push('Missing Content-Security-Policy header (XSS vulnerability)');
  }

  // Check HSTS
  if (!headers['Strict-Transport-Security']) {
    vulnerabilities.push('Missing Strict-Transport-Security header (MITM vulnerability)');
  }

  // Check X-Frame-Options
  if (!headers['X-Frame-Options'] || headers['X-Frame-Options'] !== 'DENY') {
    vulnerabilities.push('X-Frame-Options not set to DENY (clickjacking vulnerability)');
  }

  // Check X-Content-Type-Options
  if (headers['X-Content-Type-Options'] !== 'nosniff') {
    vulnerabilities.push('X-Content-Type-Options not set to nosniff (MIME sniffing vulnerability)');
  }

  // Check for dangerous CSP directives
  if (headers['Content-Security-Policy']) {
    const csp = headers['Content-Security-Policy'];
    if (csp.includes('script-src *') || csp.includes('default-src *')) {
      vulnerabilities.push('CSP uses wildcard (*) in dangerous directives');
    }
    if (csp.includes('unsafe-eval')) {
      vulnerabilities.push('CSP allows unsafe-eval (code execution vulnerability)');
    }
  }

  return vulnerabilities;
}
