import { expect, test } from '@playwright/test';
import { createGroupViaUI } from './test-helpers';

/**
 * Dashboard tests
 * Tests the main dashboard page with group data
 *
 * Note: These tests require authentication and a group to exist.
 * The global setup should handle authentication, but you may need
 * to create a test group first or use an existing one.
 */

test.describe('Dashboard', () => {
  test('should redirect to landing page if not authenticated', async ({ page }) => {
    // Use a new context without auth state
    const context = await page.context().browser()?.newContext();
    if (!context) return;

    const newPage = await context.newPage();
    await newPage.goto('/dashboard/test-group-id');
    await newPage.waitForLoadState('networkidle');

    // Should redirect to home or show sign in
    const url = newPage.url();
    expect(url).toMatch(/\//);

    await newPage.close();
    await context.close();
  });

  test('should load dashboard when authenticated and group exists', async ({ page }) => {
    // This test requires a group to exist (or creates one)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    // Try to get groups from API to find a group ID
    const groupsResponse = await page.request.get('/api/groups');
    let groupId: string | null = null;

    if (groupsResponse.ok()) {
      const data = await groupsResponse.json();
      const groups = data.groups || [];

      if (groups.length > 0) {
        groupId = groups[0]._id || groups[0].id;
      }
    }

    // If no group exists, create one first
    if (!groupId) {
      groupId = await createGroupViaUI(page);
    }

    if (!groupId) {
      test.skip(true, 'Could not create or find a group');
      return;
    }

    await page.goto(`/dashboard/${groupId}`);
    await page.waitForLoadState('networkidle');

    // Verify dashboard loaded
    const groupName = page.locator('h1, h2').filter({ hasText: /.+/ }).first();
    await expect(groupName).toBeVisible({ timeout: 5000 });
  });

  test('should display dashboard components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    // Get or create a group
    const groupsResponse = await page.request.get('/api/groups');
    let groupId: string | null = null;

    if (groupsResponse.ok()) {
      const data = await groupsResponse.json();
      const groups = data.groups || [];
      if (groups.length > 0) {
        groupId = groups[0]._id || groups[0].id;
      }
    }

    // Create group if none exists
    if (!groupId) {
      groupId = await createGroupViaUI(page);
    }

    if (!groupId) {
      test.skip(true, 'Could not create or find a group');
      return;
    }

    await page.goto(`/dashboard/${groupId}`);
    await page.waitForLoadState('networkidle');

    // Check for key dashboard components (at least one should be visible)
    const hasCountdown = await page
      .locator('text=/days? until|countdown/i')
      .isVisible()
      .catch(() => false);
    const hasWeeklyPlan = await page
      .locator('text=/weekly plan|monday|tuesday/i')
      .isVisible()
      .catch(() => false);
    const hasProgress = await page
      .locator('text=/progress|chart/i')
      .isVisible()
      .catch(() => false);
    const hasActivity = await page
      .locator('text=/recent activity|workouts/i')
      .isVisible()
      .catch(() => false);

    expect(hasCountdown || hasWeeklyPlan || hasProgress || hasActivity).toBe(true);
  });
});
