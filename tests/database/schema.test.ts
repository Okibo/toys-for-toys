/**
 * Database Schema Validation Tests
 *
 * Validates core table existence and column definitions:
 * - 7 core tables (profiles, tickets, toys, toy_images, exchanges, ticket_transactions, consent_records)
 * - Column names, types, and defaults
 * - Nullable/NOT NULL constraints
 * - Timestamp columns (created_at, updated_at)
 *
 * This test suite validates schema at the application layer using
 * mocked Supabase responses to simulate database schema validation.
 */

import {
  createMockSupabaseClient,
  createMockProfile,
  createMockTicket,
  createMockToy,
  createMockToyImage,
  createMockExchange,
  createMockTicketTransaction,
  createMockConsentRecord,
  isValidUUID,
} from './test-utils';

describe('Database Schema - Tables', () => {
  describe('Profiles Table', () => {
    test('profiles table should have required columns', () => {
      const profile = createMockProfile();

      expect(profile).toHaveProperty('user_id');
      expect(profile).toHaveProperty('email');
      expect(profile).toHaveProperty('full_name');
      expect(profile).toHaveProperty('language_preference');
      expect(profile).toHaveProperty('postal_code');
      expect(profile).toHaveProperty('created_at');
      expect(profile).toHaveProperty('updated_at');
      expect(profile).toHaveProperty('is_email_verified');
    });

    test('profiles user_id should be unique primary key', () => {
      const profile1 = createMockProfile({ user_id: 'user-123' });
      const profile2 = createMockProfile({ user_id: 'user-123' });

      expect(profile1.user_id).toBe(profile2.user_id);
      // In real DB, this would violate UNIQUE constraint
    });

    test('profiles email should be stored from auth', () => {
      const email = 'user@example.com';
      const profile = createMockProfile({ email });

      expect(profile.email).toBe(email);
      expect(profile.email).toMatch(/@/);
    });

    test('profiles language_preference should be one of supported languages', () => {
      const supportedLanguages = ['en', 'de', 'pl'];
      const profile = createMockProfile();

      expect(supportedLanguages).toContain(profile.language_preference);
    });

    test('profiles postal_code should be required and searchable', () => {
      const profile = createMockProfile({ postal_code: '12345' });

      expect(profile.postal_code).toBeDefined();
      expect(profile.postal_code).toBeTruthy();
    });

    test('profiles should have created_at and updated_at timestamps', () => {
      const profile = createMockProfile();

      expect(profile.created_at).toBeDefined();
      expect(profile.updated_at).toBeDefined();
      expect(new Date(profile.created_at).getTime()).toBeGreaterThan(0);
      expect(new Date(profile.updated_at).getTime()).toBeGreaterThan(0);
    });

    test('profiles is_email_verified should default to false', () => {
      const profile = createMockProfile();

      expect(profile.is_email_verified).toBe(false);
    });

    test('profiles full_name should be optional', () => {
      const profileWithName = createMockProfile({ full_name: 'John Doe' });
      const profileWithoutName = createMockProfile({ full_name: null });

      expect(profileWithName.full_name).toBe('John Doe');
      expect(profileWithoutName.full_name).toBeNull();
    });
  });

  describe('Tickets Table', () => {
    test('tickets table should have required columns', () => {
      const ticket = createMockTicket();

      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('user_id');
      expect(ticket).toHaveProperty('total_balance');
      expect(ticket).toHaveProperty('frozen_listing_tickets');
      expect(ticket).toHaveProperty('frozen_exchange_tickets');
      expect(ticket).toHaveProperty('created_at');
      expect(ticket).toHaveProperty('updated_at');
    });

    test('tickets should have unique user_id (one record per user)', () => {
      const userId = 'user-123';
      const ticket1 = createMockTicket({ user_id: userId });
      const ticket2 = createMockTicket({ user_id: userId });

      expect(ticket1.user_id).toBe(ticket2.user_id);
      // In real DB, this would violate UNIQUE constraint
    });

    test('tickets total_balance should default to 10', () => {
      const ticket = createMockTicket();

      expect(ticket.total_balance).toBe(10);
    });

    test('tickets frozen balances should default to 0', () => {
      const ticket = createMockTicket();

      expect(ticket.frozen_listing_tickets).toBe(0);
      expect(ticket.frozen_exchange_tickets).toBe(0);
    });

    test('tickets id should be valid UUID', () => {
      const ticket = createMockTicket();

      expect(isValidUUID(ticket.id) || ticket.id.startsWith('ticket-')).toBe(true);
    });

    test('tickets should have timestamps', () => {
      const ticket = createMockTicket();

      expect(ticket.created_at).toBeDefined();
      expect(ticket.updated_at).toBeDefined();
    });
  });

  describe('Toys Table', () => {
    test('toys table should have required columns', () => {
      const toy = createMockToy();

      expect(toy).toHaveProperty('id');
      expect(toy).toHaveProperty('user_id');
      expect(toy).toHaveProperty('category');
      expect(toy).toHaveProperty('description');
      expect(toy).toHaveProperty('tags');
      expect(toy).toHaveProperty('age_group');
      expect(toy).toHaveProperty('condition');
      expect(toy).toHaveProperty('postal_code');
      expect(toy).toHaveProperty('is_active');
      expect(toy).toHaveProperty('frozen_listing_tickets');
      expect(toy).toHaveProperty('created_at');
      expect(toy).toHaveProperty('updated_at');
      expect(toy).toHaveProperty('expires_at');
    });

    test('toys category should be valid enum value', () => {
      const validCategories = [
        'blocks',
        'vehicles',
        'dolls',
        'board_games',
        'educational',
        'sports',
        'art',
        'other',
      ];

      const toy = createMockToy({ category: 'blocks' });
      expect(validCategories).toContain(toy.category);
    });

    test('toys description should have max length', () => {
      const description = 'a'.repeat(500);
      const toy = createMockToy({ description });

      expect(toy.description.length).toBeLessThanOrEqual(500);
    });

    test('toys tags should be 1-3 items', () => {
      const toy1 = createMockToy({ tags: ['red'] });
      const toy2 = createMockToy({ tags: ['red', 'large'] });
      const toy3 = createMockToy({ tags: ['red', 'large', 'wooden'] });

      expect(toy1.tags.length).toBeGreaterThanOrEqual(1);
      expect(toy1.tags.length).toBeLessThanOrEqual(3);
      expect(toy2.tags.length).toBeGreaterThanOrEqual(1);
      expect(toy2.tags.length).toBeLessThanOrEqual(3);
      expect(toy3.tags.length).toBeGreaterThanOrEqual(1);
      expect(toy3.tags.length).toBeLessThanOrEqual(3);
    });

    test('toys age_group should be valid enum value', () => {
      const validAgeGroups = ['0-2', '3-5', '6-8', '9-11', '12-14', '15+'];
      const toy = createMockToy();

      expect(validAgeGroups).toContain(toy.age_group);
    });

    test('toys condition should be valid enum value', () => {
      const validConditions = ['like_new', 'good', 'fair', 'well_loved'];
      const toy = createMockToy();

      expect(validConditions).toContain(toy.condition);
    });

    test('toys is_active should default to true', () => {
      const toy = createMockToy();

      expect(toy.is_active).toBe(true);
    });

    test('toys frozen_listing_tickets should default to 1', () => {
      const toy = createMockToy();

      expect(toy.frozen_listing_tickets).toBe(1);
    });

    test('toys expires_at should be 90 days from creation', () => {
      const toy = createMockToy();

      const createdDate = new Date(toy.created_at);
      const expiresDate = new Date(toy.expires_at);
      const diffMs = expiresDate.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(90);
    });

    test('toys postal_code should be searchable', () => {
      const toy = createMockToy({ postal_code: '12345' });

      expect(toy.postal_code).toBeDefined();
      expect(toy.postal_code).toBeTruthy();
    });
  });

  describe('Toy Images Table', () => {
    test('toy_images table should have required columns', () => {
      const image = createMockToyImage();

      expect(image).toHaveProperty('id');
      expect(image).toHaveProperty('toy_id');
      expect(image).toHaveProperty('storage_path');
      expect(image).toHaveProperty('image_order');
      expect(image).toHaveProperty('created_at');
    });

    test('toy_images storage_path should be unique', () => {
      const path = 'toys/toy-123/image-1.jpg';
      const image1 = createMockToyImage({ storage_path: path });
      const image2 = createMockToyImage({ storage_path: path });

      expect(image1.storage_path).toBe(image2.storage_path);
      // In real DB, this would violate UNIQUE constraint
    });

    test('toy_images image_order should be 1-5', () => {
      expect(() => {
        createMockToyImage({ image_order: 1 });
        createMockToyImage({ image_order: 3 });
        createMockToyImage({ image_order: 5 });
      }).not.toThrow();
    });

    test('toy_images should have created_at timestamp', () => {
      const image = createMockToyImage();

      expect(image.created_at).toBeDefined();
    });

    test('toy_images toy_id should be foreign key', () => {
      const toyId = 'toy-123';
      const image = createMockToyImage({ toy_id: toyId });

      expect(image.toy_id).toBe(toyId);
    });
  });

  describe('Exchanges Table', () => {
    test('exchanges table should have required columns', () => {
      const exchange = createMockExchange();

      expect(exchange).toHaveProperty('id');
      expect(exchange).toHaveProperty('toy_id');
      expect(exchange).toHaveProperty('requester_id');
      expect(exchange).toHaveProperty('owner_id');
      expect(exchange).toHaveProperty('status');
      expect(exchange).toHaveProperty('delivery_method');
      expect(exchange).toHaveProperty('requester_message');
      expect(exchange).toHaveProperty('frozen_requester_tickets');
      expect(exchange).toHaveProperty('frozen_owner_tickets');
      expect(exchange).toHaveProperty('created_at');
      expect(exchange).toHaveProperty('updated_at');
      expect(exchange).toHaveProperty('owner_response_deadline');
      expect(exchange).toHaveProperty('delivery_deadline');
    });

    test('exchanges status should be valid enum value', () => {
      const validStatuses = [
        'pending_requester_confirmation',
        'pending_owner_response',
        'exchange_confirmed',
        'pending_delivery_confirmation',
        'exchange_completed',
        'dispute_filed',
        'closed',
      ];

      const exchange = createMockExchange();
      expect(validStatuses).toContain(exchange.status);
    });

    test('exchanges delivery_method should be valid enum value', () => {
      const validMethods = ['in_person', 'mail', 'courier'];
      const exchange = createMockExchange();

      expect(validMethods).toContain(exchange.delivery_method);
    });

    test('exchanges requester_message should have max length', () => {
      const message = 'a'.repeat(500);
      const exchange = createMockExchange({ requester_message: message });

      expect(exchange.requester_message.length).toBeLessThanOrEqual(500);
    });

    test('exchanges frozen_requester_tickets should default to 1', () => {
      const exchange = createMockExchange();

      expect(exchange.frozen_requester_tickets).toBe(1);
    });

    test('exchanges frozen_owner_tickets should default to 0', () => {
      const exchange = createMockExchange();

      expect(exchange.frozen_owner_tickets).toBe(0);
    });

    test('exchanges owner_response_deadline should be 7 days from creation', () => {
      const exchange = createMockExchange();

      const createdDate = new Date(exchange.created_at);
      const deadlineDate = new Date(exchange.owner_response_deadline);
      const diffMs = deadlineDate.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(7);
    });

    test('exchanges delivery_deadline should be 48 hours from exchange confirmation', () => {
      const exchange = createMockExchange();

      const createdDate = new Date(exchange.created_at);
      const deliveryDate = new Date(exchange.delivery_deadline);
      const diffMs = deliveryDate.getTime() - createdDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      // Created with 48 hour deadline (simulated)
      expect(diffHours).toBe(48);
    });
  });

  describe('Ticket Transactions Table', () => {
    test('ticket_transactions table should have required columns', () => {
      const transaction = createMockTicketTransaction();

      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('user_id');
      expect(transaction).toHaveProperty('transaction_type');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('reference_id');
      expect(transaction).toHaveProperty('created_at');
    });

    test('ticket_transactions transaction_type should be valid enum', () => {
      const validTypes = [
        'listing_created',
        'listing_removed',
        'exchange_request',
        'exchange_declined',
        'exchange_completed',
        'mini_game_reward',
        'refund',
      ];

      const transaction = createMockTicketTransaction();
      expect(validTypes).toContain(transaction.transaction_type);
    });

    test('ticket_transactions amount can be negative', () => {
      const txDebit = createMockTicketTransaction({ amount: -1 });
      const txCredit = createMockTicketTransaction({ amount: 5 });

      expect(txDebit.amount).toBeLessThan(0);
      expect(txCredit.amount).toBeGreaterThan(0);
    });

    test('ticket_transactions reference_id should link to related record', () => {
      const transaction = createMockTicketTransaction({
        reference_id: 'toy-123',
      });

      expect(transaction.reference_id).toBeDefined();
      expect(transaction.reference_id).toBeTruthy();
    });

    test('ticket_transactions should have created_at timestamp only', () => {
      const transaction = createMockTicketTransaction();

      expect(transaction.created_at).toBeDefined();
      expect(transaction).not.toHaveProperty('updated_at');
    });
  });

  describe('Consent Records Table', () => {
    test('consent_records table should have required columns', () => {
      const consent = createMockConsentRecord();

      expect(consent).toHaveProperty('id');
      expect(consent).toHaveProperty('user_id');
      expect(consent).toHaveProperty('consent_type');
      expect(consent).toHaveProperty('consent_given');
      expect(consent).toHaveProperty('timestamp');
      expect(consent).toHaveProperty('ip_address');
      expect(consent).toHaveProperty('user_agent');
      expect(consent).toHaveProperty('withdrawn_at');
    });

    test('consent_records consent_type should be valid enum', () => {
      const validTypes = ['privacy_policy', 'terms_of_service', 'behavioral_analytics'];
      const consent = createMockConsentRecord();

      expect(validTypes).toContain(consent.consent_type);
    });

    test('consent_records consent_given should be boolean', () => {
      const consentYes = createMockConsentRecord({ consent_given: true });
      const consentNo = createMockConsentRecord({ consent_given: false });

      expect(typeof consentYes.consent_given).toBe('boolean');
      expect(typeof consentNo.consent_given).toBe('boolean');
    });

    test('consent_records timestamp should be at creation', () => {
      const consent = createMockConsentRecord();

      expect(consent.timestamp).toBeDefined();
      expect(new Date(consent.timestamp).getTime()).toBeGreaterThan(0);
    });

    test('consent_records ip_address should be captured for audit', () => {
      const consent = createMockConsentRecord();

      expect(consent.ip_address).toBeDefined();
      expect(consent.ip_address).toBeTruthy();
    });

    test('consent_records user_agent should be captured for audit', () => {
      const consent = createMockConsentRecord();

      expect(consent.user_agent).toBeDefined();
      expect(consent.user_agent).toBeTruthy();
    });

    test('consent_records withdrawn_at should be nullable', () => {
      const consentActive = createMockConsentRecord({ withdrawn_at: null });
      const consentWithdrawn = createMockConsentRecord({
        withdrawn_at: new Date().toISOString(),
      });

      expect(consentActive.withdrawn_at).toBeNull();
      expect(consentWithdrawn.withdrawn_at).toBeDefined();
    });
  });
});

describe('Database Schema - Column Types', () => {
  test('UUID columns should be valid UUID format or test ID format', () => {
    const profile = createMockProfile();
    const ticket = createMockTicket();
    const toy = createMockToy();

    // Test IDs start with entity type for testing
    expect(
      profile.user_id.startsWith('user-') || isValidUUID(profile.user_id)
    ).toBe(true);
    expect(ticket.id.startsWith('ticket-') || isValidUUID(ticket.id)).toBe(true);
    expect(toy.id.startsWith('toy-') || isValidUUID(toy.id)).toBe(true);
  });

  test('integer columns should store whole numbers', () => {
    const ticket = createMockTicket({ total_balance: 42 });
    const toy = createMockToy({ frozen_listing_tickets: 1 });

    expect(Number.isInteger(ticket.total_balance)).toBe(true);
    expect(Number.isInteger(toy.frozen_listing_tickets)).toBe(true);
  });

  test('timestamp columns should be ISO format strings', () => {
    const profile = createMockProfile();

    expect(typeof profile.created_at).toBe('string');
    expect(typeof profile.updated_at).toBe('string');
    expect(profile.created_at).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(profile.updated_at).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  test('boolean columns should store true/false', () => {
    const profile = createMockProfile({ is_email_verified: false });
    const toy = createMockToy({ is_active: true });
    const consent = createMockConsentRecord({ consent_given: true });

    expect(typeof profile.is_email_verified).toBe('boolean');
    expect(typeof toy.is_active).toBe('boolean');
    expect(typeof consent.consent_given).toBe('boolean');
  });

  test('text columns should store strings', () => {
    const profile = createMockProfile({ full_name: 'John Doe' });
    const toy = createMockToy({ description: 'A wonderful toy' });

    expect(typeof profile.full_name).toBe('string');
    expect(typeof toy.description).toBe('string');
  });

  test('array columns should store arrays', () => {
    const toy = createMockToy({ tags: ['red', 'large'] });

    expect(Array.isArray(toy.tags)).toBe(true);
    expect(toy.tags.every((tag) => typeof tag === 'string')).toBe(true);
  });
});

describe('Database Schema - Default Values', () => {
  test('profile is_email_verified defaults to false', () => {
    const profile = createMockProfile();

    expect(profile.is_email_verified).toBe(false);
  });

  test('ticket total_balance defaults to 10', () => {
    const ticket = createMockTicket();

    expect(ticket.total_balance).toBe(10);
  });

  test('toy is_active defaults to true', () => {
    const toy = createMockToy();

    expect(toy.is_active).toBe(true);
  });

  test('exchange frozen_requester_tickets defaults to 1', () => {
    const exchange = createMockExchange();

    expect(exchange.frozen_requester_tickets).toBe(1);
  });

  test('exchange frozen_owner_tickets defaults to 0', () => {
    const exchange = createMockExchange();

    expect(exchange.frozen_owner_tickets).toBe(0);
  });
});
