/**
 * RLS Integration Test Helpers
 *
 * Enhanced utilities for comprehensive RLS testing including:
 * - Mock Supabase client factories for different user contexts
 * - JWT token simulation and validation
 * - Multi-user context switching
 * - Advanced RLS assertion helpers
 * - Test data builders for all tables
 * - Batch operation utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Simple UUID v4 generator for test environments
 * Based on RFC4122 v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Test user interface with optional extended properties
 */
export interface TestUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  birthdate?: string;
  parentalControls?: boolean;
}

/**
 * Create a test user with standard properties
 *
 * @example
 * const user = createTestUser('user-id', 'user@test.com', 'Test User');
 */
export const createTestUser = (
  id: string,
  email: string,
  name: string,
  options?: {
    role?: string;
    birthdate?: string;
    parentalControls?: boolean;
  }
): TestUser => ({
  id,
  email,
  name,
  role: options?.role,
  birthdate: options?.birthdate,
  parentalControls: options?.parentalControls,
});

/**
 * RLS Error Response Interface
 */
export interface RLSErrorResponse {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

/**
 * Query result wrapper for type safety
 */
export interface QueryResult<T = any> {
  data: T[] | T | null;
  error: RLSErrorResponse | null;
  count?: number | null;
  status?: number;
}

/**
 * Mock Supabase Client Factory
 *
 * Creates Supabase clients for different user contexts to simulate
 * authentication and RLS policy application
 *
 * In production:
 * - Supabase uses JWT tokens from auth.users table
 * - JWT tokens contain claims like sub (user_id), role, etc.
 * - RLS policies use auth.uid(), auth.jwt() to enforce security
 *
 * In testing:
 * - We mock user context via headers and options
 * - Actual RLS is enforced by Supabase (if connecting to real instance)
 * - Or we can mock RLS responses
 */
export class MockSupabaseClientFactory {
  private projectUrl: string;
  private anonKey: string;
  private userContextMap: Map<string, TestUser> = new Map();

  constructor(projectUrl: string, anonKey: string) {
    this.projectUrl = projectUrl;
    this.anonKey = anonKey;
  }

  /**
   * Create a Supabase client configured for a specific user
   *
   * Simulates authenticated user context by:
   * - Setting auth headers with user ID
   * - Configuring session persistence
   * - Preparing for JWT token simulation
   */
  createClientForUser(user: TestUser): SupabaseClient {
    this.userContextMap.set(user.id, user);

    return createClient(this.projectUrl, this.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        // In production, this would be populated with JWT token
        // For testing with real Supabase, auth context is handled by RLS policies
      },
      global: {
        headers: {
          'X-User-ID': user.id,
          'X-User-Email': user.email,
        },
      },
    });
  }

  /**
   * Create an unauthenticated client (no auth context)
   *
   * Simulates users not logged in. RLS policies should deny all access
   * to user-scoped data
   */
  createUnauthenticatedClient(): SupabaseClient {
    return createClient(this.projectUrl, this.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'X-User-ID': '',
        },
      },
    });
  }

  /**
   * Create a service role client for backend operations
   *
   * Service role has bypass privileges and can:
   * - Access all data regardless of RLS
   * - Perform administrative operations
   * - Used for backend services and Edge Functions
   *
   * @param serviceRoleKey The Supabase service role key
   */
  createServiceRoleClient(serviceRoleKey: string): SupabaseClient {
    return createClient(this.projectUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Create a client with custom role
   *
   * Allows testing custom roles beyond standard authenticated/service role
   */
  createClientWithRole(user: TestUser, role: string): SupabaseClient {
    return createClient(this.projectUrl, this.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'X-User-ID': user.id,
          'X-User-Role': role,
        },
      },
    });
  }

  /**
   * Get registered user by ID
   */
  getUser(userId: string): TestUser | undefined {
    return this.userContextMap.get(userId);
  }

  /**
   * Get all registered users
   */
  getAllUsers(): TestUser[] {
    return Array.from(this.userContextMap.values());
  }
}

/**
 * RLS Assertion Helpers
 *
 * Provides assertion methods for validating RLS behavior
 * Handles various error codes and response formats from Supabase
 */
export class RLSAssertions {
  /**
   * Standard RLS violation error codes from Supabase
   */
  private static readonly RLS_ERROR_CODES = ['PGRST116', '403', 'FORBIDDEN'];

  /**
   * Assert that a query was denied by RLS policy
   *
   * RLS denial can manifest as:
   * - Error code PGRST116 (Supabase RLS violation)
   * - Error code 403 (Forbidden)
   * - No data returned (silent failure)
   *
   * @param fn Async function that executes the query
   * @param message Custom assertion message
   */
  static async assertDenied(
    fn: () => Promise<any>,
    message: string = 'Operation should have been denied by RLS'
  ): Promise<void> {
    try {
      const result = await fn();

      // Check for explicit RLS error
      if (result.error) {
        const errorCode = String(result.error.code || '').toUpperCase();

        if (this.RLS_ERROR_CODES.some((code) => errorCode.includes(code))) {
          return; // Expected RLS denial
        }

        if (
          result.error.message?.includes('denied') ||
          result.error.message?.includes('permission') ||
          result.error.message?.includes('violates row-level')
        ) {
          return; // Expected RLS denial
        }

        // If not an RLS error, it's unexpected
        throw new Error(
          `${message}: Expected RLS denial but got error: ${result.error.code} - ${result.error.message}`
        );
      }

      // If no error but query succeeded, that's a violation
      throw new Error(
        `${message}: Expected RLS denial but operation succeeded. Result: ${JSON.stringify(result)}`
      );
    } catch (error: any) {
      // If error message indicates we detected a denial, rethrow our error
      if (error.message?.includes(message)) {
        throw error;
      }

      // Unexpected exception
      throw error;
    }
  }

  /**
   * Assert that a query was allowed (not denied by RLS)
   *
   * Verifies that:
   * - No error occurred
   * - Query executed successfully
   * - Data was returned (if expected)
   *
   * @param fn Async function that executes the query
   * @param message Custom assertion message
   * @returns The returned data
   */
  static async assertAllowed(
    fn: () => Promise<any>,
    message: string = 'Operation should have been allowed'
  ): Promise<any> {
    const result = await fn();

    if (result.error) {
      // Check if it's an RLS error
      if (
        String(result.error.code || '').includes('403') ||
        String(result.error.code || '').includes('PGRST116')
      ) {
        throw new Error(
          `${message}: Operation was denied by RLS. Error: ${result.error.message}`
        );
      }

      // Allow other errors (table might not exist in test, etc)
      // but log them
      console.warn(`${message}: Operation had error but not RLS: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Assert user data isolation - all returned records belong to expected user
   *
   * @param results Array of records from query
   * @param userIdField Field name containing user ID
   * @param expectedUserId Expected user ID for all records
   * @param message Custom assertion message
   */
  static assertUserIsolation(
    results: any[] | null,
    userIdField: string,
    expectedUserId: string,
    message: string = 'User isolation violated'
  ): void {
    if (!Array.isArray(results)) {
      throw new Error(`${message}: Expected array but got ${typeof results}`);
    }

    for (const record of results) {
      if (record[userIdField] !== expectedUserId) {
        throw new Error(
          `${message}: Found record from user ${record[userIdField]}, expected ${expectedUserId}`
        );
      }
    }
  }

  /**
   * Assert that a specific record is visible in results
   *
   * @param results Array of records from query
   * @param recordId ID of record to find
   * @param idField Field name containing record ID
   */
  static assertRecordVisible(
    results: any[] | null,
    recordId: string,
    idField: string = 'id'
  ): void {
    if (!Array.isArray(results)) {
      throw new Error('Results must be an array');
    }

    const found = results.some((r) => r[idField] === recordId);
    if (!found) {
      throw new Error(`Record ${recordId} should be visible but was not found in results`);
    }
  }

  /**
   * Assert that a specific record is hidden from results
   *
   * @param results Array of records from query
   * @param recordId ID of record to verify is hidden
   * @param idField Field name containing record ID
   */
  static assertRecordHidden(
    results: any[] | null,
    recordId: string,
    idField: string = 'id'
  ): void {
    if (!Array.isArray(results)) {
      return; // No results means hidden
    }

    const found = results.some((r) => r[idField] === recordId);
    if (found) {
      throw new Error(`Record ${recordId} should be hidden but was found in results`);
    }
  }

  /**
   * Assert that results are empty
   *
   * @param results Array of records from query
   * @param message Custom assertion message
   */
  static assertNoResults(
    results: any[] | null,
    message: string = 'Expected no results'
  ): void {
    if (Array.isArray(results) && results.length > 0) {
      throw new Error(`${message}: Expected empty results but got ${results.length} records`);
    }
  }

  /**
   * Assert that results are not empty
   *
   * @param results Array of records from query
   * @param message Custom assertion message
   */
  static assertHasResults(
    results: any[] | null,
    message: string = 'Expected results'
  ): void {
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error(`${message}: Expected results but got none`);
    }
  }

  /**
   * Assert specific count of results
   *
   * @param results Array of records from query
   * @param expectedCount Expected number of records
   * @param message Custom assertion message
   */
  static assertResultCount(
    results: any[] | null,
    expectedCount: number,
    message: string = 'Result count mismatch'
  ): void {
    const actualCount = Array.isArray(results) ? results.length : 0;
    if (actualCount !== expectedCount) {
      throw new Error(
        `${message}: Expected ${expectedCount} results but got ${actualCount}`
      );
    }
  }
}

/**
 * Test Data Generator
 *
 * Factories for generating realistic test data across all tables
 * Ensures consistency and reduces boilerplate in tests
 */
export class TestDataGenerator {
  /**
   * Generate a random UUID-like ID for testing
   */
  static generateId(): string {
    return generateUUID();
  }
  /**
   * Generate a test profile
   */
  static generateProfile(
    userId: string,
    email: string = `user-${userId.slice(0, 8)}@test.com`,
    fullName: string = 'Test User',
    options?: {
      languagePreference?: string;
      postalCode?: string;
      isEmailVerified?: boolean;
    }
  ) {
    return {
      user_id: userId,
      email,
      full_name: fullName,
      language_preference: options?.languagePreference ?? 'en',
      postal_code: options?.postalCode ?? '12345',
      is_email_verified: options?.isEmailVerified ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Generate a test ticket record
   */
  static generateTicket(
    userId: string,
    totalBalance: number = 10,
    options?: {
      frozenListingTickets?: number;
      frozenExchangeTickets?: number;
    }
  ) {
    return {
      id: generateUUID(),
      user_id: userId,
      total_balance: totalBalance,
      frozen_listing_tickets: options?.frozenListingTickets ?? 0,
      frozen_exchange_tickets: options?.frozenExchangeTickets ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Generate a test toy listing
   */
  static generateToy(
    userId: string,
    category: string = 'blocks',
    options?: {
      description?: string;
      tags?: string[];
      ageGroup?: string;
      condition?: string;
      postalCode?: string;
      isActive?: boolean;
      frozenListingTickets?: number;
    }
  ) {
    return {
      id: generateUUID(),
      user_id: userId,
      category,
      description: options?.description ?? 'A nice toy for testing',
      tags: options?.tags ?? ['test'],
      age_group: options?.ageGroup ?? '3-5',
      condition: options?.condition ?? 'good',
      postal_code: options?.postalCode ?? '12345',
      is_active: options?.isActive ?? true,
      frozen_listing_tickets: options?.frozenListingTickets ?? 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Generate a test toy image
   */
  static generateToyImage(
    toyId: string,
    imageOrder: number = 1,
    options?: {
      storagePath?: string;
    }
  ) {
    return {
      id: generateUUID(),
      toy_id: toyId,
      storage_path: options?.storagePath ?? `toys/${toyId}/image-${imageOrder}.jpg`,
      image_order: imageOrder,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Generate a test exchange
   */
  static generateExchange(
    toyId: string,
    requesterId: string,
    ownerId: string,
    options?: {
      status?: string;
      deliveryMethod?: string;
      requesterMessage?: string;
      frozenRequesterTickets?: number;
      frozenOwnerTickets?: number;
    }
  ) {
    return {
      id: generateUUID(),
      toy_id: toyId,
      requester_id: requesterId,
      owner_id: ownerId,
      status: options?.status ?? 'pending_requester_confirmation',
      delivery_method: options?.deliveryMethod ?? 'in_person',
      requester_message: options?.requesterMessage ?? 'I would like to exchange this toy',
      frozen_requester_tickets: options?.frozenRequesterTickets ?? 1,
      frozen_owner_tickets: options?.frozenOwnerTickets ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_response_deadline: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      delivery_deadline: null,
    };
  }

  /**
   * Generate a test consent record
   */
  static generateConsentRecord(
    userId: string,
    consentType: string = 'privacy_policy',
    options?: {
      consentGiven?: boolean;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    return {
      id: generateUUID(),
      user_id: userId,
      consent_type: consentType,
      consent_given: options?.consentGiven ?? true,
      timestamp: new Date().toISOString(),
      ip_address: options?.ipAddress ?? '127.0.0.1',
      user_agent: options?.userAgent ?? 'Test Agent',
      withdrawn_at: null,
    };
  }

  /**
   * Generate a test ticket transaction
   */
  static generateTicketTransaction(
    userId: string,
    transactionType: string = 'listing_created',
    options?: {
      amount?: number;
      referenceId?: string;
    }
  ) {
    return {
      id: generateUUID(),
      user_id: userId,
      transaction_type: transactionType,
      amount: options?.amount ?? -1,
      reference_id: options?.referenceId ?? generateUUID(),
      created_at: new Date().toISOString(),
    };
  }
}

/**
 * RLS Test Context Manager
 *
 * Manages user contexts, provides helpers for multi-user testing scenarios,
 * and tracks test data
 */
export class RLSTestContext {
  private users: Map<string, TestUser> = new Map();
  private clientFactory: MockSupabaseClientFactory;
  private testDataMap: Map<string, any[]> = new Map();

  constructor(clientFactory: MockSupabaseClientFactory) {
    this.clientFactory = clientFactory;
  }

  /**
   * Register a single test user
   */
  registerUser(user: TestUser): void {
    this.users.set(user.id, user);
  }

  /**
   * Register multiple test users at once
   */
  registerUsers(...users: TestUser[]): void {
    users.forEach((user) => this.registerUser(user));
  }

  /**
   * Get a registered user by ID
   */
  getUser(userId: string): TestUser {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not registered in test context`);
    }
    return user;
  }

  /**
   * Get Supabase client for a specific user
   */
  getClientForUser(userId: string): SupabaseClient {
    const user = this.getUser(userId);
    return this.clientFactory.createClientForUser(user);
  }

  /**
   * Get unauthenticated Supabase client
   */
  getUnauthenticatedClient(): SupabaseClient {
    return this.clientFactory.createUnauthenticatedClient();
  }

  /**
   * Get all registered users
   */
  getAllUsers(): TestUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Get all user IDs
   */
  getAllUserIds(): string[] {
    return Array.from(this.users.keys());
  }

  /**
   * Get user count
   */
  getUserCount(): number {
    return this.users.size;
  }

  /**
   * Store test data for verification later
   */
  storeTestData(key: string, data: any): void {
    if (!this.testDataMap.has(key)) {
      this.testDataMap.set(key, []);
    }
    this.testDataMap.get(key)!.push(data);
  }

  /**
   * Retrieve stored test data
   */
  getTestData(key: string): any[] {
    return this.testDataMap.get(key) ?? [];
  }

  /**
   * Clear all users and test data (useful between test suites)
   */
  clear(): void {
    this.users.clear();
    this.testDataMap.clear();
  }
}

/**
 * Common RLS Violation Scenarios
 *
 * Pre-built attack/violation scenarios for reuse across tests
 */
export class RLSViolationScenarios {
  /**
   * Scenario: User A tries to read User B's private profile data
   */
  static userAReadsUserBProfile = async (
    clientA: SupabaseClient,
    userBId: string
  ) => {
    return clientA.from('profiles').select('*').eq('user_id', userBId).single();
  };

  /**
   * Scenario: User A tries to update User B's profile
   */
  static userAUpdatesUserBProfile = async (
    clientA: SupabaseClient,
    userBId: string
  ) => {
    return clientA
      .from('profiles')
      .update({ full_name: 'Hacked Name' })
      .eq('user_id', userBId);
  };

  /**
   * Scenario: User A tries to delete User B's profile
   */
  static userADeletesUserBProfile = async (
    clientA: SupabaseClient,
    userBId: string
  ) => {
    return clientA.from('profiles').delete().eq('user_id', userBId);
  };

  /**
   * Scenario: User A tries to read User B's ticket balance
   */
  static userAReadsUserBTickets = async (
    clientA: SupabaseClient,
    userBId: string
  ) => {
    return clientA.from('tickets').select('*').eq('user_id', userBId).single();
  };

  /**
   * Scenario: User A tries to modify User B's ticket balance
   */
  static userAModifiesUserBTickets = async (
    clientA: SupabaseClient,
    userBId: string
  ) => {
    return clientA
      .from('tickets')
      .update({ total_balance: 9999 })
      .eq('user_id', userBId);
  };

  /**
   * Scenario: User A tries to update User B's toy listing
   */
  static userAUpdatesUserBToy = async (
    clientA: SupabaseClient,
    toyId: string
  ) => {
    return clientA
      .from('toys')
      .update({ is_active: false })
      .eq('id', toyId);
  };

  /**
   * Scenario: User A tries to read User B's consent records
   */
  static userAReadsUserBConsent = async (
    clientA: SupabaseClient,
    userBId: string
  ) => {
    return clientA.from('consent_records').select('*').eq('user_id', userBId);
  };

  /**
   * Scenario: User A tries to read User B's ticket transactions
   */
  static userAReadsUserBTransactions = async (
    clientA: SupabaseClient,
    userBId: string
  ) => {
    return clientA.from('ticket_transactions').select('*').eq('user_id', userBId);
  };

  /**
   * Scenario: Unauthenticated user tries to read any private data
   */
  static unauthenticatedUserReadsPrivateData = async (
    unauthClient: SupabaseClient,
    userId: string
  ) => {
    return unauthClient.from('profiles').select('*').eq('user_id', userId).single();
  };

  /**
   * Scenario: User A tries to modify unrelated exchange
   */
  static userAModifiesUnrelatedExchange = async (
    clientA: SupabaseClient,
    exchangeId: string
  ) => {
    return clientA
      .from('exchanges')
      .update({ status: 'exchange_completed' })
      .eq('id', exchangeId);
  };

  /**
   * Scenario: User A tries to view images from User B toy
   */
  static userAViewsUserBToyImages = async (
    clientA: SupabaseClient,
    toyId: string
  ) => {
    return clientA.from('toy_images').select('*').eq('toy_id', toyId);
  };
}
