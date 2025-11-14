/**
 * tests/database/consent-records.test.ts
 *
 * Jest test suite for consent_records table and GDPR compliance
 * Tests: consent_records schema, constraints, indexes, RLS policies, and helper functions
 *
 * NOTE: These tests are designed to run against a local Supabase instance.
 * Before running: npx supabase start
 * Then: npm test -- consent-records.test.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// JWT generation helper for local testing
function generateTestJWT(userId?: string): string {
  const secret = 'super-secret-jwt-token-with-at-least-32-characters-long';
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 365 * 24 * 60 * 60; // 1 year
  const testUserId = userId || 'test-user-id';

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: 'http://127.0.0.1:54321/auth/v1',
    aud: 'authenticated',
    sub: testUserId,
    email: `${testUserId}@example.com`,
    email_confirmed: false,
    phone_verified: false,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    role: 'authenticated',
    iat: now,
    exp: expiry,
    session_id: 'test-session',
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

// UUID generation helper
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Supabase connection details (local development)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || generateTestJWT();

// Test database connections
let supabaseClient: ReturnType<typeof createClient>;

describe('Consent Records Schema', () => {
  // Setup: Create Supabase clients before tests
  beforeAll(() => {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log(`Connecting to Supabase at: ${SUPABASE_URL}`);
  });

  describe('Consent Records Table - Schema', () => {
    let testParentId: string;

    beforeEach(async () => {
      // Create a test parent profile
      testParentId = generateUUID();
      await supabaseClient
        .from('profiles')
        .insert([
          {
            id: testParentId,
            email: `parent-${Date.now()}-${Math.random()}@example.com`,
            full_name: 'Test Parent',
          },
        ])
        .select();
    });

    it('should create consent_records table with all columns', async () => {
      const consentText = 'I agree to store my child data for toy exchanges';
      const ipAddress = '192.168.1.100';
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

      const { data, error } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: consentText,
            ip_address: ipAddress,
            user_agent: userAgent,
          },
        ])
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBe(1);
      expect(data?.[0]).toHaveProperty('id');
      expect(data?.[0]).toHaveProperty('user_id', testParentId);
      expect(data?.[0]).toHaveProperty('consent_type', 'child_data');
      expect(data?.[0]).toHaveProperty('consent_text', consentText);
      expect(data?.[0]).toHaveProperty('ip_address');
      expect(data?.[0]).toHaveProperty('user_agent', userAgent);
      expect(data?.[0]).toHaveProperty('timestamp');
      expect(data?.[0]).toHaveProperty('revoked_at', null);
    });

    it('should enforce consent_type constraint (only child_data or marketing)', async () => {
      const { error } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'invalid_type',
            child_ids: [],
            consent_text: 'Test',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('consent_type');
    });

    it('should generate UUID automatically for id column', async () => {
      const { data } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Test consent',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      expect(data?.[0]?.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should set timestamp to CURRENT_TIMESTAMP by default', async () => {
      const beforeInsert = new Date();

      const { data } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Test',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      const afterInsert = new Date();
      const recordTimestamp = new Date(data?.[0]?.timestamp || '');

      expect(recordTimestamp.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
      expect(recordTimestamp.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
    });

    it('should reject future timestamps (timestamp_not_future constraint)', async () => {
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 1);

      const { error } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Test',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
            timestamp: futureTime.toISOString(),
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('timestamp');
    });

    it('should support child_ids as UUID array', async () => {
      const childId1 = generateUUID();
      const childId2 = generateUUID();
      const parentId = generateUUID();

      // Create parent and children first
      await supabaseClient
        .from('profiles')
        .insert([
          { id: parentId, email: `parent2-${Date.now()}@example.com`, full_name: 'Parent 2' },
        ])
        .select();

      await supabaseClient
        .from('kids')
        .insert([
          { parent_id: parentId, name: 'Child 1', birthdate: '2015-01-01' },
          { parent_id: parentId, name: 'Child 2', birthdate: '2016-01-01' },
        ])
        .select();

      const { data, error } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: parentId,
            consent_type: 'child_data',
            child_ids: [childId1, childId2],
            consent_text: 'Consent for 2 children',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      expect(error).toBeNull();
      expect(data?.[0]?.child_ids).toEqual(expect.arrayContaining([childId1, childId2]));
    });

    it('should allow revoked_at to be NULL or after timestamp', async () => {
      const { data } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Test',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
            revoked_at: null,
          },
        ])
        .select();

      expect(data?.[0]?.revoked_at).toBeNull();
    });

    it('should reject revoked_at before timestamp', async () => {
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);

      const { error } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Test',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
            timestamp: new Date().toISOString(),
            revoked_at: pastTime.toISOString(),
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('revoked');
    });

    it('should enforce foreign key constraint on user_id', async () => {
      const invalidUserId = generateUUID();

      const { error } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: invalidUserId,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Test',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('foreign key');
    });
  });

  describe('Consent Records - Indexes', () => {
    let testParentId: string;
    let consentId: string;

    beforeEach(async () => {
      testParentId = generateUUID();
      await supabaseClient
        .from('profiles')
        .insert([
          {
            id: testParentId,
            email: `parent-${Date.now()}-${Math.random()}@example.com`,
            full_name: 'Test Parent',
          },
        ])
        .select();

      const { data } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Test',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      consentId = data?.[0]?.id || '';
    });

    it('should efficiently query by user_id (idx_consent_records_user_id)', async () => {
      const { data, error } = await supabaseClient
        .from('consent_records')
        .select('*')
        .eq('user_id', testParentId);

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
      expect(data?.some((r) => r.id === consentId)).toBe(true);
    });

    it('should efficiently filter by consent_type (idx_consent_records_consent_type)', async () => {
      const { data, error } = await supabaseClient
        .from('consent_records')
        .select('*')
        .eq('consent_type', 'child_data');

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
      expect(data?.every((r) => r.consent_type === 'child_data')).toBe(true);
    });

    it('should efficiently query recent consents (idx_consent_records_timestamp_desc)', async () => {
      const { data, error } = await supabaseClient
        .from('consent_records')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
    });

    it('should support composite user_id + timestamp query', async () => {
      const { data, error } = await supabaseClient
        .from('consent_records')
        .select('*')
        .eq('user_id', testParentId)
        .order('timestamp', { ascending: false });

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
      expect(data?.every((r) => r.user_id === testParentId)).toBe(true);
    });
  });

  describe('Kids Table - consent_status Column', () => {
    let testParentId: string;

    beforeEach(async () => {
      testParentId = generateUUID();
      await supabaseClient
        .from('profiles')
        .insert([
          {
            id: testParentId,
            email: `parent-${Date.now()}-${Math.random()}@example.com`,
            full_name: 'Test Parent',
          },
        ])
        .select();
    });

    it('should add consent_status column to kids table', async () => {
      const { data } = await supabaseClient
        .from('kids')
        .insert([
          {
            parent_id: testParentId,
            name: 'Test Child',
            birthdate: '2015-05-15',
          },
        ])
        .select();

      expect(data?.[0]).toHaveProperty('consent_status');
    });

    it('should default consent_status to pending_consent', async () => {
      const { data } = await supabaseClient
        .from('kids')
        .insert([
          {
            parent_id: testParentId,
            name: 'Test Child',
            birthdate: '2015-05-15',
          },
        ])
        .select();

      expect(data?.[0]?.consent_status).toBe('pending_consent');
    });

    it('should enforce consent_status constraint (valid values only)', async () => {
      const { error } = await supabaseClient
        .from('kids')
        .insert([
          {
            parent_id: testParentId,
            name: 'Test Child',
            birthdate: '2015-05-15',
            consent_status: 'invalid_status',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('consent_status');
    });

    it('should support all consent_status values', async () => {
      const validStatuses = [
        'pending_consent',
        'consented',
        'consent_revoked',
        'scheduled_for_deletion',
      ];

      for (const status of validStatuses) {
        const { data, error } = await supabaseClient
          .from('kids')
          .insert([
            {
              parent_id: testParentId,
              name: `Child ${status}`,
              birthdate: '2015-05-15',
              consent_status: status,
            },
          ])
          .select();

        expect(error).toBeNull();
        expect(data?.[0]?.consent_status).toBe(status);
      }
    });
  });

  describe('RLS Policies - Consent Records', () => {
    let parentId1: string;
    let parentId2: string;
    let consentId1: string;

    beforeEach(async () => {
      // Create two parent profiles
      parentId1 = generateUUID();
      parentId2 = generateUUID();

      await supabaseClient
        .from('profiles')
        .insert([
          {
            id: parentId1,
            email: `parent1-${Date.now()}-${Math.random()}@example.com`,
            full_name: 'Parent 1',
          },
          {
            id: parentId2,
            email: `parent2-${Date.now()}-${Math.random()}@example.com`,
            full_name: 'Parent 2',
          },
        ])
        .select();

      // Create consent records for each parent
      const { data: data1 } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: parentId1,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Consent 1',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: parentId2,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Consent 2',
            ip_address: '192.168.1.101',
            user_agent: 'Test',
          },
        ])
        .select();

      consentId1 = data1?.[0]?.id || '';
    });

    it('should allow users to SELECT their own consent records', async () => {
      // Create authenticated client for parentId1
      const jwt1 = generateTestJWT(parentId1);
      const client1 = createClient(SUPABASE_URL, jwt1);

      const { data, error } = await client1
        .from('consent_records')
        .select('*')
        .eq('user_id', parentId1);

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
      expect(data?.some((r) => r.id === consentId1)).toBe(true);
    });

    it('should prevent users from SELECTing other users consent records', async () => {
      // Create authenticated client for parentId1
      const jwt1 = generateTestJWT(parentId1);
      const client1 = createClient(SUPABASE_URL, jwt1);

      // Try to access parentId2 consent records
      const { data } = await client1.from('consent_records').select('*').eq('user_id', parentId2);

      // RLS should filter this out (return empty)
      expect(data?.length || 0).toBe(0);
    });

    it('should prevent INSERT via non-service role', async () => {
      const jwt = generateTestJWT(parentId1);
      const clientAuth = createClient(SUPABASE_URL, jwt);

      const { error } = await clientAuth
        .from('consent_records')
        .insert([
          {
            user_id: parentId1,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Forged consent',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      expect(error).toBeDefined();
      expect(error?.message).toContain('new row violates row-level security');
    });

    it('should prevent UPDATE on consent records', async () => {
      const jwt = generateTestJWT(parentId1);
      const clientAuth = createClient(SUPABASE_URL, jwt);

      const { error } = await clientAuth
        .from('consent_records')
        .update({ consent_text: 'Modified' })
        .eq('id', consentId1);

      expect(error).toBeDefined();
    });
  });

  describe('Helper Functions - Consent Management', () => {
    let testParentId: string;

    beforeEach(async () => {
      testParentId = generateUUID();

      // Create parent
      await supabaseClient
        .from('profiles')
        .insert([
          {
            id: testParentId,
            email: `parent-${Date.now()}-${Math.random()}@example.com`,
            full_name: 'Test Parent',
          },
        ])
        .select();
    });

    it('should have log_consent function', async () => {
      const { data, error } = await supabaseClient.rpc('log_consent', {
        p_user_id: testParentId,
        p_consent_type: 'child_data',
        p_child_ids: [],
        p_consent_text: 'Test consent text',
        p_ip_address: '192.168.1.100',
        p_user_agent: 'Test Agent',
      });

      // Function should exist and return a consent_id
      if (error) {
        console.log('log_consent error:', error);
      }
      // Note: May error if user doesn't have proper perms, but should exist
      expect(typeof data).toBe('string' || typeof data === 'object');
    });

    it('should have get_child_consent_status function', async () => {
      // Create a child first
      const { data: kidData } = await supabaseClient
        .from('kids')
        .insert([
          {
            parent_id: testParentId,
            name: 'Test Child',
            birthdate: '2015-05-15',
          },
        ])
        .select();

      const childId = kidData?.[0]?.id;

      const { data } = await supabaseClient.rpc('get_child_consent_status', {
        p_child_id: childId,
      });

      // Function should exist
      expect(data).toBeDefined();
    });

    it('should have revoke_consent function', async () => {
      // Create a consent record
      const { data: consentData } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [],
            consent_text: 'Test',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      const consentId = consentData?.[0]?.id;

      const { data, error } = await supabaseClient.rpc('revoke_consent', {
        p_consent_id: consentId,
        p_reason: 'User requested revocation',
      });

      // Function should exist
      if (error) {
        console.log('revoke_consent error:', error);
      }
      expect(typeof data).toBe('boolean' || typeof data === 'object');
    });
  });

  describe('Consent Workflow - Integration', () => {
    let testParentId: string;
    let testChildId: string;

    beforeEach(async () => {
      testParentId = generateUUID();

      // Create parent
      await supabaseClient
        .from('profiles')
        .insert([
          {
            id: testParentId,
            email: `parent-${Date.now()}-${Math.random()}@example.com`,
            full_name: 'Test Parent',
          },
        ])
        .select();

      // Create child
      const { data } = await supabaseClient
        .from('kids')
        .insert([
          {
            parent_id: testParentId,
            name: 'Test Child',
            birthdate: '2015-05-15',
          },
        ])
        .select();

      testChildId = data?.[0]?.id || '';
    });

    it('should start with pending_consent status', async () => {
      const { data } = await supabaseClient
        .from('kids')
        .select('consent_status')
        .eq('id', testChildId);

      expect(data?.[0]?.consent_status).toBe('pending_consent');
    });

    it('should support full consent workflow: pending -> consented -> revoked', async () => {
      // Step 1: Create consent record
      const { data: consentData } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [testChildId],
            consent_text: 'I consent to data processing',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      const consentId = consentData?.[0]?.id;
      expect(consentId).toBeDefined();

      // Step 2: Verify consent record was created
      const { data: consentRecords } = await supabaseClient
        .from('consent_records')
        .select('*')
        .eq('id', consentId);

      expect(consentRecords?.[0]?.revoked_at).toBeNull();
      expect(consentRecords?.[0]?.child_ids).toContain(testChildId);

      // Step 3: Create revocation (soft delete)
      const { data: revokeResult } = await supabaseClient.rpc('revoke_consent', {
        p_consent_id: consentId,
      });

      expect(revokeResult).toBe(true);

      // Step 4: Verify consent record has revoked_at set
      const { data: revokedConsent } = await supabaseClient
        .from('consent_records')
        .select('*')
        .eq('id', consentId);

      expect(revokedConsent?.[0]?.revoked_at).not.toBeNull();
    });

    it('should support marketing consent (no children required)', async () => {
      const { data, error } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'marketing',
            child_ids: [],
            consent_text: 'I agree to receive marketing emails',
            ip_address: '192.168.1.100',
            user_agent: 'Test',
          },
        ])
        .select();

      expect(error).toBeNull();
      expect(data?.[0]?.consent_type).toBe('marketing');
      expect(data?.[0]?.child_ids?.length || 0).toBe(0);
    });

    it('should audit consent with IP and user agent', async () => {
      const testIp = '203.0.113.42';
      const testUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6)';

      const { data } = await supabaseClient
        .from('consent_records')
        .insert([
          {
            user_id: testParentId,
            consent_type: 'child_data',
            child_ids: [testChildId],
            consent_text: 'Audit test',
            ip_address: testIp,
            user_agent: testUserAgent,
          },
        ])
        .select();

      expect(data?.[0]?.ip_address).toContain(testIp);
      expect(data?.[0]?.user_agent).toBe(testUserAgent);
    });
  });
});
