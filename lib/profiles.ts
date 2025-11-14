/**
 * lib/profiles.ts
 *
 * Profile management utilities with field-level filtering for security.
 * Implements allowlist-based approach to protect sensitive PII.
 *
 * Public profiles expose ONLY:
 * - id
 * - full_name
 * - language
 * - user_stats (limited to avg_overall_rating and review_count)
 *
 * Sensitive fields NEVER exposed to other users:
 * - email
 * - phone
 * - notification_preference
 * - created_at / updated_at
 */

export interface PublicUserStats {
  avg_overall_rating: number | null;
  review_count: number;
}

export interface PublicProfile {
  id: string;
  full_name: string | null;
  language: string;
  user_stats?: PublicUserStats | null;
}

export interface FullProfile extends PublicProfile {
  email: string;
  phone?: string | null;
  notification_preference?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user_stats?: {
    avg_overall_rating: number | null;
    review_count: number;
    total_exchanges: number;
    avg_condition_rating: number | null;
    avg_communication_rating: number | null;
  } | null;
}

/**
 * Check if the current user is viewing their own profile.
 * @param currentUserId - The ID of the user making the request (from auth.uid())
 * @param profileId - The ID of the profile being viewed
 * @returns true if viewing own profile, false otherwise
 */
export function isOwnProfile(currentUserId: string | null | undefined, profileId: string): boolean {
  return currentUserId != null && currentUserId === profileId;
}

/**
 * Filter profile data based on whether user is viewing own or public profile.
 * Uses allowlist approach: only explicit fields are returned.
 *
 * SECURITY: This function implements field-level filtering that MUST be applied
 * before returning profile data in API responses. RLS allows all authenticated
 * users to SELECT all profile rows - this function enforces which fields are exposed.
 *
 * @param profile - Full profile object from database
 * @param currentUserId - The ID of the user making the request
 * @returns Filtered profile with only allowed fields
 */
export function filterPublicProfile(
  profile: FullProfile,
  currentUserId: string | null | undefined
): PublicProfile | FullProfile {
  // If user is viewing their own profile, return full profile
  if (isOwnProfile(currentUserId, profile.id)) {
    return profile;
  }

  // For public profile access, return only allowlisted fields
  const publicProfile: PublicProfile = {
    id: profile.id,
    full_name: profile.full_name,
    language: profile.language,
  };

  // Include user_stats only if present, and filter to allowed fields
  if (profile.user_stats) {
    publicProfile.user_stats = {
      avg_overall_rating: profile.user_stats.avg_overall_rating,
      review_count: profile.user_stats.review_count,
    };
  } else if (profile.user_stats === null) {
    publicProfile.user_stats = null;
  }

  return publicProfile;
}

/**
 * Type guard to check if a profile is a public profile (not full profile).
 * @param profile - Profile object to check
 * @returns true if profile is public (missing email field)
 */
export function isPublicProfile(profile: unknown): profile is PublicProfile {
  if (!profile || typeof profile !== 'object') {
    return false;
  }
  return (
    'id' in profile && 'full_name' in profile && 'language' in profile && !('email' in profile)
  );
}

/**
 * Type guard to check if a profile is a full profile (own profile).
 * @param profile - Profile object to check
 * @returns true if profile is full (has email field)
 */
export function isFullProfile(profile: unknown): profile is FullProfile {
  if (!profile || typeof profile !== 'object') {
    return false;
  }
  return 'email' in profile;
}
