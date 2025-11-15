/**
 * Consent Validation Module
 * Validates user consent payloads against GDPR requirements
 */

import type { ConsentPayload, ConsentValidationResult } from '@/lib/types/legal';

/**
 * Validates a consent payload for GDPR compliance
 *
 * Required validations:
 * - User ID must be a valid UUID
 * - Privacy policy consent must be true (required)
 * - Terms of service consent must be true (required)
 * - Behavioral analytics can be true or false (optional)
 *
 * @param payload - The consent payload to validate
 * @returns Validation result with status and any errors
 */
export function validateConsent(payload: ConsentPayload): ConsentValidationResult {
  const errors: string[] = [];
  const fieldErrors: { [key: string]: string[] } = {};

  // Validate user_id
  if (!payload.user_id) {
    errors.push('user_id is required');
    fieldErrors['user_id'] = ['user_id is required'];
  } else if (!isValidUUID(payload.user_id)) {
    errors.push('user_id must be a valid UUID');
    fieldErrors['user_id'] = ['user_id must be a valid UUID'];
  }

  // Validate privacy_policy (required = true)
  if (payload.privacy_policy === undefined || payload.privacy_policy === null) {
    errors.push('privacy_policy consent is required');
    fieldErrors['privacy_policy'] = ['privacy_policy consent is required'];
  } else if (payload.privacy_policy !== true) {
    errors.push('privacy_policy consent must be true (required)');
    fieldErrors['privacy_policy'] = ['privacy_policy consent must be true (required)'];
  }

  // Validate terms_of_service (required = true)
  if (payload.terms_of_service === undefined || payload.terms_of_service === null) {
    errors.push('terms_of_service consent is required');
    fieldErrors['terms_of_service'] = ['terms_of_service consent is required'];
  } else if (payload.terms_of_service !== true) {
    errors.push('terms_of_service consent must be true (required)');
    fieldErrors['terms_of_service'] = ['terms_of_service consent must be true (required)'];
  }

  // Validate behavioral_analytics (optional, can be true or false)
  if (payload.behavioral_analytics !== undefined && payload.behavioral_analytics !== null) {
    if (typeof payload.behavioral_analytics !== 'boolean') {
      errors.push('behavioral_analytics must be a boolean');
      fieldErrors['behavioral_analytics'] = ['behavioral_analytics must be a boolean'];
    }
  }

  // Validate document_versions if provided
  if (payload.document_versions) {
    const { privacy_policy: ppVersion, terms_of_service: tosVersion, behavioral_analytics: baVersion } = payload.document_versions;

    if (ppVersion && !isValidVersionFormat(ppVersion)) {
      errors.push('privacy_policy version format is invalid');
      fieldErrors['document_versions.privacy_policy'] = ['Must be in format X.Y.Z'];
    }

    if (tosVersion && !isValidVersionFormat(tosVersion)) {
      errors.push('terms_of_service version format is invalid');
      fieldErrors['document_versions.terms_of_service'] = ['Must be in format X.Y.Z'];
    }

    if (baVersion && !isValidVersionFormat(baVersion)) {
      errors.push('behavioral_analytics version format is invalid');
      fieldErrors['document_versions.behavioral_analytics'] = ['Must be in format X.Y.Z'];
    }
  }

  // Validate IP address format if provided
  if (payload.ip_address) {
    if (!isValidIPAddress(payload.ip_address)) {
      errors.push('ip_address format is invalid');
      fieldErrors['ip_address'] = ['Must be a valid IPv4 or IPv6 address'];
    }
  }

  // Validate user_agent if provided
  if (payload.user_agent !== undefined && payload.user_agent !== null) {
    if (typeof payload.user_agent !== 'string') {
      errors.push('user_agent must be a string');
      fieldErrors['user_agent'] = ['user_agent must be a string'];
    } else if (payload.user_agent.trim().length === 0) {
      errors.push('user_agent must not be empty');
      fieldErrors['user_agent'] = ['user_agent must not be empty'];
    } else if (payload.user_agent.length > 2000) {
      errors.push('user_agent exceeds maximum length of 2000 characters');
      fieldErrors['user_agent'] = ['user_agent exceeds maximum length of 2000 characters'];
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };
}

/**
 * Validates that a string is a valid UUID (v4)
 *
 * @param uuid - The UUID string to validate
 * @returns True if valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates semantic version format (X.Y.Z)
 *
 * @param version - The version string to validate
 * @returns True if valid version format, false otherwise
 */
export function isValidVersionFormat(version: string): boolean {
  if (!version || typeof version !== 'string') {
    return false;
  }

  const versionRegex = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/;
  return versionRegex.test(version);
}

/**
 * Validates IP address format (IPv4 or IPv6)
 *
 * @param ip - The IP address to validate
 * @returns True if valid IP address, false otherwise
 */
export function isValidIPAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 regex (more comprehensive)
  // Matches: full form, compressed form with ::, loopback (::1), etc.
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Checks if all required consents are given
 *
 * @param payload - The consent payload to check
 * @returns True if all required consents are given
 */
export function hasRequiredConsents(payload: ConsentPayload): boolean {
  return payload.privacy_policy === true && payload.terms_of_service === true;
}

/**
 * Checks if user has opted in to optional analytics
 *
 * @param payload - The consent payload to check
 * @returns True if user has opted in to behavioral analytics
 */
export function hasAnalyticsConsent(payload: ConsentPayload): boolean {
  return payload.behavioral_analytics === true;
}

/**
 * Creates a sanitized consent payload for database storage
 * Removes sensitive fields and ensures data integrity
 *
 * @param payload - The original consent payload
 * @returns Sanitized payload safe for storage
 */
export function sanitizeConsentPayload(payload: ConsentPayload): ConsentPayload {
  return {
    user_id: payload.user_id.trim(),
    privacy_policy: Boolean(payload.privacy_policy),
    terms_of_service: Boolean(payload.terms_of_service),
    behavioral_analytics: payload.behavioral_analytics !== undefined ? Boolean(payload.behavioral_analytics) : undefined,
    document_versions: payload.document_versions ? {
      privacy_policy: payload.document_versions.privacy_policy?.trim(),
      terms_of_service: payload.document_versions.terms_of_service?.trim(),
      behavioral_analytics: payload.document_versions.behavioral_analytics?.trim(),
    } : undefined,
    ip_address: payload.ip_address?.trim(),
    user_agent: payload.user_agent?.trim(),
  };
}

/**
 * Compares two consent payloads to check if consent status changed
 *
 * @param previousConsent - Previous consent payload
 * @param currentConsent - Current consent payload
 * @returns True if any consent field changed
 */
export function hasConsentChanged(previousConsent: ConsentPayload, currentConsent: ConsentPayload): boolean {
  return (
    previousConsent.privacy_policy !== currentConsent.privacy_policy ||
    previousConsent.terms_of_service !== currentConsent.terms_of_service ||
    previousConsent.behavioral_analytics !== currentConsent.behavioral_analytics
  );
}

/**
 * Generates a human-readable summary of consent status
 *
 * @param payload - The consent payload
 * @returns Summary string
 */
export function generateConsentSummary(payload: ConsentPayload): string {
  const parts = [];

  parts.push(`Privacy Policy: ${payload.privacy_policy ? 'Accepted' : 'Rejected'}`);
  parts.push(`Terms of Service: ${payload.terms_of_service ? 'Accepted' : 'Rejected'}`);

  if (payload.behavioral_analytics !== undefined) {
    parts.push(`Behavioral Analytics: ${payload.behavioral_analytics ? 'Accepted' : 'Rejected'}`);
  } else {
    parts.push('Behavioral Analytics: Not specified');
  }

  return parts.join(' | ');
}
