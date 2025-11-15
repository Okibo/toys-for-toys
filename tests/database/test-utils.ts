/**
 * Database Test Utilities
 *
 * Provides helper functions and test data factories for database schema testing:
 * - Mock Supabase client creation
 * - Test data factories for common entities
 * - Helper functions for assertions
 * - Type-safe test data builders
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock Supabase client for testing
 * Provides chainable query builder pattern matching Supabase PostgREST API
 */
export const createMockSupabaseClient = (): any => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  then: jest.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    refreshSession: jest.fn(),
  },
  on: jest.fn(),
  subscribe: jest.fn(),
});

/**
 * Test Data Factory: Profile
 * Creates valid profile test data
 */
export const createMockProfile = (overrides?: Partial<any>) => ({
  user_id: 'user-' + Math.random().toString(36).substr(2, 9),
  email: `test-${Date.now()}@example.com`,
  full_name: 'Test User',
  language_preference: 'en',
  postal_code: '12345',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_email_verified: false,
  ...overrides,
});

/**
 * Test Data Factory: Ticket
 * Creates valid ticket test data
 */
export const createMockTicket = (overrides?: Partial<any>) => ({
  id: 'ticket-' + Math.random().toString(36).substr(2, 9),
  user_id: 'user-' + Math.random().toString(36).substr(2, 9),
  total_balance: 10,
  frozen_listing_tickets: 0,
  frozen_exchange_tickets: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Test Data Factory: Toy
 * Creates valid toy listing test data
 */
export const createMockToy = (overrides?: Partial<any>) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  return {
    id: 'toy-' + Math.random().toString(36).substr(2, 9),
    user_id: 'user-' + Math.random().toString(36).substr(2, 9),
    category: 'blocks' as const,
    description: 'A wonderful toy for children',
    tags: ['red', 'large'],
    age_group: '6-8' as const,
    condition: 'like_new' as const,
    postal_code: '12345',
    is_active: true,
    frozen_listing_tickets: 1,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    ...overrides,
  };
};

/**
 * Test Data Factory: Toy Image
 * Creates valid toy image test data
 */
export const createMockToyImage = (overrides?: Partial<any>) => ({
  id: 'image-' + Math.random().toString(36).substr(2, 9),
  toy_id: 'toy-' + Math.random().toString(36).substr(2, 9),
  storage_path: `toys/toy-${Date.now()}/image-1.jpg`,
  image_order: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Test Data Factory: Exchange
 * Creates valid exchange test data
 */
export const createMockExchange = (overrides?: Partial<any>) => {
  const now = new Date();
  const ownerResponseDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const deliveryDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  return {
    id: 'exchange-' + Math.random().toString(36).substr(2, 9),
    toy_id: 'toy-' + Math.random().toString(36).substr(2, 9),
    requester_id: 'user-' + Math.random().toString(36).substr(2, 9),
    owner_id: 'user-' + Math.random().toString(36).substr(2, 9),
    status: 'pending_requester_confirmation' as const,
    delivery_method: 'in_person' as const,
    requester_message: 'I would like to exchange this toy',
    frozen_requester_tickets: 1,
    frozen_owner_tickets: 0,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    owner_response_deadline: ownerResponseDeadline.toISOString(),
    delivery_deadline: deliveryDeadline.toISOString(),
    ...overrides,
  };
};

/**
 * Test Data Factory: Ticket Transaction
 * Creates valid ticket transaction test data
 */
export const createMockTicketTransaction = (overrides?: Partial<any>) => ({
  id: 'tx-' + Math.random().toString(36).substr(2, 9),
  user_id: 'user-' + Math.random().toString(36).substr(2, 9),
  transaction_type: 'listing_created' as const,
  amount: -1,
  reference_id: 'toy-' + Math.random().toString(36).substr(2, 9),
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Test Data Factory: Consent Record
 * Creates valid consent record test data
 */
export const createMockConsentRecord = (overrides?: Partial<any>) => ({
  id: 'consent-' + Math.random().toString(36).substr(2, 9),
  user_id: 'user-' + Math.random().toString(36).substr(2, 9),
  consent_type: 'privacy_policy' as const,
  consent_given: true,
  timestamp: new Date().toISOString(),
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0 (Test)',
  withdrawn_at: null,
  ...overrides,
});

/**
 * Helper: Calculate future date
 * @param days - Number of days in the future
 * @returns ISO string of future date
 */
export const getFutureDate = (days: number): string => {
  const future = new Date();
  future.setDate(future.getDate() + days);
  return future.toISOString();
};

/**
 * Helper: Mock query response
 * @param data - Response data
 * @param error - Optional error
 * @returns Standard Supabase response format
 */
export const mockQueryResponse = (data: any, error: any = null) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : 1,
  status: error ? 400 : 200,
});

/**
 * Helper: Validate UUID format
 * @param value - Value to validate
 * @returns True if valid UUID format
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Helper: Validate enum value
 * @param value - Value to validate
 * @param enumValues - Array of valid enum values
 * @returns True if value is in enum
 */
export const isValidEnumValue = (
  value: string,
  enumValues: readonly string[]
): boolean => {
  return enumValues.includes(value);
};

/**
 * Helper: Validate postal code format (basic)
 * @param postalCode - Postal code to validate
 * @returns True if valid format
 */
export const isValidPostalCode = (postalCode: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(postalCode) || /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(postalCode);
};

/**
 * Helper: Validate email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Helper: Validate tag array
 * @param tags - Tags array to validate
 * @returns True if valid (1-3 tags)
 */
export const isValidTags = (tags: string[]): boolean => {
  return Array.isArray(tags) && tags.length >= 1 && tags.length <= 3;
};

/**
 * Helper: Calculate expires_at timestamp
 * Should be 90 days from creation
 * @param createdAt - Creation date ISO string
 * @returns Expected expiration date
 */
export const calculateExpiration = (createdAt: string): Date => {
  const created = new Date(createdAt);
  const expires = new Date(created);
  expires.setDate(expires.getDate() + 90);
  return expires;
};

/**
 * Helper: Validate frozen balance constraint
 * total_balance >= frozen_listing_tickets + frozen_exchange_tickets
 */
export const isValidFrozenBalance = (
  totalBalance: number,
  frozenListingTickets: number,
  frozenExchangeTickets: number
): boolean => {
  return totalBalance >= frozenListingTickets + frozenExchangeTickets;
};

/**
 * Type definitions for test utilities
 */
export type MockProfile = ReturnType<typeof createMockProfile>;
export type MockTicket = ReturnType<typeof createMockTicket>;
export type MockToy = ReturnType<typeof createMockToy>;
export type MockToyImage = ReturnType<typeof createMockToyImage>;
export type MockExchange = ReturnType<typeof createMockExchange>;
export type MockTicketTransaction = ReturnType<typeof createMockTicketTransaction>;
export type MockConsentRecord = ReturnType<typeof createMockConsentRecord>;
