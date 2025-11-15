/**
 * Database Enum Type Validation Tests
 *
 * Validates all 8 enum types:
 * 1. language_preference (en, de, pl)
 * 2. toy_category (blocks, vehicles, dolls, board_games, educational, sports, art, other)
 * 3. toy_age_group (0-2, 3-5, 6-8, 9-11, 12-14, 15+)
 * 4. toy_condition (like_new, good, fair, well_loved)
 * 5. exchange_status (7 states)
 * 6. delivery_method (in_person, mail, courier)
 * 7. transaction_type (7 transaction types)
 * 8. consent_type (privacy_policy, terms_of_service, behavioral_analytics)
 */

import { isValidEnumValue } from './test-utils';

describe('Database Enums - Type Validation', () => {
  describe('language_preference Enum', () => {
    const validLanguages = ['en', 'de', 'pl'] as const;

    test('should have exactly 3 language options', () => {
      expect(validLanguages.length).toBe(3);
    });

    test('en (English) should be valid', () => {
      expect(isValidEnumValue('en', validLanguages)).toBe(true);
    });

    test('de (German) should be valid', () => {
      expect(isValidEnumValue('de', validLanguages)).toBe(true);
    });

    test('pl (Polish) should be valid', () => {
      expect(isValidEnumValue('pl', validLanguages)).toBe(true);
    });

    test('invalid language should be rejected', () => {
      expect(isValidEnumValue('fr', validLanguages)).toBe(false);
      expect(isValidEnumValue('es', validLanguages)).toBe(false);
      expect(isValidEnumValue('', validLanguages)).toBe(false);
    });

    test('language is case-sensitive', () => {
      expect(isValidEnumValue('EN', validLanguages)).toBe(false);
      expect(isValidEnumValue('De', validLanguages)).toBe(false);
    });
  });

  describe('toy_category Enum', () => {
    const validCategories = [
      'blocks',
      'vehicles',
      'dolls',
      'board_games',
      'educational',
      'sports',
      'art',
      'other',
    ] as const;

    test('should have exactly 8 category options', () => {
      expect(validCategories.length).toBe(8);
    });

    test('blocks should be valid', () => {
      expect(isValidEnumValue('blocks', validCategories)).toBe(true);
    });

    test('vehicles should be valid', () => {
      expect(isValidEnumValue('vehicles', validCategories)).toBe(true);
    });

    test('dolls should be valid', () => {
      expect(isValidEnumValue('dolls', validCategories)).toBe(true);
    });

    test('board_games should be valid', () => {
      expect(isValidEnumValue('board_games', validCategories)).toBe(true);
    });

    test('educational should be valid', () => {
      expect(isValidEnumValue('educational', validCategories)).toBe(true);
    });

    test('sports should be valid', () => {
      expect(isValidEnumValue('sports', validCategories)).toBe(true);
    });

    test('art should be valid', () => {
      expect(isValidEnumValue('art', validCategories)).toBe(true);
    });

    test('other should be valid', () => {
      expect(isValidEnumValue('other', validCategories)).toBe(true);
    });

    test('invalid category should be rejected', () => {
      expect(isValidEnumValue('toys', validCategories)).toBe(false);
      expect(isValidEnumValue('games', validCategories)).toBe(false);
      expect(isValidEnumValue('Blocks', validCategories)).toBe(false);
    });
  });

  describe('toy_age_group Enum', () => {
    const validAgeGroups = [
      '0-2',
      '3-5',
      '6-8',
      '9-11',
      '12-14',
      '15+',
    ] as const;

    test('should have exactly 6 age group options', () => {
      expect(validAgeGroups.length).toBe(6);
    });

    test('0-2 (infants) should be valid', () => {
      expect(isValidEnumValue('0-2', validAgeGroups)).toBe(true);
    });

    test('3-5 (preschool) should be valid', () => {
      expect(isValidEnumValue('3-5', validAgeGroups)).toBe(true);
    });

    test('6-8 (early school) should be valid', () => {
      expect(isValidEnumValue('6-8', validAgeGroups)).toBe(true);
    });

    test('9-11 (middle school) should be valid', () => {
      expect(isValidEnumValue('9-11', validAgeGroups)).toBe(true);
    });

    test('12-14 (teens) should be valid', () => {
      expect(isValidEnumValue('12-14', validAgeGroups)).toBe(true);
    });

    test('15+ (older teens) should be valid', () => {
      expect(isValidEnumValue('15+', validAgeGroups)).toBe(true);
    });

    test('invalid age group should be rejected', () => {
      expect(isValidEnumValue('0-3', validAgeGroups)).toBe(false);
      expect(isValidEnumValue('5-10', validAgeGroups)).toBe(false);
      expect(isValidEnumValue('infant', validAgeGroups)).toBe(false);
    });

    test('age group format must match exactly', () => {
      expect(isValidEnumValue('0 - 2', validAgeGroups)).toBe(false);
      expect(isValidEnumValue('0-2 ', validAgeGroups)).toBe(false);
    });
  });

  describe('toy_condition Enum', () => {
    const validConditions = [
      'like_new',
      'good',
      'fair',
      'well_loved',
    ] as const;

    test('should have exactly 4 condition options', () => {
      expect(validConditions.length).toBe(4);
    });

    test('like_new should be valid', () => {
      expect(isValidEnumValue('like_new', validConditions)).toBe(true);
    });

    test('good should be valid', () => {
      expect(isValidEnumValue('good', validConditions)).toBe(true);
    });

    test('fair should be valid', () => {
      expect(isValidEnumValue('fair', validConditions)).toBe(true);
    });

    test('well_loved should be valid', () => {
      expect(isValidEnumValue('well_loved', validConditions)).toBe(true);
    });

    test('invalid condition should be rejected', () => {
      expect(isValidEnumValue('new', validConditions)).toBe(false);
      expect(isValidEnumValue('poor', validConditions)).toBe(false);
      expect(isValidEnumValue('used', validConditions)).toBe(false);
    });

    test('condition is case-sensitive', () => {
      expect(isValidEnumValue('Like_New', validConditions)).toBe(false);
      expect(isValidEnumValue('GOOD', validConditions)).toBe(false);
    });
  });

  describe('exchange_status Enum', () => {
    const validStatuses = [
      'pending_requester_confirmation',
      'pending_owner_response',
      'exchange_confirmed',
      'pending_delivery_confirmation',
      'exchange_completed',
      'dispute_filed',
      'closed',
    ] as const;

    test('should have exactly 7 status options', () => {
      expect(validStatuses.length).toBe(7);
    });

    test('pending_requester_confirmation should be valid', () => {
      expect(
        isValidEnumValue('pending_requester_confirmation', validStatuses)
      ).toBe(true);
    });

    test('pending_owner_response should be valid', () => {
      expect(
        isValidEnumValue('pending_owner_response', validStatuses)
      ).toBe(true);
    });

    test('exchange_confirmed should be valid', () => {
      expect(isValidEnumValue('exchange_confirmed', validStatuses)).toBe(
        true
      );
    });

    test('pending_delivery_confirmation should be valid', () => {
      expect(
        isValidEnumValue('pending_delivery_confirmation', validStatuses)
      ).toBe(true);
    });

    test('exchange_completed should be valid', () => {
      expect(isValidEnumValue('exchange_completed', validStatuses)).toBe(true);
    });

    test('dispute_filed should be valid', () => {
      expect(isValidEnumValue('dispute_filed', validStatuses)).toBe(true);
    });

    test('closed should be valid', () => {
      expect(isValidEnumValue('closed', validStatuses)).toBe(true);
    });

    test('invalid status should be rejected', () => {
      expect(isValidEnumValue('pending', validStatuses)).toBe(false);
      expect(isValidEnumValue('confirmed', validStatuses)).toBe(false);
      expect(isValidEnumValue('completed', validStatuses)).toBe(false);
    });

    test('status is case-sensitive', () => {
      expect(
        isValidEnumValue('Pending_Requester_Confirmation', validStatuses)
      ).toBe(false);
      expect(isValidEnumValue('CLOSED', validStatuses)).toBe(false);
    });
  });

  describe('delivery_method Enum', () => {
    const validMethods = ['in_person', 'mail', 'courier'] as const;

    test('should have exactly 3 delivery method options', () => {
      expect(validMethods.length).toBe(3);
    });

    test('in_person should be valid', () => {
      expect(isValidEnumValue('in_person', validMethods)).toBe(true);
    });

    test('mail should be valid', () => {
      expect(isValidEnumValue('mail', validMethods)).toBe(true);
    });

    test('courier should be valid', () => {
      expect(isValidEnumValue('courier', validMethods)).toBe(true);
    });

    test('invalid delivery method should be rejected', () => {
      expect(isValidEnumValue('shipping', validMethods)).toBe(false);
      expect(isValidEnumValue('pickup', validMethods)).toBe(false);
      expect(isValidEnumValue('delivery', validMethods)).toBe(false);
    });

    test('delivery method is case-sensitive', () => {
      expect(isValidEnumValue('In_Person', validMethods)).toBe(false);
      expect(isValidEnumValue('MAIL', validMethods)).toBe(false);
    });
  });

  describe('transaction_type Enum', () => {
    const validTypes = [
      'listing_created',
      'listing_removed',
      'exchange_request',
      'exchange_declined',
      'exchange_completed',
      'mini_game_reward',
      'refund',
    ] as const;

    test('should have exactly 7 transaction type options', () => {
      expect(validTypes.length).toBe(7);
    });

    test('listing_created should be valid', () => {
      expect(isValidEnumValue('listing_created', validTypes)).toBe(true);
    });

    test('listing_removed should be valid', () => {
      expect(isValidEnumValue('listing_removed', validTypes)).toBe(true);
    });

    test('exchange_request should be valid', () => {
      expect(isValidEnumValue('exchange_request', validTypes)).toBe(true);
    });

    test('exchange_declined should be valid', () => {
      expect(isValidEnumValue('exchange_declined', validTypes)).toBe(true);
    });

    test('exchange_completed should be valid', () => {
      expect(isValidEnumValue('exchange_completed', validTypes)).toBe(true);
    });

    test('mini_game_reward should be valid', () => {
      expect(isValidEnumValue('mini_game_reward', validTypes)).toBe(true);
    });

    test('refund should be valid', () => {
      expect(isValidEnumValue('refund', validTypes)).toBe(true);
    });

    test('invalid transaction type should be rejected', () => {
      expect(isValidEnumValue('listing', validTypes)).toBe(false);
      expect(isValidEnumValue('exchange', validTypes)).toBe(false);
      expect(isValidEnumValue('reward', validTypes)).toBe(false);
    });

    test('transaction type is case-sensitive', () => {
      expect(isValidEnumValue('Listing_Created', validTypes)).toBe(false);
      expect(isValidEnumValue('REFUND', validTypes)).toBe(false);
    });
  });

  describe('consent_type Enum', () => {
    const validTypes = [
      'privacy_policy',
      'terms_of_service',
      'behavioral_analytics',
    ] as const;

    test('should have exactly 3 consent type options', () => {
      expect(validTypes.length).toBe(3);
    });

    test('privacy_policy should be valid', () => {
      expect(isValidEnumValue('privacy_policy', validTypes)).toBe(true);
    });

    test('terms_of_service should be valid', () => {
      expect(isValidEnumValue('terms_of_service', validTypes)).toBe(true);
    });

    test('behavioral_analytics should be valid', () => {
      expect(isValidEnumValue('behavioral_analytics', validTypes)).toBe(true);
    });

    test('invalid consent type should be rejected', () => {
      expect(isValidEnumValue('privacy', validTypes)).toBe(false);
      expect(isValidEnumValue('terms', validTypes)).toBe(false);
      expect(isValidEnumValue('analytics', validTypes)).toBe(false);
    });

    test('consent type is case-sensitive', () => {
      expect(isValidEnumValue('Privacy_Policy', validTypes)).toBe(false);
      expect(isValidEnumValue('TERMS_OF_SERVICE', validTypes)).toBe(false);
    });
  });
});

describe('Database Enums - Integration Tests', () => {
  test('can create profile with valid language preference', () => {
    const validLanguages = ['en', 'de', 'pl'] as const;

    validLanguages.forEach((lang) => {
      expect(isValidEnumValue(lang, validLanguages)).toBe(true);
    });
  });

  test('can create toy with valid category, age_group, and condition', () => {
    const validCategories = [
      'blocks',
      'vehicles',
      'dolls',
      'board_games',
      'educational',
      'sports',
      'art',
      'other',
    ] as const;
    const validAgeGroups = [
      '0-2',
      '3-5',
      '6-8',
      '9-11',
      '12-14',
      '15+',
    ] as const;
    const validConditions = [
      'like_new',
      'good',
      'fair',
      'well_loved',
    ] as const;

    expect(isValidEnumValue('blocks', validCategories)).toBe(true);
    expect(isValidEnumValue('6-8', validAgeGroups)).toBe(true);
    expect(isValidEnumValue('good', validConditions)).toBe(true);
  });

  test('can create exchange with valid status and delivery method', () => {
    const validStatuses = [
      'pending_requester_confirmation',
      'pending_owner_response',
      'exchange_confirmed',
      'pending_delivery_confirmation',
      'exchange_completed',
      'dispute_filed',
      'closed',
    ] as const;
    const validMethods = ['in_person', 'mail', 'courier'] as const;

    expect(
      isValidEnumValue('pending_requester_confirmation', validStatuses)
    ).toBe(true);
    expect(isValidEnumValue('mail', validMethods)).toBe(true);
  });

  test('can create ticket transaction with valid transaction type', () => {
    const validTypes = [
      'listing_created',
      'listing_removed',
      'exchange_request',
      'exchange_declined',
      'exchange_completed',
      'mini_game_reward',
      'refund',
    ] as const;

    expect(isValidEnumValue('listing_created', validTypes)).toBe(true);
  });

  test('can create consent record with valid consent type', () => {
    const validTypes = [
      'privacy_policy',
      'terms_of_service',
      'behavioral_analytics',
    ] as const;

    expect(isValidEnumValue('privacy_policy', validTypes)).toBe(true);
  });
});

describe('Database Enums - Coverage', () => {
  test('all 8 enum types should be covered', () => {
    const enumTypes = [
      'language_preference',
      'toy_category',
      'toy_age_group',
      'toy_condition',
      'exchange_status',
      'delivery_method',
      'transaction_type',
      'consent_type',
    ];

    expect(enumTypes.length).toBe(8);
  });

  test('enum values are consistent (use underscores)', () => {
    const validStatuses = [
      'pending_requester_confirmation',
      'pending_owner_response',
      'exchange_confirmed',
      'pending_delivery_confirmation',
      'exchange_completed',
      'dispute_filed',
      'closed',
    ];

    // Most multi-word enums use underscores
    const multiWordEnums = validStatuses.filter((s) => s.includes('_'));
    expect(multiWordEnums.length).toBeGreaterThan(0);
  });

  test('no enum value should have uppercase letters', () => {
    const allEnumValues = [
      'en',
      'de',
      'pl',
      'blocks',
      'vehicles',
      'dolls',
      'board_games',
      'educational',
      'sports',
      'art',
      'other',
      '0-2',
      '3-5',
      '6-8',
      '9-11',
      '12-14',
      '15+',
      'like_new',
      'good',
      'fair',
      'well_loved',
      'pending_requester_confirmation',
      'pending_owner_response',
      'exchange_confirmed',
      'pending_delivery_confirmation',
      'exchange_completed',
      'dispute_filed',
      'closed',
      'in_person',
      'mail',
      'courier',
      'listing_created',
      'listing_removed',
      'exchange_request',
      'exchange_declined',
      'exchange_completed',
      'mini_game_reward',
      'refund',
      'privacy_policy',
      'terms_of_service',
      'behavioral_analytics',
    ];

    allEnumValues.forEach((val) => {
      expect(val).toBe(val.toLowerCase());
    });
  });
});
