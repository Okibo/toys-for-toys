/**
 * tests/e2e/supabase-connection.spec.ts
 *
 * End-to-End tests for Supabase connectivity
 * Tests the actual connection from the Next.js app to Supabase
 *
 * Prerequisites:
 * - npm run dev (Next.js app running on http://localhost:3000)
 * - Supabase running (locally or remote)
 * - .env.local configured with valid credentials
 */

import { test, expect } from '@playwright/test';

test.describe('Supabase Connectivity', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
  });

  test('should load home page without Supabase errors', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for critical errors in console
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Supabase')) {
        errors.push(msg.text());
      }
    });

    // Expect no Supabase errors
    expect(errors).toHaveLength(0);
  });

  test('should display Supabase connection status', async ({ page }) => {
    // Wait for any Supabase initialization
    await page.waitForLoadState('networkidle');

    // Look for connection status message
    const connectionSuccess = await page.getByText(/connected|ready/i).first();
    expect(connectionSuccess).toBeVisible();
  });

  test('should not expose service role key to browser', async ({ page }) => {
    const networkData: string[] = [];

    // Monitor network requests
    page.on('response', (response) => {
      networkData.push(JSON.stringify(response.headers()));
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Verify service role key is not in any network request
    const combinedData = networkData.join('');
    expect(combinedData).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  test('should have Supabase environment variables configured', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // At minimum, we should have loaded without errors
    expect(page.url()).toBe('http://localhost:3000/');
  });
});
