/**
 * RLS Test Helpers
 * Utilities for testing Row-Level Security (RLS) policies
 *
 * This module provides:
 * - Mock Supabase client factories for different user contexts
 * - JWT token simulation
 * - User context switching
 * - Helper assertions for security testing
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Test user contexts for simulating different authentication states
 */
export interface TestUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

/**
 * Create a test user with standard properties
 */
export const createTestUser = (id: string, email: string, name: string): TestUser => ({
  id,
  email,
  name,
});

/**
 * Mock Supabase client factory
 * Creates a client configured for a specific user context
 *
 * In production, Supabase uses JWT tokens from auth.users.
 * For testing, we simulate this by setting the auth header with user context.
 */
export class MockSupabaseClientFactory {
  private projectUrl: string;
  private anonKey: string;
  private currentUser: TestUser | null = null;

  constructor(projectUrl: string, anonKey: string) {
    this.projectUrl = projectUrl;
    this.anonKey = anonKey;
  }

  /**
   * Create a client for a specific user
   */
  createClientForUser(user: TestUser): SupabaseClient {
    return createClient(this.projectUrl, this.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        // In real scenarios, this would be a JWT token.
        // For testing, Supabase client handles the auth context internally.
      },
      global: {
        headers: {
          // These headers would normally be set by the auth system
          // For testing purposes, we're documenting the expected structure
          'X-USER-ID': user.id,
        },
      },
    });
  }

  /**
   * Create an unauthenticated client (no auth context)
   */
  createUnauthenticatedClient(): SupabaseClient {
    return createClient(this.projectUrl, this.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Simulate service role access (backend operations)
   * In production, this uses SUPABASE_SERVICE_ROLE_KEY
   */
  createServiceRoleClient(serviceRoleKey: string): SupabaseClient {
    return createClient(this.projectUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
}

/**
 * RLS Test Assertion Helpers
 */
export class RLSAssertions {
  /**
   * Assert that a query was denied (403 Forbidden)
   * This happens when RLS policy blocks the operation
   */
  static async assertDenied(
    fn: () => Promise<any>,
    message: string = 'Operation should have been denied by RLS'
  ): Promise<void> {
    try {
      const result = await fn();
      if (result.error && result.error.code === 'PGRST116') {
        // PGRST116 is Supabase's standard RLS violation error
        return; // Expected behavior
      }
      throw new Error(
        `${message}: Expected RLS denial but operation succeeded. Result: ${JSON.stringify(result)}`
      );
    } catch (error: any) {
      if (error.message?.includes('Expected RLS denial')) {
        throw error;
      }
      // Other errors might also indicate denial
      if (
        error.code === '403' ||
        error.message?.includes('denied') ||
        error.message?.includes('permission')
      ) {
        return; // Expected
      }
      throw error;
    }
  }

  /**
   * Assert that a query was allowed
   */
  static async assertAllowed(
    fn: () => Promise<any>,
    message: string = 'Operation should have been allowed'
  ): Promise<any> {
    const result = await fn();
    if (result.error) {
      throw new Error(
        `${message}: Operation was denied. Error: ${result.error.message} (${result.error.code})`
      );
    }
    return result.data;
  }

  /**
   * Assert that query results respect user isolation
   * (user A cannot see user B's private data)
   */
  static assertUserIsolation(
    results: any[],
    userIdField: string,
    expectedUserId: string,
    message: string = 'User isolation violated'
  ): void {
    if (!Array.isArray(results)) {
      throw new Error('Results must be an array');
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
   * Assert that a specific record is visible
   */
  static assertRecordVisible(results: any[], recordId: string, idField: string = 'id'): void {
    const found = results.some((r) => r[idField] === recordId);
    if (!found) {
      throw new Error(`Record ${recordId} should be visible but was not found in results`);
    }
  }

  /**
   * Assert that a specific record is hidden
   */
  static assertRecordHidden(results: any[], recordId: string, idField: string = 'id'): void {
    const found = results.some((r) => r[idField] === recordId);
    if (found) {
      throw new Error(`Record ${recordId} should be hidden but was found in results`);
    }
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  /**
   * Generate a test profile
   */
  static generateProfile(
    userId: string,
    email: string = `user-${userId.slice(0, 8)}@test.com`,
    fullName: string = 'Test User'
  ) {
    return {
      user_id: userId,
      email,
      full_name: fullName,
      language_preference: 'en',
      postal_code: '12345',
      is_email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Generate a test ticket record
   */
  static generateTicket(userId: string, totalBalance: number = 10) {
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      total_balance: totalBalance,
      frozen_listing_tickets: 0,
      frozen_exchange_tickets: 0,
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
    isActive: boolean = true
  ) {
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      category,
      description: 'A nice toy for testing',
      tags: ['test'],
      age_group: '3-5',
      condition: 'good',
      postal_code: '12345',
      is_active: isActive,
      frozen_listing_tickets: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Generate a test toy image
   */
  static generateToyImage(toyId: string, imageOrder: number = 1) {
    return {
      id: crypto.randomUUID(),
      toy_id: toyId,
      storage_path: `toys/${toyId}/image-${imageOrder}.jpg`,
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
    status: string = 'pending_requester_confirmation'
  ) {
    return {
      id: crypto.randomUUID(),
      toy_id: toyId,
      requester_id: requesterId,
      owner_id: ownerId,
      status,
      delivery_method: 'in_person',
      requester_message: 'I would like to exchange this toy',
      frozen_requester_tickets: 1,
      frozen_owner_tickets: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_response_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      delivery_deadline: null,
    };
  }

  /**
   * Generate a test consent record
   */
  static generateConsentRecord(
    userId: string,
    consentType: string = 'privacy_policy',
    consentGiven: boolean = true
  ) {
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      consent_type: consentType,
      consent_given: consentGiven,
      timestamp: new Date().toISOString(),
      ip_address: '127.0.0.1',
      user_agent: 'Test Agent',
      withdrawn_at: null,
    };
  }

  /**
   * Generate a test ticket transaction
   */
  static generateTicketTransaction(
    userId: string,
    transactionType: string = 'listing_created',
    amount: number = -1
  ) {
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      transaction_type: transactionType,
      amount,
      reference_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
  }
}

/**
 * RLS Test Context Manager
 * Manages user contexts and provides helpers for multi-user scenarios
 */
export class RLSTestContext {
  private users: Map<string, TestUser> = new Map();
  private clientFactory: MockSupabaseClientFactory;

  constructor(clientFactory: MockSupabaseClientFactory) {
    this.clientFactory = clientFactory;
  }

  /**
   * Register a test user
   */
  registerUser(user: TestUser): void {
    this.users.set(user.id, user);
  }

  /**
   * Register multiple test users
   */
  registerUsers(...users: TestUser[]): void {
    users.forEach((user) => this.registerUser(user));
  }

  /**
   * Get a registered user
   */
  getUser(userId: string): TestUser {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not registered in test context`);
    }
    return user;
  }

  /**
   * Get client for a specific user
   */
  getClientForUser(userId: string): SupabaseClient {
    const user = this.getUser(userId);
    return this.clientFactory.createClientForUser(user);
  }

  /**
   * Get unauthenticated client
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
   * Clear all users (useful between test suites)
   */
  clear(): void {
    this.users.clear();
  }
}

/**
 * Common RLS violation scenarios
 */
export class RLSViolationScenarios {
  /**
   * Scenario: User A tries to read User B's private profile data
   */
  static userAReadsUserBProfile = async (
    clientA: SupabaseClient,
    clientB: SupabaseClient,
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
}
