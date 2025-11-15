/**
 * RLS Test Fixtures
 *
 * Pre-built test scenarios, users, and data for RLS testing
 * Reduces boilerplate and ensures consistent test data across suites
 */

import { TestUser, TestDataGenerator, createTestUser } from './rls-integration-helpers';

/**
 * Test User Fixtures
 *
 * Pre-configured test users for common scenarios
 */
export const TEST_USERS = {
  // Primary test users
  USER_A: createTestUser(
    '00000000-0000-0000-0000-000000000001',
    'usera@test.com',
    'User A'
  ),
  USER_B: createTestUser(
    '00000000-0000-0000-0000-000000000002',
    'userb@test.com',
    'User B'
  ),
  USER_C: createTestUser(
    '00000000-0000-0000-0000-000000000003',
    'userc@test.com',
    'User C'
  ),

  // Additional users for multi-party scenarios
  USER_D: createTestUser(
    '00000000-0000-0000-0000-000000000004',
    'userd@test.com',
    'User D'
  ),
  USER_E: createTestUser(
    '00000000-0000-0000-0000-000000000005',
    'usere@test.com',
    'User E'
  ),

  // Parent user (for GDPR child data scenarios)
  PARENT_USER: createTestUser(
    '00000000-0000-0000-0000-0000000000f0',
    'parent@test.com',
    'Parent User',
    { parentalControls: true }
  ),

  // Child user (requires parental consent)
  CHILD_USER: createTestUser(
    '00000000-0000-0000-0000-0000000000c1',
    'child@test.com',
    'Child User',
    { birthdate: '2015-01-15', parentalControls: true }
  ),
} as const;

/**
 * Test Data Fixtures
 *
 * Pre-generated test data for various scenarios
 */
export const TEST_DATA_FIXTURES = {
  // User A data
  USER_A_PROFILE: TestDataGenerator.generateProfile(TEST_USERS.USER_A.id),
  USER_A_TICKET: TestDataGenerator.generateTicket(TEST_USERS.USER_A.id, 10),
  USER_A_TOY_1: TestDataGenerator.generateToy(TEST_USERS.USER_A.id, 'blocks', {
    description: 'Blue building blocks',
    tags: ['blocks', 'construction'],
    isActive: true,
  }),
  USER_A_TOY_2: TestDataGenerator.generateToy(TEST_USERS.USER_A.id, 'dolls', {
    description: 'Doll with accessories',
    tags: ['dolls', 'figures'],
    isActive: false, // Inactive toy
  }),
  USER_A_CONSENT: TestDataGenerator.generateConsentRecord(
    TEST_USERS.USER_A.id,
    'privacy_policy',
    { consentGiven: true }
  ),
  USER_A_TRANSACTION: TestDataGenerator.generateTicketTransaction(
    TEST_USERS.USER_A.id,
    'listing_created',
    { amount: -1 }
  ),

  // User B data
  USER_B_PROFILE: TestDataGenerator.generateProfile(TEST_USERS.USER_B.id),
  USER_B_TICKET: TestDataGenerator.generateTicket(TEST_USERS.USER_B.id, 15),
  USER_B_TOY_1: TestDataGenerator.generateToy(TEST_USERS.USER_B.id, 'vehicles', {
    description: 'Toy car collection',
    tags: ['vehicles', 'cars'],
    isActive: true,
  }),
  USER_B_TOY_2: TestDataGenerator.generateToy(TEST_USERS.USER_B.id, 'animals', {
    description: 'Stuffed animals',
    tags: ['animals', 'plush'],
    isActive: true,
  }),
  USER_B_CONSENT: TestDataGenerator.generateConsentRecord(
    TEST_USERS.USER_B.id,
    'privacy_policy',
    { consentGiven: true }
  ),
  USER_B_TRANSACTION: TestDataGenerator.generateTicketTransaction(
    TEST_USERS.USER_B.id,
    'listing_created',
    { amount: -1 }
  ),

  // User C data
  USER_C_PROFILE: TestDataGenerator.generateProfile(TEST_USERS.USER_C.id),
  USER_C_TICKET: TestDataGenerator.generateTicket(TEST_USERS.USER_C.id, 5),
  USER_C_TOY_1: TestDataGenerator.generateToy(TEST_USERS.USER_C.id, 'puzzles', {
    description: 'Jigsaw puzzle',
    tags: ['puzzles', 'educational'],
    isActive: true,
  }),
  USER_C_CONSENT: TestDataGenerator.generateConsentRecord(
    TEST_USERS.USER_C.id,
    'privacy_policy',
    { consentGiven: true }
  ),
  USER_C_TRANSACTION: TestDataGenerator.generateTicketTransaction(
    TEST_USERS.USER_C.id,
    'listing_created',
    { amount: -1 }
  ),

  // Parent and child data
  PARENT_PROFILE: TestDataGenerator.generateProfile(
    TEST_USERS.PARENT_USER.id,
    'parent@test.com',
    'Parent User'
  ),
  PARENT_TICKET: TestDataGenerator.generateTicket(TEST_USERS.PARENT_USER.id, 20),
  CHILD_PROFILE: TestDataGenerator.generateProfile(
    TEST_USERS.CHILD_USER.id,
    'child@test.com',
    'Child User'
  ),
  CHILD_TICKET: TestDataGenerator.generateTicket(TEST_USERS.CHILD_USER.id, 5),
  CHILD_CONSENT: TestDataGenerator.generateConsentRecord(
    TEST_USERS.CHILD_USER.id,
    'parental_consent',
    { consentGiven: true }
  ),

  // Exchange data
  EXCHANGE_A_B: TestDataGenerator.generateExchange(
    TestDataGenerator.generateToy(TEST_USERS.USER_A.id).id,
    TEST_USERS.USER_A.id,
    TEST_USERS.USER_B.id,
    { status: 'pending_requester_confirmation' }
  ),
  EXCHANGE_B_A: TestDataGenerator.generateExchange(
    TestDataGenerator.generateToy(TEST_USERS.USER_B.id).id,
    TEST_USERS.USER_B.id,
    TEST_USERS.USER_A.id,
    { status: 'pending_owner_confirmation' }
  ),
  EXCHANGE_C_A: TestDataGenerator.generateExchange(
    TestDataGenerator.generateToy(TEST_USERS.USER_A.id).id,
    TEST_USERS.USER_C.id,
    TEST_USERS.USER_A.id,
    { status: 'pending_requester_confirmation' }
  ),
} as const;

/**
 * Common Test Scenarios
 *
 * Pre-built scenarios that combine multiple fixtures for complex test cases
 */
export const TEST_SCENARIOS = {
  /**
   * Simple 3-user scenario: A owns toy, B requests it, C is unrelated
   */
  SIMPLE_EXCHANGE: {
    owner: TEST_USERS.USER_A,
    requester: TEST_USERS.USER_B,
    bystander: TEST_USERS.USER_C,
    toy: TEST_DATA_FIXTURES.USER_A_TOY_1,
    exchange: TEST_DATA_FIXTURES.EXCHANGE_A_B,
  },

  /**
   * 2-way exchange: A and B both own toys and request each other's
   */
  MUTUAL_EXCHANGE: {
    userA: TEST_USERS.USER_A,
    userB: TEST_USERS.USER_B,
    toyA: TEST_DATA_FIXTURES.USER_A_TOY_1,
    toyB: TEST_DATA_FIXTURES.USER_B_TOY_1,
    exchangeAB: TEST_DATA_FIXTURES.EXCHANGE_A_B,
    exchangeBA: TEST_DATA_FIXTURES.EXCHANGE_B_A,
  },

  /**
   * Multi-party scenario: A owns toy, B and C both request it
   */
  MULTI_REQUESTER: {
    owner: TEST_USERS.USER_A,
    requester1: TEST_USERS.USER_B,
    requester2: TEST_USERS.USER_C,
    toy: TEST_DATA_FIXTURES.USER_A_TOY_1,
    exchange1: TEST_DATA_FIXTURES.EXCHANGE_A_B,
    exchange2: TEST_DATA_FIXTURES.EXCHANGE_C_A,
  },

  /**
   * GDPR scenario: Parent managing child account
   */
  PARENT_CHILD_ACCOUNT: {
    parent: TEST_USERS.PARENT_USER,
    child: TEST_USERS.CHILD_USER,
    parentProfile: TEST_DATA_FIXTURES.PARENT_PROFILE,
    childProfile: TEST_DATA_FIXTURES.CHILD_PROFILE,
    childConsent: TEST_DATA_FIXTURES.CHILD_CONSENT,
  },

  /**
   * Inactive toy scenario: User B cannot see User A's inactive toy
   */
  INACTIVE_TOY_VISIBILITY: {
    toyOwner: TEST_USERS.USER_A,
    inactiveToy: TEST_DATA_FIXTURES.USER_A_TOY_2,
    otherUser: TEST_USERS.USER_B,
  },

  /**
   * Transaction audit trail: Verify transaction immutability
   */
  TRANSACTION_AUDIT_TRAIL: {
    user: TEST_USERS.USER_A,
    transaction1: TEST_DATA_FIXTURES.USER_A_TRANSACTION,
    transaction2: TestDataGenerator.generateTicketTransaction(
      TEST_USERS.USER_A.id,
      'exchange_completed',
      { amount: 1 }
    ),
  },
} as const;

/**
 * RLS Violation Test Cases
 *
 * Common violation patterns to test
 */
export const RLS_VIOLATION_CASES = {
  /**
   * Case 1: User A cannot read User B's profile
   */
  READ_OTHER_PROFILE: {
    description: 'User A cannot read User B profile',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_B.id,
    operation: 'read',
    table: 'profiles',
    field: 'user_id',
    shouldDeny: true,
  },

  /**
   * Case 2: User A cannot modify User B's profile
   */
  UPDATE_OTHER_PROFILE: {
    description: 'User A cannot update User B profile',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_B.id,
    operation: 'update',
    table: 'profiles',
    field: 'user_id',
    shouldDeny: true,
  },

  /**
   * Case 3: User A cannot view User B's ticket balance
   */
  READ_OTHER_TICKETS: {
    description: 'User A cannot read User B ticket balance',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_B.id,
    operation: 'read',
    table: 'tickets',
    field: 'user_id',
    shouldDeny: true,
  },

  /**
   * Case 4: User A cannot modify User B's ticket balance
   */
  UPDATE_OTHER_TICKETS: {
    description: 'User A cannot modify User B ticket balance',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_B.id,
    operation: 'update',
    table: 'tickets',
    field: 'user_id',
    shouldDeny: true,
  },

  /**
   * Case 5: User A cannot delete exchanges they are not party to
   */
  DELETE_UNRELATED_EXCHANGE: {
    description: 'User C cannot delete exchange between A and B',
    actor: TEST_USERS.USER_C.id,
    target: [TEST_USERS.USER_A.id, TEST_USERS.USER_B.id],
    operation: 'delete',
    table: 'exchanges',
    field: ['requester_id', 'owner_id'],
    shouldDeny: true,
  },

  /**
   * Case 6: User A cannot insert consent record for User B
   */
  INSERT_OTHER_CONSENT: {
    description: 'User A cannot insert consent record for User B',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_B.id,
    operation: 'insert',
    table: 'consent_records',
    field: 'user_id',
    shouldDeny: true,
  },

  /**
   * Case 7: User A cannot modify transaction records
   */
  UPDATE_TRANSACTIONS: {
    description: 'User A cannot modify transaction records',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_A.id,
    operation: 'update',
    table: 'ticket_transactions',
    field: 'user_id',
    shouldDeny: true,
  },

  /**
   * Case 8: Unauthenticated user cannot access any private data
   */
  UNAUTH_READ_PROFILE: {
    description: 'Unauthenticated user cannot read profiles',
    actor: null,
    target: TEST_USERS.USER_A.id,
    operation: 'read',
    table: 'profiles',
    field: 'user_id',
    shouldDeny: true,
  },
} as const;

/**
 * RLS Permission Test Cases
 *
 * Operations that should be allowed
 */
export const RLS_PERMISSION_CASES = {
  /**
   * Case 1: User can read own profile
   */
  READ_OWN_PROFILE: {
    description: 'User can read own profile',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_A.id,
    operation: 'read',
    table: 'profiles',
    field: 'user_id',
    shouldAllow: true,
  },

  /**
   * Case 2: User can read own ticket balance
   */
  READ_OWN_TICKETS: {
    description: 'User can read own ticket balance',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_A.id,
    operation: 'read',
    table: 'tickets',
    field: 'user_id',
    shouldAllow: true,
  },

  /**
   * Case 3: User can read own transaction history
   */
  READ_OWN_TRANSACTIONS: {
    description: 'User can read own transaction history',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_A.id,
    operation: 'read',
    table: 'ticket_transactions',
    field: 'user_id',
    shouldAllow: true,
  },

  /**
   * Case 4: User can read own consent records
   */
  READ_OWN_CONSENT: {
    description: 'User can read own consent records',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_A.id,
    operation: 'read',
    table: 'consent_records',
    field: 'user_id',
    shouldAllow: true,
  },

  /**
   * Case 5: User can update own profile
   */
  UPDATE_OWN_PROFILE: {
    description: 'User can update own profile',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_A.id,
    operation: 'update',
    table: 'profiles',
    field: 'user_id',
    shouldAllow: true,
  },

  /**
   * Case 6: User can withdraw own consent
   */
  WITHDRAW_OWN_CONSENT: {
    description: 'User can withdraw own consent',
    actor: TEST_USERS.USER_A.id,
    target: TEST_USERS.USER_A.id,
    operation: 'update',
    table: 'consent_records',
    field: 'user_id',
    shouldAllow: true,
  },
} as const;

/**
 * Cross-table RLS Scenarios
 *
 * Test interactions between related tables
 */
export const CROSS_TABLE_SCENARIOS = {
  /**
   * Scenario: Toy images must be associated with toy, which must belong to user
   */
  TOY_IMAGE_ACCESS: {
    description: 'Toy image access respects toy ownership via RLS',
    toy: TEST_DATA_FIXTURES.USER_A_TOY_1,
    toyOwner: TEST_USERS.USER_A,
    otherUser: TEST_USERS.USER_B,
    image: TestDataGenerator.generateToyImage(
      TEST_DATA_FIXTURES.USER_A_TOY_1.id,
      1
    ),
  },

  /**
   * Scenario: Exchange access respects requester and owner isolation
   */
  EXCHANGE_PARTY_ACCESS: {
    description: 'Exchange access requires being requester or owner',
    exchange: TEST_DATA_FIXTURES.EXCHANGE_A_B,
    requester: TEST_USERS.USER_A,
    owner: TEST_USERS.USER_B,
    outsider: TEST_USERS.USER_C,
  },

  /**
   * Scenario: Frozen tickets are isolated to user
   */
  FROZEN_TICKET_ISOLATION: {
    description: 'Frozen ticket amounts visible only to owner',
    user: TEST_USERS.USER_A,
    otherUser: TEST_USERS.USER_B,
    ticket: TEST_DATA_FIXTURES.USER_A_TICKET,
  },
} as const;

/**
 * Helper function to get all users from fixtures
 */
export function getAllTestUsers(): TestUser[] {
  return [
    TEST_USERS.USER_A,
    TEST_USERS.USER_B,
    TEST_USERS.USER_C,
    TEST_USERS.USER_D,
    TEST_USERS.USER_E,
    TEST_USERS.PARENT_USER,
    TEST_USERS.CHILD_USER,
  ];
}

/**
 * Helper function to get all violation cases
 */
export function getAllViolationCases() {
  return Object.values(RLS_VIOLATION_CASES);
}

/**
 * Helper function to get all permission cases
 */
export function getAllPermissionCases() {
  return Object.values(RLS_PERMISSION_CASES);
}
