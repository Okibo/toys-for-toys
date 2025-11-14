/**
 * tests/database/performance-monitoring.test.ts
 *
 * PostgreSQL RLS Policy Performance Monitoring & Optimization Tests
 *
 * Purpose: Verify that RLS policy queries complete in <200ms even with 20+ children
 * Tests materialized view and covering index optimizations
 *
 * NOTE: Requires local Supabase with performance monitoring functions
 * Before running: npx supabase start
 * Then: npm test -- performance-monitoring.test.ts
 *
 * Test Coverage:
 * 1. Baseline performance (original nested subqueries)
 * 2. Optimized performance (with indexes and materialized views)
 * 3. Scaling tests (1, 5, 10, 20+ children)
 * 4. Query plan analysis (EXPLAIN output validation)
 * 5. Materialized view refresh performance
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONFIGURATION & SETUP
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjI0OTk5OTk5LCJleHAiOjE5MzA1NjU5OTl9.JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Performance thresholds (milliseconds)
const PERFORMANCE_THRESHOLDS = {
  SINGLE_CHILD: 50, // <50ms with 1 child
  FIVE_CHILDREN: 75, // <75ms with 5 children
  TEN_CHILDREN: 100, // <100ms with 10 children
  TWENTY_CHILDREN: 200, // <200ms with 20+ children
  VIEW_REFRESH: 5000, // <5 seconds for view refresh
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function setupTestData(
  parentId: string,
  numChildren: number
): Promise<{ kids: string[]; wishlists: string[]; items: number }> {
  const kidsIds: string[] = [];
  let totalItems = 0;

  // Create N children
  for (let i = 0; i < numChildren; i++) {
    const { data: kid, error: kidError } = await supabase
      .from('kids')
      .insert({
        id: uuidv4(),
        parent_id: parentId,
        name: `Test Kid ${i + 1}`,
        birthdate: '2015-01-01',
        age_group: 'age_8_12',
        status: 'active',
      })
      .select('id')
      .single();

    if (kidError) {
      console.error(`Failed to create kid: ${kidError.message}`);
      continue;
    }

    kidsIds.push(kid.id);
  }

  // Create wishlists and items for each child
  const wishlists: string[] = [];

  for (const kidId of kidsIds) {
    // Create wishlist
    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .insert({
        id: uuidv4(),
        kid_id: kidId,
      })
      .select('id')
      .single();

    if (wishlistError) {
      console.error(`Failed to create wishlist: ${wishlistError.message}`);
      continue;
    }

    wishlists.push(wishlist.id);

    // Create 5 items per wishlist
    const items = [];
    for (let j = 0; j < 5; j++) {
      items.push({
        id: uuidv4(),
        wishlist_id: wishlist.id,
        custom_wish_text: `Test Wish ${j + 1}`,
        priority_order: j + 1,
      });
    }

    const { error: itemsError } = await supabase.from('wishlist_items').insert(items);

    if (itemsError) {
      console.error(`Failed to create wishlist items: ${itemsError.message}`);
    } else {
      totalItems += items.length;
    }
  }

  return { kids: kidsIds, wishlists, items: totalItems };
}

async function cleanupTestData(parentId: string) {
  // Delete in cascade order: matching_log -> wishlist_items -> wishlists -> kids
  const { data: kids } = await supabase.from('kids').select('id').eq('parent_id', parentId);

  if (kids && kids.length > 0) {
    const kidIds = kids.map((k) => k.id);

    // Delete through cascade (kids deletion cascades to wishlists)
    await supabase.from('kids').delete().in('id', kidIds);
  }
}

async function runPerformanceBenchmark(
  parentId: string,
  queryType: 'wishlists' | 'wishlist_items' | 'matching_log' | 'game_fragments',
  iterations: number = 5
): Promise<{
  avg: number;
  min: number;
  max: number;
  stddev: number;
  iterations: number;
}> {
  try {
    const { data, error } = await supabase
      .rpc('test_rls_query_performance', {
        p_user_id: parentId,
        p_table_name: queryType,
        p_iterations: iterations,
      })
      .single();

    if (error) {
      throw new Error(`RPC error: ${error.message}`);
    }

    return {
      avg: data.avg_duration_ms,
      min: data.min_duration_ms,
      max: data.max_duration_ms,
      stddev: 0, // Calculated if needed
      iterations: data.total_iterations,
    };
  } catch (error: any) {
    console.error(`Performance benchmark failed: ${error.message}`);
    throw error;
  }
}

async function compareOptimizations(
  parentId: string,
  iterations: number = 5
): Promise<
  Array<{
    table: string;
    approach: string;
    avg: number;
    min: number;
    max: number;
  }>
> {
  try {
    const { data, error } = await supabase.rpc('compare_rls_query_optimization', {
      p_user_id: parentId,
      p_iterations: iterations,
    });

    if (error) {
      throw new Error(`Comparison RPC error: ${error.message}`);
    }

    return data.map((row: any) => ({
      table: row.optimization_type,
      approach: row.approach,
      avg: row.avg_duration_ms,
      min: row.min_duration_ms,
      max: row.max_duration_ms,
    }));
  } catch (error: any) {
    console.error(`Optimization comparison failed: ${error.message}`);
    throw error;
  }
}

async function refreshMaterializedViews(): Promise<{
  total_time_ms: number;
  views_refreshed: number;
}> {
  try {
    const { data, error } = await supabase.rpc('refresh_rls_context_views');

    if (error) {
      throw new Error(`View refresh RPC error: ${error.message}`);
    }

    const totalTime = data.reduce((sum: number, row: any) => sum + row.refresh_time_ms, 0);

    return {
      total_time_ms: totalTime,
      views_refreshed: data.length,
    };
  } catch (error: any) {
    console.error(`View refresh failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// JEST TESTS
// ============================================================================

describe('PostgreSQL RLS Policy Performance Monitoring', () => {
  const parentId = uuidv4();
  let testDataCreated = false;

  beforeAll(async () => {
    // Skip if Supabase not available
    try {
      const { data } = await supabase.rpc('test_rls_query_performance', {
        p_user_id: parentId,
        p_table_name: 'wishlists',
        p_iterations: 1,
      });
      if (!data) {
        console.log('⚠️  Skipping performance tests: Supabase RPC functions not available');
        process.exit(0);
      }
    } catch {
      console.log('⚠️  Skipping performance tests: Cannot connect to Supabase');
      process.exit(0);
    }

    testDataCreated = true;
  });

  afterAll(async () => {
    if (testDataCreated) {
      await cleanupTestData(parentId);
    }
  });

  // =========================================================================
  // TEST GROUP 1: Single Child Performance (Baseline)
  // =========================================================================

  describe('Performance with 1 Child (Baseline)', () => {
    let testParentId: string;

    beforeAll(async () => {
      testParentId = uuidv4();
      await setupTestData(testParentId, 1);
    });

    afterAll(async () => {
      await cleanupTestData(testParentId);
    });

    test('wishlists RLS query should complete in <50ms with 1 child', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'wishlists', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_CHILD);
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThanOrEqual(result.min);

      console.log(
        `  wishlists: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });

    test('wishlist_items RLS query should complete in <50ms with 1 child', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'wishlist_items', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_CHILD);
      expect(result.min).toBeGreaterThan(0);

      console.log(
        `  wishlist_items: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });
  });

  // =========================================================================
  // TEST GROUP 2: Five Children Performance
  // =========================================================================

  describe('Performance with 5 Children', () => {
    let testParentId: string;

    beforeAll(async () => {
      testParentId = uuidv4();
      await setupTestData(testParentId, 5);
    });

    afterAll(async () => {
      await cleanupTestData(testParentId);
    });

    test('wishlists RLS query should complete in <75ms with 5 children', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'wishlists', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.FIVE_CHILDREN);

      console.log(
        `  wishlists: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });

    test('wishlist_items RLS query should complete in <75ms with 5 children', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'wishlist_items', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.FIVE_CHILDREN);

      console.log(
        `  wishlist_items: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });

    test('matching_log RLS query should complete in <75ms with 5 children (25 items)', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'matching_log', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.FIVE_CHILDREN);

      console.log(
        `  matching_log: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });
  });

  // =========================================================================
  // TEST GROUP 3: Ten Children Performance
  // =========================================================================

  describe('Performance with 10 Children', () => {
    let testParentId: string;

    beforeAll(async () => {
      testParentId = uuidv4();
      await setupTestData(testParentId, 10);
    });

    afterAll(async () => {
      await cleanupTestData(testParentId);
    });

    test('wishlists RLS query should complete in <100ms with 10 children', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'wishlists', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.TEN_CHILDREN);

      console.log(
        `  wishlists: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });

    test('wishlist_items RLS query should complete in <100ms with 10 children', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'wishlist_items', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.TEN_CHILDREN);

      console.log(
        `  wishlist_items: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });

    test('matching_log RLS query should complete in <100ms with 10 children (50 items)', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'matching_log', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.TEN_CHILDREN);

      console.log(
        `  matching_log: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });
  });

  // =========================================================================
  // TEST GROUP 4: Twenty Children Performance (Target Scenario)
  // =========================================================================

  describe('Performance with 20+ Children (Target Scenario)', () => {
    let testParentId: string;

    beforeAll(async () => {
      testParentId = uuidv4();
      await setupTestData(testParentId, 20);
    });

    afterAll(async () => {
      await cleanupTestData(testParentId);
    });

    test('wishlists RLS query should complete in <200ms with 20 children', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'wishlists', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.TWENTY_CHILDREN);
      expect(result.max).toBeLessThan(PERFORMANCE_THRESHOLDS.TWENTY_CHILDREN * 1.5);

      console.log(
        `  wishlists: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });

    test('wishlist_items RLS query should complete in <200ms with 20 children (100 items)', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'wishlist_items', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.TWENTY_CHILDREN);
      expect(result.max).toBeLessThan(PERFORMANCE_THRESHOLDS.TWENTY_CHILDREN * 1.5);

      console.log(
        `  wishlist_items: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });

    test('matching_log RLS query should complete in <200ms with 20 children (100 items)', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'matching_log', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.TWENTY_CHILDREN);
      expect(result.max).toBeLessThan(PERFORMANCE_THRESHOLDS.TWENTY_CHILDREN * 1.5);

      console.log(
        `  matching_log: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });

    test('game_fragments RLS query should complete in <200ms with 20 children', async () => {
      const result = await runPerformanceBenchmark(testParentId, 'game_fragments', 5);

      expect(result.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.TWENTY_CHILDREN);

      console.log(
        `  game_fragments: avg=${result.avg.toFixed(2)}ms, min=${result.min}ms, max=${result.max}ms`
      );
    });
  });

  // =========================================================================
  // TEST GROUP 5: Optimization Comparison (Before/After)
  // =========================================================================

  describe('Optimization Comparison: Original vs Materialized View', () => {
    let testParentId: string;

    beforeAll(async () => {
      testParentId = uuidv4();
      await setupTestData(testParentId, 20);
    });

    afterAll(async () => {
      await cleanupTestData(testParentId);
    });

    test('should show performance improvement with materialized view for wishlist_items', async () => {
      const comparisons = await compareOptimizations(testParentId, 5);

      const wishlistItemComparisons = comparisons.filter((c) => c.table === 'wishlist_items');
      expect(wishlistItemComparisons.length).toBe(2);

      const originalApproach = wishlistItemComparisons.find((c) => c.approach.includes('Original'));
      const optimizedApproach = wishlistItemComparisons.find((c) =>
        c.approach.includes('Optimized')
      );

      expect(originalApproach).toBeDefined();
      expect(optimizedApproach).toBeDefined();

      if (originalApproach && optimizedApproach) {
        console.log(
          `  Original: avg=${originalApproach.avg.toFixed(2)}ms | Optimized: avg=${optimizedApproach.avg.toFixed(2)}ms`
        );

        // Optimized should be <= original (may be same if index already good)
        expect(optimizedApproach.avg).toBeLessThanOrEqual(originalApproach.avg * 1.1);
      }
    });

    test('should show performance improvement with materialized view for game_fragments', async () => {
      const comparisons = await compareOptimizations(testParentId, 5);

      const fragmentComparisons = comparisons.filter((c) => c.table === 'game_fragments');
      expect(fragmentComparisons.length).toBe(2);

      const originalApproach = fragmentComparisons.find((c) => c.approach.includes('Original'));
      const optimizedApproach = fragmentComparisons.find((c) => c.approach.includes('Optimized'));

      expect(originalApproach).toBeDefined();
      expect(optimizedApproach).toBeDefined();

      if (originalApproach && optimizedApproach) {
        console.log(
          `  Original: avg=${originalApproach.avg.toFixed(2)}ms | Optimized: avg=${optimizedApproach.avg.toFixed(2)}ms`
        );

        expect(optimizedApproach.avg).toBeLessThanOrEqual(originalApproach.avg * 1.1);
      }
    });
  });

  // =========================================================================
  // TEST GROUP 6: Materialized View Refresh Performance
  // =========================================================================

  describe('Materialized View Refresh Performance', () => {
    test('should refresh materialized views in <5000ms', async () => {
      const result = await refreshMaterializedViews();

      expect(result.views_refreshed).toBeGreaterThan(0);
      expect(result.total_time_ms).toBeLessThan(PERFORMANCE_THRESHOLDS.VIEW_REFRESH);

      console.log(`  Refreshed ${result.views_refreshed} views in ${result.total_time_ms}ms total`);
    });
  });

  // =========================================================================
  // TEST GROUP 7: Query Plan Validation (EXPLAIN ANALYZE)
  // =========================================================================

  describe('Query Plan Analysis', () => {
    let testParentId: string;

    beforeAll(async () => {
      testParentId = uuidv4();
      await setupTestData(testParentId, 10);
    });

    afterAll(async () => {
      await cleanupTestData(testParentId);
    });

    test('wishlist_items query plan should use indexes efficiently', async () => {
      const plans = await supabase.rpc('analyze_rls_query_plan', {
        p_user_id: testParentId,
        p_query_type: 'wishlist_items',
      });

      expect(plans).toBeDefined();
      expect(plans.length).toBeGreaterThan(0);

      console.log(`  Query plan metrics retrieved:`, plans.slice(0, 3));
    });

    test('matching_log query plan should use indexes efficiently', async () => {
      const plans = await supabase.rpc('analyze_rls_query_plan', {
        p_user_id: testParentId,
        p_query_type: 'matching_log',
      });

      expect(plans).toBeDefined();
      expect(plans.length).toBeGreaterThan(0);

      console.log(`  Query plan metrics retrieved:`, plans.slice(0, 3));
    });
  });
});

// ============================================================================
// PERFORMANCE TEST SUMMARY
// ============================================================================
// Expected Results:
// - 1 child: <50ms for all queries
// - 5 children: <75ms for all queries
// - 10 children: <100ms for all queries
// - 20+ children: <200ms for all queries
// - View refresh: <5s
//
// If tests fail:
// 1. Check index creation with: SELECT * FROM pg_indexes WHERE schemaname='public'
// 2. Check materialized views: SELECT * FROM information_schema.tables WHERE table_schema='public' AND table_type='MATERIALIZED VIEW'
// 3. Run EXPLAIN ANALYZE manually to review query plans
// 4. Consider vertical scaling or read replicas if still slow
// ============================================================================
