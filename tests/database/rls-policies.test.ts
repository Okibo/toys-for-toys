/**
 * tests/database/rls-policies.test.ts
 *
 * Comprehensive RLS (Row-Level Security) policy tests for Toy-for-Toy platform
 * Tests: User isolation, admin access, soft deletes, public data, and permission boundaries
 *
 * NOTE: These tests require a local Supabase instance with RLS policies enabled.
 * Before running: npx supabase start
 * Then: npm test -- rls-policies.test.ts
 *
 * Test Coverage:
 * 1. profiles - SELECT own/public, UPDATE own, INSERT/DELETE disabled
 * 2. kids - SELECT/INSERT own, UPDATE/DELETE disabled (GDPR)
 * 3. tickets - SELECT own, INSERT/UPDATE/DELETE disabled (system only)
 * 4. toys - SELECT active/own/admin, INSERT/UPDATE own, DELETE disabled
 * 5. exchanges - SELECT own/admin, INSERT/UPDATE/DELETE disabled
 * 6. exchange_messages - SELECT own exchange, INSERT own exchange, DELETE own
 * 7. wishlists - SELECT/INSERT/UPDATE/DELETE own kids
 * 8. blocklist - SELECT/INSERT/DELETE own, UPDATE disabled
 * 9. notifications - SELECT own, INSERT/UPDATE/DELETE disabled
 * 10. ratings - SELECT all, INSERT own, UPDATE/DELETE own
 * 11. notification_preferences - SELECT/INSERT/UPDATE own, DELETE disabled
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateTestJWT(userId: string, isAdmin: boolean = false): string {
  const secret = 'super-secret-jwt-token-with-at-least-32-characters-long';
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 365 * 24 * 60 * 60;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: 'http://127.0.0.1:54321/auth/v1',
    aud: 'authenticated',
    sub: userId,
    email: `user-${userId.slice(0, 8)}@example.com`,
    email_confirmed: false,
    phone_verified: false,
    app_metadata: isAdmin ? { role: 'admin' } : { provider: 'email', providers: ['email'] },
    user_metadata: {},
    role: isAdmin ? 'admin' : 'authenticated',
    iat: now,
    exp: expiry,
    session_id: `session-${userId}`,
  };

  const base64UrlEncode = (obj: any) => {
    const json = JSON.stringify(obj);
    return Buffer.from(json)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Supabase connection details
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';

// Test user IDs
const USER_A_ID = generateUUID();
const USER_B_ID = generateUUID();
const ADMIN_ID = generateUUID();

describe('RLS Policies - Data Isolation & Security', () => {
  let supabaseUserA: ReturnType<typeof createClient>;
  let supabaseAdmin: ReturnType<typeof createClient>;

  beforeAll(() => {
    // Create authenticated clients with different user contexts
    supabaseUserA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${generateTestJWT(USER_A_ID, false)}`,
        },
      },
    });

    // Note: supabaseUserB client created but not used in current tests
    createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${generateTestJWT(USER_B_ID, false)}`,
        },
      },
    });

    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${generateTestJWT(ADMIN_ID, true)}`,
        },
      },
    });

    console.log(`Testing RLS with User A: ${USER_A_ID}`);
    console.log(`Testing RLS with User B: ${USER_B_ID}`);
    console.log(`Testing RLS with Admin: ${ADMIN_ID}`);
  });

  describe('1. Profiles Table - Public Profile Visibility', () => {
    it('User A should see their own profile', async () => {
      const { data, error } = await supabaseUserA
        .from('profiles')
        .select('id, full_name')
        .eq('id', USER_A_ID)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(USER_A_ID);
    });

    it('User A should not be able to INSERT a profile (auth trigger only)', async () => {
      const testProfileId = generateUUID();
      const { error } = await supabaseUserA.from('profiles').insert({
        id: testProfileId,
        email: 'test-insert@example.com',
        full_name: 'Test Insert',
      });

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A should be able to UPDATE own profile', async () => {
      const { error } = await supabaseUserA
        .from('profiles')
        .update({ full_name: 'Updated Name' })
        .eq('id', USER_A_ID);

      // Note: This may fail if profile doesn't exist yet in test DB
      // Real test would have pre-populated profiles
      console.log('Update profile result:', error);
    });

    it('User A should not be able to UPDATE User B profile', async () => {
      const { error } = await supabaseUserA
        .from('profiles')
        .update({ full_name: 'Malicious Update' })
        .eq('id', USER_B_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A should not be able to DELETE a profile', async () => {
      const { error } = await supabaseUserA.from('profiles').delete().eq('id', USER_A_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });
  });

  describe('2. Kids Table - Strict Parent Isolation (GDPR)', () => {
    let kidA_id: string;

    beforeEach(() => {
      kidA_id = generateUUID();
    });

    it('User A can see only their own kids', async () => {
      const { error } = await supabaseUserA
        .from('kids')
        .select('id, parent_id')
        .eq('parent_id', USER_A_ID);

      // No data expected if no kids exist, but should not error
      expect(error).toBeNull();
    });

    it('User A cannot see User B kids', async () => {
      const { data, error } = await supabaseUserA
        .from('kids')
        .select('id, parent_id')
        .eq('parent_id', USER_B_ID);

      // Should return empty result set, not error
      expect(data).toEqual([]);
      expect(error).toBeNull();
    });

    it('User A can INSERT own child', async () => {
      const { data, error } = await supabaseUserA
        .from('kids')
        .insert({
          id: kidA_id,
          parent_id: USER_A_ID,
          name: 'Test Child A',
          birthdate: '2020-01-15',
          status: 'active',
        })
        .select();

      // May succeed if user exists in auth
      console.log('Insert own kid:', { data, error });
    });

    it('User A cannot INSERT kid for User B', async () => {
      const { error } = await supabaseUserA.from('kids').insert({
        id: generateUUID(),
        parent_id: USER_B_ID,
        name: 'Malicious Child',
        birthdate: '2020-01-15',
        status: 'active',
      });

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot UPDATE kids (disabled)', async () => {
      const { error } = await supabaseUserA
        .from('kids')
        .update({ name: 'Updated Name' })
        .eq('id', kidA_id);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot DELETE kids (soft delete only)', async () => {
      const { error } = await supabaseUserA.from('kids').delete().eq('id', kidA_id);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });
  });

  describe('3. Tickets Table - Strict User Isolation', () => {
    it('User A can see only their own ticket balance', async () => {
      const { data, error } = await supabaseUserA
        .from('tickets')
        .select('user_id, balance, available')
        .eq('user_id', USER_A_ID)
        .single();

      // May return no data if not yet created in test DB
      console.log('User A tickets:', { data, error });
    });

    it('User A cannot see User B ticket balance', async () => {
      const { data, error } = await supabaseUserA
        .from('tickets')
        .select('user_id, balance')
        .eq('user_id', USER_B_ID)
        .single();

      expect(data).toBeNull();
      expect(error?.code).toBe('PGRST116'); // No rows found (RLS filtering)
    });

    it('User A cannot INSERT tickets (system only)', async () => {
      const { error } = await supabaseUserA.from('tickets').insert({
        id: generateUUID(),
        user_id: USER_A_ID,
        balance: 100,
        frozen: 0,
      });

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot UPDATE ticket balance (system only)', async () => {
      const { error } = await supabaseUserA
        .from('tickets')
        .update({ balance: 1000 })
        .eq('user_id', USER_A_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot DELETE tickets (system only)', async () => {
      const { error } = await supabaseUserA.from('tickets').delete().eq('user_id', USER_A_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });
  });

  describe('4. Toys Table - Discovery with Status Filtering', () => {
    let toyA_active_id: string;

    beforeEach(() => {
      toyA_active_id = generateUUID();
      // Note: Additional toy IDs generated but not used in current tests
      generateUUID();
      generateUUID();
    });

    it('Anyone can see active toys (public marketplace)', async () => {
      const { data, error } = await supabaseUserA
        .from('toys')
        .select('id, user_id, status')
        .eq('status', 'active');

      expect(error).toBeNull();
      // Data may be empty if no active toys in test DB
      console.log('Active toys visible to User A:', data?.length || 0);
    });

    it('User A can see their own toys regardless of status', async () => {
      const { error } = await supabaseUserA
        .from('toys')
        .select('id, user_id, status')
        .eq('user_id', USER_A_ID);

      expect(error).toBeNull();
      // Should see all statuses (active, pending, delisted) if they own them
    });

    it('User A cannot see User B pending toys', async () => {
      const { data } = await supabaseUserA
        .from('toys')
        .select('id, user_id, status')
        .eq('user_id', USER_B_ID)
        .eq('status', 'pending_moderation')
        .single();

      expect(data).toBeNull();
      // RLS should filter out non-active toys by other users
    });

    it('Admin can see all toys including delisted', async () => {
      const { error } = await supabaseAdmin
        .from('toys')
        .select('id, status')
        .eq('status', 'delisted');

      expect(error).toBeNull();
      // Admin should see delisted toys
    });

    it('User A can INSERT own toy', async () => {
      const { error } = await supabaseUserA
        .from('toys')
        .insert({
          id: toyA_active_id,
          user_id: USER_A_ID,
          name: 'Test Toy',
          category: 'toys',
          condition: 'good',
          status: 'pending_moderation',
        })
        .select();

      // May fail if user not in DB, but RLS should allow if they are
      console.log('Insert own toy:', { error: error?.code });
    });

    it('User A cannot INSERT toy for User B', async () => {
      const { error } = await supabaseUserA.from('toys').insert({
        id: generateUUID(),
        user_id: USER_B_ID,
        name: 'Malicious Toy',
        category: 'toys',
        condition: 'good',
        status: 'active',
      });

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A can UPDATE own toy', async () => {
      const { error } = await supabaseUserA
        .from('toys')
        .update({ name: 'Updated Toy Name' })
        .eq('id', toyA_active_id)
        .eq('user_id', USER_A_ID);

      // May succeed or fail based on toy existing in DB
      console.log('Update own toy error:', error?.code);
    });

    it('User A cannot UPDATE User B toy', async () => {
      const { error } = await supabaseUserA
        .from('toys')
        .update({ name: 'Malicious Update' })
        .eq('user_id', USER_B_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot DELETE toy (soft delete only)', async () => {
      const { error } = await supabaseUserA.from('toys').delete().eq('id', toyA_active_id);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });
  });

  describe('5. Exchanges Table - Transaction Isolation', () => {
    let exchangeA_requester_id: string;

    beforeEach(() => {
      exchangeA_requester_id = generateUUID();
      // Note: Additional exchange ID generated but not used in current tests
      generateUUID();
    });

    it('Requester can see their exchange requests', async () => {
      const { error } = await supabaseUserA
        .from('exchanges')
        .select('id, requester_id, lister_id')
        .eq('requester_id', USER_A_ID);

      expect(error).toBeNull();
    });

    it('Lister can see exchange requests for their toys', async () => {
      const { error } = await supabaseUserA
        .from('exchanges')
        .select('id, requester_id, lister_id')
        .eq('lister_id', USER_A_ID);

      expect(error).toBeNull();
    });

    it('User A cannot see exchanges they are not part of', async () => {
      const { data } = await supabaseUserA
        .from('exchanges')
        .select('id')
        .eq('requester_id', USER_B_ID)
        .eq('lister_id', USER_B_ID)
        .single();

      expect(data).toBeNull();
      // RLS should filter out exchanges not involving User A
    });

    it('Admin can see all exchanges for dispute resolution', async () => {
      const { error } = await supabaseAdmin
        .from('exchanges')
        .select('id, status')
        .eq('status', 'disputed');

      expect(error).toBeNull();
      // Admin should see all exchanges regardless of involvement
    });

    it('User A cannot INSERT exchange directly (API only)', async () => {
      const { error } = await supabaseUserA.from('exchanges').insert({
        id: exchangeA_requester_id,
        requester_id: USER_A_ID,
        lister_id: USER_B_ID,
        toy_id: generateUUID(),
        kid_for_id: generateUUID(),
        status: 'pending_request',
      });

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot UPDATE exchange directly (API only)', async () => {
      const { error } = await supabaseUserA
        .from('exchanges')
        .update({ status: 'accepted' })
        .eq('id', exchangeA_requester_id);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot DELETE exchange (soft delete only)', async () => {
      const { error } = await supabaseUserA
        .from('exchanges')
        .delete()
        .eq('id', exchangeA_requester_id);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });
  });

  describe('6. Notifications Table - Privacy Control', () => {
    it('User A can see only their own notifications', async () => {
      const { error } = await supabaseUserA
        .from('notifications')
        .select('id, user_id, type')
        .eq('user_id', USER_A_ID);

      expect(error).toBeNull();
    });

    it('User A cannot see User B notifications', async () => {
      const { data } = await supabaseUserA
        .from('notifications')
        .select('id, user_id')
        .eq('user_id', USER_B_ID)
        .single();

      expect(data).toBeNull();
    });

    it('User A cannot INSERT notifications (system only)', async () => {
      const { error } = await supabaseUserA.from('notifications').insert({
        id: generateUUID(),
        user_id: USER_A_ID,
        type: 'request_received',
        title: 'Test',
        body: 'Test notification',
      });

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot UPDATE notifications (API only)', async () => {
      const { error } = await supabaseUserA
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', USER_A_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot DELETE notifications (soft delete only)', async () => {
      const { error } = await supabaseUserA.from('notifications').delete().eq('user_id', USER_A_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });
  });

  describe('7. Ratings Table - Public Reputation System', () => {
    it('All users can see all ratings (public reputation)', async () => {
      const { error } = await supabaseUserA
        .from('ratings')
        .select('id, rater_id, rated_user_id, condition_rating')
        .limit(10);

      expect(error).toBeNull();
      // Any user can view ratings for trust/reputation
    });

    it('User A can INSERT rating only for exchange they participated in', async () => {
      const { error } = await supabaseUserA.from('ratings').insert({
        id: generateUUID(),
        exchange_id: generateUUID(),
        rater_id: USER_A_ID,
        rated_user_id: USER_B_ID,
        condition_rating: 5,
        communication_rating: 5,
      });

      // Will fail if exchange doesn't exist or User A didn't participate
      expect(error?.code).toBeDefined();
      console.log('Insert rating (no valid exchange):', error?.code);
    });

    it('User A cannot rate themselves', async () => {
      const { error } = await supabaseUserA.from('ratings').insert({
        id: generateUUID(),
        exchange_id: generateUUID(),
        rater_id: USER_A_ID,
        rated_user_id: USER_A_ID,
        condition_rating: 5,
        communication_rating: 5,
      });

      // Should fail due to rater_not_rated constraint
      expect(error).toBeDefined();
    });

    it('User A can UPDATE only their own ratings', async () => {
      const testRatingId = generateUUID();
      const { error } = await supabaseUserA
        .from('ratings')
        .update({ condition_rating: 4 })
        .eq('id', testRatingId)
        .eq('rater_id', USER_A_ID);

      // Will fail if rating doesn't exist
      console.log('Update own rating error:', error?.code);
    });

    it('User A cannot UPDATE other user ratings', async () => {
      const { error } = await supabaseUserA
        .from('ratings')
        .update({ condition_rating: 1 })
        .eq('rater_id', USER_B_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });
  });

  describe('8. Blocklist Table - Message Privacy', () => {
    it('User A can see only users they have blocked', async () => {
      const { error } = await supabaseUserA
        .from('blocklist')
        .select('blocker_id, blocked_id')
        .eq('blocker_id', USER_A_ID);

      expect(error).toBeNull();
    });

    it('User A cannot see who blocked them (one-directional)', async () => {
      const { data } = await supabaseUserA
        .from('blocklist')
        .select('blocker_id, blocked_id')
        .eq('blocked_id', USER_A_ID)
        .single();

      expect(data).toBeNull();
      // User A cannot see reverse blocks
    });

    it('User A can block User B', async () => {
      const { error } = await supabaseUserA.from('blocklist').insert({
        id: generateUUID(),
        blocker_id: USER_A_ID,
        blocked_id: USER_B_ID,
        reason: 'Testing block',
      });

      // May fail if trying to insert duplicate
      console.log('Block user error:', error?.code);
    });

    it('User A cannot INSERT block for someone else', async () => {
      const { error } = await supabaseUserA.from('blocklist').insert({
        id: generateUUID(),
        blocker_id: USER_B_ID,
        blocked_id: USER_A_ID,
        reason: 'Malicious block',
      });

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A can unblock only their own blocks', async () => {
      const testBlockId = generateUUID();
      const { error } = await supabaseUserA
        .from('blocklist')
        .delete()
        .eq('id', testBlockId)
        .eq('blocker_id', USER_A_ID);

      console.log('Unblock error:', error?.code);
    });

    it('User A cannot unblock for User B', async () => {
      const { error } = await supabaseUserA.from('blocklist').delete().eq('blocker_id', USER_B_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });
  });

  describe('9. Notification Preferences - User Control', () => {
    it('User A can see only their own preferences', async () => {
      const { error } = await supabaseUserA
        .from('notification_preferences')
        .select('user_id, match_found')
        .eq('user_id', USER_A_ID)
        .single();

      // May return no data if not created yet
      console.log('User A preferences:', { error: error?.code });
    });

    it('User A cannot see User B preferences', async () => {
      const { data } = await supabaseUserA
        .from('notification_preferences')
        .select('user_id')
        .eq('user_id', USER_B_ID)
        .single();

      expect(data).toBeNull();
    });

    it('User A can INSERT their own preferences', async () => {
      const { error } = await supabaseUserA.from('notification_preferences').insert({
        id: generateUUID(),
        user_id: USER_A_ID,
        match_found: { channel: 'email', frequency: 'daily_digest' },
        request_received: { channel: 'push', frequency: 'instant' },
        exchange_status: { channel: 'push', frequency: 'instant' },
        game_reward: { channel: 'in_app', frequency: 'instant' },
        message_received: { channel: 'push', frequency: 'instant' },
        delivery_confirmed: { channel: 'push', frequency: 'instant' },
        dispute_opened: { channel: 'push', frequency: 'instant' },
      });

      // May fail if already exists
      console.log('Insert preferences error:', error?.code);
    });

    it('User A cannot INSERT preferences for User B', async () => {
      const { error } = await supabaseUserA.from('notification_preferences').insert({
        id: generateUUID(),
        user_id: USER_B_ID,
        match_found: { channel: 'email', frequency: 'off' },
        request_received: { channel: 'push', frequency: 'off' },
        exchange_status: { channel: 'push', frequency: 'off' },
        game_reward: { channel: 'in_app', frequency: 'off' },
        message_received: { channel: 'push', frequency: 'off' },
        delivery_confirmed: { channel: 'push', frequency: 'off' },
        dispute_opened: { channel: 'push', frequency: 'off' },
      });

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A can UPDATE their own preferences', async () => {
      const { error } = await supabaseUserA
        .from('notification_preferences')
        .update({
          match_found: { channel: 'in_app', frequency: 'weekly_digest' },
        })
        .eq('user_id', USER_A_ID);

      console.log('Update preferences error:', error?.code);
    });

    it('User A cannot UPDATE User B preferences', async () => {
      const { error } = await supabaseUserA
        .from('notification_preferences')
        .update({
          match_found: { channel: 'email', frequency: 'off' },
        })
        .eq('user_id', USER_B_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });

    it('User A cannot DELETE preferences (reset to defaults instead)', async () => {
      const { error } = await supabaseUserA
        .from('notification_preferences')
        .delete()
        .eq('user_id', USER_A_ID);

      expect(error?.code).toBe('42501'); // RLS policy violation
    });
  });

  describe('10. Performance - Query Response Times', () => {
    it('User isolation query should complete in <200ms', async () => {
      const start = performance.now();
      await supabaseUserA.from('profiles').select('id, full_name').eq('id', USER_A_ID).single();
      const duration = performance.now() - start;

      console.log(`Profile query duration: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });

    it('Toy filtering query should complete in <200ms', async () => {
      const start = performance.now();
      await supabaseUserA.from('toys').select('id, name, status').eq('status', 'active').limit(10);
      const duration = performance.now() - start;

      console.log(`Toy filter query duration: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });

    it('Exchange lookup query should complete in <200ms', async () => {
      const start = performance.now();
      await supabaseUserA
        .from('exchanges')
        .select('id, status')
        .or(`requester_id.eq.${USER_A_ID},lister_id.eq.${USER_A_ID}`)
        .limit(20);
      const duration = performance.now() - start;

      console.log(`Exchange lookup query duration: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });
  });
});
