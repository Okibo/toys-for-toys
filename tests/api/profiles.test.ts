/**
 * tests/api/profiles.test.ts
 *
 * Jest test suite for profile API endpoint field-level filtering
 * Tests: Public profile field exposure, own profile access, sensitive field protection
 *
 * Security Requirement: Public profiles should ONLY expose:
 * - id
 * - full_name
 * - language
 * - user_stats (with only avg_overall_rating and review_count)
 *
 * Never expose: email, phone, notification_preference
 */

import { filterPublicProfile, isOwnProfile } from '@/lib/profiles';

describe('Profile Field-Level Filtering', () => {
  // Mock user ID
  const currentUserId = 'user-123';
  const otherUserId = 'user-456';

  // Mock profile with all sensitive fields
  const mockFullProfile = {
    id: otherUserId,
    email: 'user@example.com',
    full_name: 'Jane Doe',
    language: 'en',
    notification_preference: {
      email_on_match: true,
      push_on_message: true,
      marketing_emails: false,
    },
    user_stats: {
      avg_overall_rating: 4.8,
      review_count: 15,
      total_exchanges: 20,
      avg_condition_rating: 4.9,
      avg_communication_rating: 4.7,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-11-14T00:00:00Z',
  };

  describe('filterPublicProfile()', () => {
    it('should return only allowed fields for public profile', () => {
      const publicProfile = filterPublicProfile(mockFullProfile, currentUserId);

      // Check that only allowed fields are present
      expect(publicProfile).toEqual({
        id: otherUserId,
        full_name: 'Jane Doe',
        language: 'en',
        user_stats: {
          avg_overall_rating: 4.8,
          review_count: 15,
        },
      });
    });

    it('should NOT expose email field in public profile', () => {
      const publicProfile = filterPublicProfile(mockFullProfile, currentUserId);
      expect(publicProfile).not.toHaveProperty('email');
      expect('email' in publicProfile).toBe(false);
    });

    it('should NOT expose notification_preference in public profile', () => {
      const publicProfile = filterPublicProfile(mockFullProfile, currentUserId);
      expect(publicProfile).not.toHaveProperty('notification_preference');
      expect('notification_preference' in publicProfile).toBe(false);
    });

    it('should NOT expose created_at or updated_at timestamps in public profile', () => {
      const publicProfile = filterPublicProfile(mockFullProfile, currentUserId);
      expect(publicProfile).not.toHaveProperty('created_at');
      expect(publicProfile).not.toHaveProperty('updated_at');
      expect('created_at' in publicProfile).toBe(false);
      expect('updated_at' in publicProfile).toBe(false);
    });

    it('should NOT expose full user_stats in public profile', () => {
      const publicProfile = filterPublicProfile(mockFullProfile, currentUserId);
      // Should only have avg_overall_rating and review_count
      expect(publicProfile.user_stats).not.toHaveProperty('total_exchanges');
      expect(publicProfile.user_stats).not.toHaveProperty('avg_condition_rating');
      expect(publicProfile.user_stats).not.toHaveProperty('avg_communication_rating');
    });

    it('should handle missing user_stats gracefully', () => {
      const profileWithoutStats = {
        ...mockFullProfile,
        user_stats: null,
      };

      const publicProfile = filterPublicProfile(profileWithoutStats, currentUserId);
      expect(publicProfile.user_stats).toBeNull();
    });

    it('should handle undefined user_stats gracefully', () => {
      const profileWithoutStats = {
        ...mockFullProfile,
        user_stats: undefined,
      };

      const publicProfile = filterPublicProfile(profileWithoutStats, currentUserId);
      expect(publicProfile.user_stats).toBeUndefined();
    });

    it('should return full profile when user is viewing their own profile', () => {
      const ownProfile = filterPublicProfile(mockFullProfile, otherUserId);

      // When viewing own profile, should expose all fields
      expect(ownProfile).toHaveProperty('email');
      expect(ownProfile).toHaveProperty('notification_preference');
      expect(ownProfile).toHaveProperty('created_at');
      expect(ownProfile).toHaveProperty('updated_at');
      expect(ownProfile).toEqual(mockFullProfile);
    });
  });

  describe('isOwnProfile()', () => {
    it('should return true when viewing own profile', () => {
      const result = isOwnProfile(currentUserId, currentUserId);
      expect(result).toBe(true);
    });

    it('should return false when viewing another user profile', () => {
      const result = isOwnProfile(currentUserId, otherUserId);
      expect(result).toBe(false);
    });

    it('should handle null current user', () => {
      const result = isOwnProfile(null, otherUserId);
      expect(result).toBe(false);
    });

    it('should handle undefined current user', () => {
      const result = isOwnProfile(undefined, otherUserId);
      expect(result).toBe(false);
    });
  });

  describe('Public profile response security', () => {
    it('should never expose sensitive PII in any scenario', () => {
      const publicProfile = filterPublicProfile(mockFullProfile, currentUserId);

      const sensitiveFields = [
        'email',
        'phone',
        'notification_preference',
        'created_at',
        'updated_at',
      ];

      sensitiveFields.forEach((field) => {
        expect(field in publicProfile).toBe(false);
        expect(publicProfile[field as keyof typeof publicProfile]).toBeUndefined();
      });
    });

    it('should use allowlist approach (only explicit fields)', () => {
      const publicProfile = filterPublicProfile(mockFullProfile, currentUserId);
      const allowedFields = ['id', 'full_name', 'language', 'user_stats'];

      // All keys in publicProfile should be in allowedFields
      const publicKeys = Object.keys(publicProfile);
      publicKeys.forEach((key) => {
        expect(allowedFields).toContain(key);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle profile with null full_name', () => {
      const profile = {
        ...mockFullProfile,
        full_name: null,
      };

      const publicProfile = filterPublicProfile(profile, currentUserId);
      expect(publicProfile.full_name).toBeNull();
    });

    it('should handle profile with empty string full_name', () => {
      const profile = {
        ...mockFullProfile,
        full_name: '',
      };

      const publicProfile = filterPublicProfile(profile, currentUserId);
      expect(publicProfile.full_name).toBe('');
    });

    it('should preserve user_stats with only avg_overall_rating (no review_count)', () => {
      const profile = {
        ...mockFullProfile,
        user_stats: {
          avg_overall_rating: 4.5,
          review_count: 0,
          total_exchanges: 0,
          avg_condition_rating: null,
          avg_communication_rating: null,
        },
      };

      const publicProfile = filterPublicProfile(profile, currentUserId);
      expect(publicProfile.user_stats).toEqual({
        avg_overall_rating: 4.5,
        review_count: 0,
      });
    });
  });
});
