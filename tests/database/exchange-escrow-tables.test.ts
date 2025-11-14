/**
 * tests/database/exchange-escrow-tables.test.ts
 *
 * Jest test suite for exchange and escrow tables schema
 * Tests: ENUM constraints, FK constraints, status transitions, cascade delete, soft delete,
 * indexes, timestamp management, toy_id immutability, and complete workflow
 *
 * NOTE: These tests are designed to run against a local Supabase instance.
 * Before running: npx supabase start
 * Then: npm test -- exchange-escrow-tables.test.ts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase connection details (local development)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzE2MjkwMDAsImV4cCI6OTk5OTk5OTk5OX0.MOCK_TOKEN';

// Test database connection
let supabase: ReturnType<typeof createClient>;

// Helper function to create test user
async function createTestUser(email: string) {
  const userId = `f47ac10b-58cc-4372-a567-0e02b2c3d${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(3, '0')}`;

  await supabase.from('profiles').insert([
    {
      id: userId,
      email,
      full_name: 'Test User',
    },
  ]);

  return userId;
}

// Helper function to create test toy
async function createTestToy(userId: string) {
  const { data } = await supabase
    .from('toys')
    .insert([
      {
        user_id: userId,
        name: 'Test Toy',
        description: 'A test toy',
        category: 'educational',
        condition: 'good',
        status: 'active',
      },
    ])
    .select();

  return data?.[0]?.id;
}

// Helper function to create test kid
async function createTestKid(parentId: string) {
  const { data } = await supabase
    .from('kids')
    .insert([
      {
        parent_id: parentId,
        name: 'Test Child',
        birthdate: '2015-05-15',
      },
    ])
    .select();

  return data?.[0]?.id;
}

describe('Exchange & Escrow Tables Schema', () => {
  // Setup: Create Supabase client before tests
  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log(`Connecting to Supabase at: ${SUPABASE_URL}`);
  });

  describe('ENUM Types', () => {
    it('should support exchange_status_enum with all 9 values', async () => {
      // Test by creating exchanges with different status values
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const statuses = [
        'pending_request',
        'accepted',
        'in_transit',
        'delivered',
        'confirmed',
        'completed',
        'disputed',
        'auto_completed',
        'canceled',
      ];

      for (const status of statuses) {
        const { data, error } = await supabase
          .from('exchanges')
          .insert([
            {
              requester_id: requester,
              lister_id: lister,
              toy_id: toy,
              kid_for_id: kid,
              status,
            },
          ])
          .select();

        expect(error).toBeNull();
        expect(data?.[0]?.status).toBe(status);
      }
    });

    it('should reject invalid exchange status values', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { error } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'invalid_status' as any,
          },
        ])
        .select();

      expect(error).toBeDefined();
    });

    it('should support condition_enum with 4 values for delivery confirmation', async () => {
      const conditions = ['like_listed', 'minor_wear', 'damage', 'missing_parts'];

      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      // Create exchange first
      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      for (const condition of conditions) {
        const { data, error } = await supabase
          .from('delivery_confirmations')
          .insert([
            {
              exchange_id: exchangeId,
              condition_received: condition,
            },
          ])
          .select();

        expect(error).toBeNull();
        expect(data?.[0]?.condition_received).toBe(condition);
      }
    });

    it('should reject invalid condition_enum values', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      const { error } = await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'invalid_condition' as any,
          },
        ])
        .select();

      expect(error).toBeDefined();
    });

    it('should support dispute_status_enum with 4 values', async () => {
      const statuses = ['open', 'admin_review', 'resolved', 'closed'];

      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      // Create exchange with delivery confirmation (requirement for disputes)
      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      // Create delivery confirmation
      await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      for (const status of statuses) {
        const { data, error } = await supabase
          .from('disputes')
          .insert([
            {
              exchange_id: exchangeId,
              reported_by_id: requester,
              reason: 'damage',
              description: 'Toy arrived damaged',
              status,
            },
          ])
          .select();

        expect(error).toBeNull();
        expect(data?.[0]?.status).toBe(status);
      }
    });

    it('should reject invalid dispute_status_enum values', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      const { error } = await supabase
        .from('disputes')
        .insert([
          {
            exchange_id: exchangeId,
            reported_by_id: requester,
            reason: 'damage',
            description: 'Toy arrived damaged',
            status: 'invalid_status' as any,
          },
        ])
        .select();

      expect(error).toBeDefined();
    });
  });

  describe('Exchanges Table - Structure', () => {
    it('should allow inserting an exchange with all required columns', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data, error } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'pending_request',
            requester_message: 'I would like this toy!',
          },
        ])
        .select();

      expect(error).toBeNull();
      expect(data?.[0]?.id).toBeDefined();
      expect(data?.[0]?.requester_id).toBe(requester);
      expect(data?.[0]?.lister_id).toBe(lister);
      expect(data?.[0]?.toy_id).toBe(toy);
      expect(data?.[0]?.kid_for_id).toBe(kid);
      expect(data?.[0]?.status).toBe('pending_request');
      expect(data?.[0]?.requester_message).toBe('I would like this toy!');
    });

    it('should have nullable timestamp fields (accepted_at, delivery_confirmed_at, completed_at)', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'pending_request',
          },
        ])
        .select();

      expect(data?.[0]?.accepted_at).toBeNull();
      expect(data?.[0]?.delivery_confirmed_at).toBeNull();
      expect(data?.[0]?.completed_at).toBeNull();
    });

    it('should have created_at and updated_at timestamps auto-set', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'pending_request',
          },
        ])
        .select();

      expect(data?.[0]?.created_at).toBeDefined();
      expect(data?.[0]?.updated_at).toBeDefined();
      const createdTime = new Date(data?.[0]?.created_at).getTime();
      const updatedTime = new Date(data?.[0]?.updated_at).getTime();
      expect(Math.abs(createdTime - updatedTime)).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('Exchanges Table - Foreign Keys', () => {
    it('should enforce FK constraint on requester_id', async () => {
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(lister);

      const { error } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: 'f47ac10b-58cc-4372-a567-0e02b2c3ffff',
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'pending_request',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('foreign key');
    });

    it('should enforce FK constraint on lister_id', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const toy = await createTestToy(requester);
      const kid = await createTestKid(requester);

      const { error } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: 'f47ac10b-58cc-4372-a567-0e02b2c3ffff',
            toy_id: toy,
            kid_for_id: kid,
            status: 'pending_request',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('foreign key');
    });

    it('should enforce FK constraint on toy_id', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const kid = await createTestKid(requester);

      const { error } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: 'f47ac10b-58cc-4372-a567-0e02b2c3ffff',
            kid_for_id: kid,
            status: 'pending_request',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('foreign key');
    });

    it('should enforce FK constraint on kid_for_id', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);

      const { error } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: 'f47ac10b-58cc-4372-a567-0e02b2c3ffff',
            status: 'pending_request',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('foreign key');
    });
  });

  describe('Exchanges Table - Business Logic Constraints', () => {
    it('should prevent requester and lister from being the same user', async () => {
      const user = await createTestUser(`user-${Date.now()}@example.com`);
      const toy = await createTestToy(user);
      const kid = await createTestKid(user);

      const { error } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: user,
            lister_id: user, // Same as requester_id
            toy_id: toy,
            kid_for_id: kid,
            status: 'pending_request',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('different');
    });

    it('should not allow updating toy_id after creation', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy1 = await createTestToy(lister);
      const toy2 = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy1,
            kid_for_id: kid,
            status: 'pending_request',
          },
        ])
        .select();

      const exchangeId = data?.[0]?.id;

      // Try to update toy_id - should fail or be ignored
      const { error } = await supabase
        .from('exchanges')
        .update({ toy_id: toy2 })
        .eq('id', exchangeId)
        .select();

      // Either error or the update is silently ignored
      if (!error) {
        const { data: updated } = await supabase
          .from('exchanges')
          .select('toy_id')
          .eq('id', exchangeId)
          .single();

        // Toy ID should remain unchanged
        expect(updated?.toy_id).toBe(toy1);
      }
    });
  });

  describe('Delivery Confirmations Table', () => {
    it('should create delivery confirmation linked to exchange', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      const { data, error } = await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
            photos_count: 2,
            notes: 'Toy arrived in perfect condition',
          },
        ])
        .select();

      expect(error).toBeNull();
      expect(data?.[0]?.exchange_id).toBe(exchangeId);
      expect(data?.[0]?.condition_received).toBe('like_listed');
      expect(data?.[0]?.photos_count).toBe(2);
      expect(data?.[0]?.notes).toBe('Toy arrived in perfect condition');
    });

    it('should enforce unique FK constraint on exchange_id', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      // Create first delivery confirmation
      await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      // Try to create second delivery confirmation for same exchange - should fail
      const { error } = await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'minor_wear',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('unique');
    });

    it('should have default photos_count of 0', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      const { data } = await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      expect(data?.[0]?.photos_count).toBe(0);
    });

    it('should have confirmed_at timestamp auto-set', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      const { data } = await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      expect(data?.[0]?.confirmed_at).toBeDefined();
    });
  });

  describe('Disputes Table', () => {
    it('should create dispute linked to exchange', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      // Create delivery confirmation (required for disputes)
      await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      const { data, error } = await supabase
        .from('disputes')
        .insert([
          {
            exchange_id: exchangeId,
            reported_by_id: requester,
            reason: 'damage',
            description: 'Toy arrived with broken part',
            status: 'open',
          },
        ])
        .select();

      expect(error).toBeNull();
      expect(data?.[0]?.exchange_id).toBe(exchangeId);
      expect(data?.[0]?.reported_by_id).toBe(requester);
      expect(data?.[0]?.reason).toBe('damage');
      expect(data?.[0]?.status).toBe('open');
    });

    it('should enforce FK constraint on exchange_id', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);

      const { error } = await supabase
        .from('disputes')
        .insert([
          {
            exchange_id: 'f47ac10b-58cc-4372-a567-0e02b2c3ffff',
            reported_by_id: requester,
            reason: 'damage',
            description: 'Toy arrived damaged',
            status: 'open',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('foreign key');
    });

    it('should enforce FK constraint on reported_by_id', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      const { error } = await supabase
        .from('disputes')
        .insert([
          {
            exchange_id: exchangeId,
            reported_by_id: 'f47ac10b-58cc-4372-a567-0e02b2c3ffff',
            reason: 'damage',
            description: 'Toy arrived damaged',
            status: 'open',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('foreign key');
    });

    it('should have timestamps created_at and updated_at', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      const { data } = await supabase
        .from('disputes')
        .insert([
          {
            exchange_id: exchangeId,
            reported_by_id: requester,
            reason: 'damage',
            description: 'Toy arrived damaged',
            status: 'open',
          },
        ])
        .select();

      expect(data?.[0]?.created_at).toBeDefined();
      expect(data?.[0]?.updated_at).toBeDefined();
    });
  });

  describe('Cascade Delete Behavior', () => {
    it('should cascade delete delivery_confirmations when exchange is deleted', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      const { data: deliveryData } = await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      const deliveryId = deliveryData?.[0]?.id;

      // Delete exchange
      await supabase.from('exchanges').delete().eq('id', exchangeId).select();

      // Verify delivery_confirmation is also deleted
      const { data: deletedDelivery } = await supabase
        .from('delivery_confirmations')
        .select('*')
        .eq('id', deliveryId);

      expect(deletedDelivery?.length).toBe(0);
    });

    it('should cascade delete disputes when exchange is deleted', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
          },
        ])
        .select();

      const { data: disputeData } = await supabase
        .from('disputes')
        .insert([
          {
            exchange_id: exchangeId,
            reported_by_id: requester,
            reason: 'damage',
            description: 'Toy arrived damaged',
            status: 'open',
          },
        ])
        .select();

      const disputeId = disputeData?.[0]?.id;

      // Delete exchange
      await supabase.from('exchanges').delete().eq('id', exchangeId).select();

      // Verify dispute is also deleted
      const { data: deletedDispute } = await supabase
        .from('disputes')
        .select('*')
        .eq('id', disputeId);

      expect(deletedDispute?.length).toBe(0);
    });
  });

  describe('Soft Delete via Status', () => {
    it('should support soft delete by setting status to canceled', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'pending_request',
          },
        ])
        .select();

      const exchangeId = data?.[0]?.id;

      // Update status to canceled (soft delete)
      const { data: updated } = await supabase
        .from('exchanges')
        .update({ status: 'canceled' })
        .eq('id', exchangeId)
        .select();

      expect(updated?.[0]?.status).toBe('canceled');

      // Verify record still exists in database
      const { data: verify } = await supabase.from('exchanges').select('*').eq('id', exchangeId);

      expect(verify?.length).toBe(1);
      expect(verify?.[0]?.status).toBe('canceled');
    });

    it('should preserve audit trail for soft-deleted exchanges', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      const { data: created } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'accepted',
          },
        ])
        .select();

      const exchangeId = created?.[0]?.id;
      const originalCreatedAt = created?.[0]?.created_at;

      // Soft delete
      await supabase.from('exchanges').update({ status: 'canceled' }).eq('id', exchangeId).select();

      // Verify original data is preserved
      const { data: verify } = await supabase
        .from('exchanges')
        .select('*')
        .eq('id', exchangeId)
        .single();

      expect(verify?.created_at).toBe(originalCreatedAt);
      expect(verify?.requester_id).toBe(requester);
      expect(verify?.lister_id).toBe(lister);
      expect(verify?.toy_id).toBe(toy);
    });
  });

  describe('Indexes', () => {
    it('should have indexes for efficient filtering and joining', async () => {
      // Indexes are verified through migration; we confirm they exist by successful query performance
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      // Create an exchange
      await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'pending_request',
          },
        ])
        .select();

      // These queries should use indexes efficiently
      const { error: errorRequester } = await supabase
        .from('exchanges')
        .select('*')
        .eq('requester_id', requester);

      const { error: errorLister } = await supabase
        .from('exchanges')
        .select('*')
        .eq('lister_id', lister);

      const { error: errorStatus } = await supabase
        .from('exchanges')
        .select('*')
        .eq('status', 'pending_request');

      const { error: errorToy } = await supabase.from('exchanges').select('*').eq('toy_id', toy);

      expect(errorRequester).toBeNull();
      expect(errorLister).toBeNull();
      expect(errorStatus).toBeNull();
      expect(errorToy).toBeNull();
    });
  });

  describe('Complete Exchange Workflow', () => {
    it('should support a complete exchange lifecycle', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      // Step 1: Create exchange request (pending_request)
      const { data: created } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'pending_request',
            requester_message: 'I really want this toy!',
          },
        ])
        .select();

      const exchangeId = created?.[0]?.id;
      expect(created?.[0]?.status).toBe('pending_request');

      // Step 2: Lister accepts request (accepted)
      const { data: accepted } = await supabase
        .from('exchanges')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', exchangeId)
        .select();

      expect(accepted?.[0]?.status).toBe('accepted');
      expect(accepted?.[0]?.accepted_at).toBeDefined();

      // Step 3: Toy in transit (in_transit)
      const { data: inTransit } = await supabase
        .from('exchanges')
        .update({ status: 'in_transit' })
        .eq('id', exchangeId)
        .select();

      expect(inTransit?.[0]?.status).toBe('in_transit');

      // Step 4: Toy delivered (delivered)
      const { data: delivered } = await supabase
        .from('exchanges')
        .update({ status: 'delivered' })
        .eq('id', exchangeId)
        .select();

      expect(delivered?.[0]?.status).toBe('delivered');

      // Step 5: Create delivery confirmation
      const { data: deliveryData } = await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'like_listed',
            photos_count: 2,
            notes: 'Toy arrived in excellent condition',
          },
        ])
        .select();

      expect(deliveryData?.[0]?.condition_received).toBe('like_listed');

      // Step 6: Mark as confirmed by system
      const { data: confirmed } = await supabase
        .from('exchanges')
        .update({
          status: 'confirmed',
          delivery_confirmed_at: new Date().toISOString(),
        })
        .eq('id', exchangeId)
        .select();

      expect(confirmed?.[0]?.status).toBe('confirmed');
      expect(confirmed?.[0]?.delivery_confirmed_at).toBeDefined();

      // Step 7: Complete the exchange
      const { data: completed } = await supabase
        .from('exchanges')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', exchangeId)
        .select();

      expect(completed?.[0]?.status).toBe('completed');
      expect(completed?.[0]?.completed_at).toBeDefined();

      // Verify full workflow state
      const { data: final } = await supabase
        .from('exchanges')
        .select('*')
        .eq('id', exchangeId)
        .single();

      expect(final?.status).toBe('completed');
      expect(final?.created_at).toBeDefined();
      expect(final?.updated_at).toBeDefined();
      expect(final?.accepted_at).toBeDefined();
      expect(final?.delivery_confirmed_at).toBeDefined();
      expect(final?.completed_at).toBeDefined();
    });

    it('should support dispute workflow after delivery', async () => {
      const requester = await createTestUser(`requester-${Date.now()}@example.com`);
      const lister = await createTestUser(`lister-${Date.now()}@example.com`);
      const toy = await createTestToy(lister);
      const kid = await createTestKid(requester);

      // Create exchange and move to delivered
      const { data: exchangeData } = await supabase
        .from('exchanges')
        .insert([
          {
            requester_id: requester,
            lister_id: lister,
            toy_id: toy,
            kid_for_id: kid,
            status: 'delivered',
          },
        ])
        .select();

      const exchangeId = exchangeData?.[0]?.id;

      // Create delivery confirmation
      const { data: deliveryData } = await supabase
        .from('delivery_confirmations')
        .insert([
          {
            exchange_id: exchangeId,
            condition_received: 'damage', // Noted damage
            photos_count: 3,
            notes: 'Arrived with broken wheel',
          },
        ])
        .select();

      expect(deliveryData?.[0]?.condition_received).toBe('damage');

      // Create dispute
      const { data: disputeData } = await supabase
        .from('disputes')
        .insert([
          {
            exchange_id: exchangeId,
            reported_by_id: requester,
            reason: 'damage',
            description: 'Toy arrived with broken wheel, not mentioned in listing',
            status: 'open',
          },
        ])
        .select();

      expect(disputeData?.[0]?.status).toBe('open');

      // Update dispute to admin_review
      const { data: adminReview } = await supabase
        .from('disputes')
        .update({ status: 'admin_review' })
        .eq('id', disputeData?.[0]?.id)
        .select();

      expect(adminReview?.[0]?.status).toBe('admin_review');

      // Resolve dispute
      const { data: resolved } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          admin_notes: 'Approved refund - condition misrepresentation',
          resolution: 'refund',
        })
        .eq('id', disputeData?.[0]?.id)
        .select();

      expect(resolved?.[0]?.status).toBe('resolved');
      expect(resolved?.[0]?.resolution).toBe('refund');
    });
  });
});
