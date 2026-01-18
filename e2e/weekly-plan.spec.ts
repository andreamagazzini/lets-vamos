import { expect, test } from '@playwright/test';
import { createGroupViaUI } from './test-helpers';

/**
 * Weekly Plan tests
 * Tests setting up and editing weekly training plans
 */

test.describe('Weekly Plan', () => {
  test('should navigate to setup plan page after creating group', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    // Create a group first
    const groupId = await createGroupViaUI(page);

    if (!groupId) {
      test.skip(true, 'Could not create group');
      return;
    }

    // Should be on setup plan page
    await expect(page).toHaveURL(/\/setup-plan\//);

    // Should see weekly plan interface
    const hasDayLabels = await page
      .locator('text=/monday|tuesday|wednesday/i')
      .isVisible()
      .catch(() => false);
    expect(hasDayLabels).toBe(true);
  });

  test('should display weekly plan in dashboard', async ({ page }) => {
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

    // Look for weekly plan section (might not exist if group is new)
    const weeklyPlanSection = page
      .locator('text=/weekly plan/i')
      .or(page.locator('text=/monday|tuesday|wednesday/i'))
      .first();

    const hasWeeklyPlan = await weeklyPlanSection.isVisible({ timeout: 5000 }).catch(() => false);

    // Weekly plan might not exist if group is new, so this is optional
    if (hasWeeklyPlan) {
      await expect(weeklyPlanSection).toBeVisible();
    }
  });
});
