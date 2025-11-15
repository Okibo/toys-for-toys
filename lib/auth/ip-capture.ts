/**
 * IP Capture Module
 * Extracts client IP address from request headers for GDPR audit trail
 */

/**
 * Gets the client IP address from a request
 *
 * Attempts extraction in this order:
 * 1. X-Forwarded-For header (for proxied requests)
 * 2. CF-Connecting-IP header (Cloudflare)
 * 3. X-Client-IP header
 * 4. X-Real-IP header
 * 5. socket.remoteAddress (Node.js native)
 * 6. Returns 'unknown' if none found
 *
 * @param request - Next.js Request object or standard Request
 * @returns Client IP address (cleaned and trimmed)
 */
export function getClientIp(request: Request | any): string {
  // Try X-Forwarded-For header first (most common in load balancers)
  const xForwardedFor = request.headers?.get?.('x-forwarded-for') || request.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // The first IP is the original client IP
    const ips = (xForwardedFor as string).split(',').map(ip => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return cleanIPAddress(ips[0]);
    }
  }

  // Try Cloudflare header
  const cfConnectingIp = request.headers?.get?.('cf-connecting-ip') || request.headers?.['cf-connecting-ip'];
  if (cfConnectingIp) {
    return cleanIPAddress(cfConnectingIp as string);
  }

  // Try X-Client-IP header
  const xClientIp = request.headers?.get?.('x-client-ip') || request.headers?.['x-client-ip'];
  if (xClientIp) {
    return cleanIPAddress(xClientIp as string);
  }

  // Try X-Real-IP header
  const xRealIp = request.headers?.get?.('x-real-ip') || request.headers?.['x-real-ip'];
  if (xRealIp) {
    return cleanIPAddress(xRealIp as string);
  }

  // Try Vercel/other provider headers
  const xVercelForwardedFor = request.headers?.get?.('x-vercel-forwarded-for') || request.headers?.['x-vercel-forwarded-for'];
  if (xVercelForwardedFor) {
    const ips = (xVercelForwardedFor as string).split(',').map(ip => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return cleanIPAddress(ips[0]);
    }
  }

  // Try socket connection (Node.js native - only works in some contexts)
  if ((request as any).socket?.remoteAddress) {
    return cleanIPAddress((request as any).socket.remoteAddress);
  }

  // Try connection info (Edge Functions context)
  if ((request as any).connection?.remoteAddress) {
    return cleanIPAddress((request as any).connection.remoteAddress);
  }

  // Last resort: check for IP in the request object itself
  if ((request as any).ip) {
    return cleanIPAddress((request as any).ip);
  }

  return 'unknown';
}

/**
 * Cleans and validates an IP address string
 *
 * @param ip - The IP address to clean
 * @returns Cleaned IP address
 */
export function cleanIPAddress(ip: string): string {
  if (!ip) {
    return 'unknown';
  }

  // Remove IPv6 prefix if present (e.g., "::ffff:192.168.1.1")
  let cleaned = ip.trim();

  // Remove IPv6 mapped IPv4 prefix
  if (cleaned.startsWith('::ffff:')) {
    cleaned = cleaned.substring(7);
  }

  // If it's a local/private IP in IPv6 format, extract the relevant part
  if (cleaned.includes('::')) {
    // Keep as-is, it's a valid IPv6 address
  } else if (cleaned.includes(':')) {
    // Remove port if present
    const parts = cleaned.split(':');
    cleaned = parts[0];
  }

  return cleaned || 'unknown';
}

/**
 * Checks if an IP address is a private/internal address
 *
 * @param ip - The IP address to check
 * @returns True if the IP is private/internal
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip || ip === 'unknown') {
    return false;
  }

  const privateIPv4Patterns = [
    /^127\./, // Loopback (127.0.0.0/8)
    /^10\./, // Private range (10.0.0.0/8)
    /^172\.(?:1[6-9]|2[0-9]|3[01])\./, // Private range (172.16.0.0/12)
    /^192\.168\./, // Private range (192.168.0.0/16)
    /^169\.254\./, // Link-local (169.254.0.0/16)
  ];

  // IPv6 patterns
  const privateIPv6Patterns = [
    /^::1(?:\/128)?$/, // Loopback
    /^fc00:/i, // Unique local
    /^fe80:/i, // Link-local
    /^::ffff:(?:127\.|10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)/, // IPv4-mapped private
  ];

  for (const pattern of privateIPv4Patterns) {
    if (pattern.test(ip)) {
      return true;
    }
  }

  for (const pattern of privateIPv6Patterns) {
    if (pattern.test(ip)) {
      return true;
    }
  }

  return false;
}

/**
 * Masks an IP address for anonymization while preserving some granularity
 * IPv4: Masks last octet (e.g., 192.168.1.100 -> 192.168.1.0)
 * IPv6: Masks last 80 bits (e.g., 2001:db8::1 -> 2001:db8::0)
 *
 * @param ip - The IP address to mask
 * @returns Masked IP address
 */
export function maskIPAddress(ip: string): string {
  if (!ip || ip === 'unknown') {
    return 'unknown';
  }

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      // Mask the last octet
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  // IPv6
  if (ip.includes(':')) {
    // Mask by replacing last segments with zeros
    const segments = ip.split(':');
    // Keep first 3 segments, zero out the rest
    if (segments.length >= 4) {
      return segments.slice(0, 3).join(':') + '::0';
    }
  }

  return ip;
}

/**
 * Extracts browser/client information from User-Agent header
 *
 * @param userAgent - User-Agent string
 * @returns Object containing detected browser, OS, and device type
 */
export function parseUserAgent(userAgent: string): {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  isBot?: boolean;
} {
  const result: any = {};

  if (!userAgent) {
    return result;
  }

  // Detect bots
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  result.isBot = botPatterns.some(pattern => pattern.test(userAgent));

  // Detect mobile/tablet/desktop
  const mobilePatterns = [/mobile/i, /android/i, /iphone/i, /ipod/i];
  const tabletPatterns = [/tablet/i, /ipad/i, /kindle/i];

  if (tabletPatterns.some(p => p.test(userAgent))) {
    result.deviceType = 'tablet';
  } else if (mobilePatterns.some(p => p.test(userAgent))) {
    result.deviceType = 'mobile';
  } else {
    result.deviceType = 'desktop';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) {
    result.os = 'Windows';
    const winMatch = userAgent.match(/Windows NT ([\d.]+)/);
    if (winMatch) {
      result.osVersion = winMatch[1];
    }
  } else if (/mac/i.test(userAgent)) {
    result.os = 'macOS';
    const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
    if (macMatch) {
      result.osVersion = macMatch[1].replace(/_/g, '.');
    }
  } else if (/linux/i.test(userAgent)) {
    result.os = 'Linux';
  } else if (/android/i.test(userAgent)) {
    result.os = 'Android';
    const androidMatch = userAgent.match(/Android ([\d.]+)/);
    if (androidMatch) {
      result.osVersion = androidMatch[1];
    }
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    result.os = 'iOS';
    const iosMatch = userAgent.match(/OS ([\d_]+)/);
    if (iosMatch) {
      result.osVersion = iosMatch[1].replace(/_/g, '.');
    }
  }

  // Detect browser
  if (/chrome/i.test(userAgent) && !/chromium/i.test(userAgent)) {
    result.browser = 'Chrome';
    const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
    if (chromeMatch) {
      result.browserVersion = chromeMatch[1];
    }
  } else if (/firefox/i.test(userAgent)) {
    result.browser = 'Firefox';
    const ffMatch = userAgent.match(/Firefox\/([\d.]+)/);
    if (ffMatch) {
      result.browserVersion = ffMatch[1];
    }
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    result.browser = 'Safari';
    const safariMatch = userAgent.match(/Version\/([\d.]+)/);
    if (safariMatch) {
      result.browserVersion = safariMatch[1];
    }
  } else if (/edge|edg/i.test(userAgent)) {
    result.browser = 'Edge';
    const edgeMatch = userAgent.match(/Edg[e|A]\/([\d.]+)/);
    if (edgeMatch) {
      result.browserVersion = edgeMatch[1];
    }
  }

  return result;
}

/**
 * Validates that a string looks like a User-Agent
 *
 * @param userAgent - The User-Agent string to validate
 * @returns True if it appears to be a valid User-Agent
 */
export function isValidUserAgent(userAgent: string): boolean {
  if (!userAgent || typeof userAgent !== 'string') {
    return false;
  }

  // User-Agent strings should typically contain common keywords
  const hasCommonKeywords = /mozilla|chrome|safari|firefox|edge|bot|crawler|spider|opera|android|iphone/i.test(userAgent);

  // Check length (valid User-Agents are typically 50-500 chars)
  const hasReasonableLength = userAgent.length > 10 && userAgent.length <= 2000;

  return hasCommonKeywords && hasReasonableLength;
}

/**
 * Sanitizes a User-Agent string by removing potentially sensitive information
 *
 * @param userAgent - The User-Agent string to sanitize
 * @returns Sanitized User-Agent string
 */
export function sanitizeUserAgent(userAgent: string): string {
  if (!userAgent) {
    return '';
  }

  let sanitized = userAgent;

  // Remove build numbers and specific version details that might identify individual machines
  sanitized = sanitized.replace(/\(.*?Build \d+.*?\)/g, '(Build removed)');

  // Remove email-like patterns
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email removed]');

  // Remove specific version numbers beyond major.minor (to prevent fingerprinting)
  // This is a simplified approach; more aggressive anonymization could be applied
  sanitized = sanitized.replace(/(\d+)\.(\d+)\.(\d+)/g, '$1.$2.0');

  return sanitized;
}
