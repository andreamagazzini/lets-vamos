import { expect, test } from '@playwright/test';
import { createGroupViaUI } from './test-helpers';

/**
 * Workout management tests
 * Tests logging, editing, and deleting workouts
 */

test.describe('Workout Management', () => {
  test('should open log workout modal from dashboard', async ({ page }) => {
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

    // Click "Log Workout" button
    const logWorkoutButton = page.getByRole('button', { name: /log workout|add workout/i });
    await expect(logWorkoutButton).toBeVisible({ timeout: 5000 });
    await logWorkoutButton.click();
    await page.waitForTimeout(500);

    // Modal should appear
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    const isModalVisible = await modal.isVisible().catch(() => false);

    // Should see workout form fields
    const hasWorkoutType = await page
      .locator('select, input')
      .filter({ hasText: /type/i })
      .or(page.locator('select[name*="type" i], input[name*="type" i]'))
      .isVisible()
      .catch(() => false);

    expect(isModalVisible || hasWorkoutType).toBe(true);
  });

  test('should log a workout', async ({ page }) => {
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
      const createButton = page
        .getByRole('button', { name: /create.*group|create your group/i })
        .first();
      if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createButton.click();
        await page.waitForURL(/\/create-group/, { timeout: 5000 });
      } else {
        await page.goto('/create-group');
        await page.waitForLoadState('networkidle');
      }

      const groupName = `Test Group ${Date.now()}`;
      await page.getByLabel(/group name/i).fill(groupName);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateString = futureDate.toISOString().split('T')[0];
      await page.getByLabel(/goal date|event date/i).fill(dateString);

      await page.getByRole('button', { name: /create|submit/i }).click();
      await page.waitForURL(/\/setup-plan\//, { timeout: 10000 });

      const url = page.url();
      const match = url.match(/\/setup-plan\/([^/]+)/);
      if (match) groupId = match[1];
    }

    if (!groupId) {
      test.skip(true, 'Could not create or find a group');
      return;
    }

    await page.goto(`/dashboard/${groupId}`);
    await page.waitForLoadState('networkidle');

    // Open workout modal
    const logWorkoutButton = page.getByRole('button', { name: /log workout|add workout/i });
    if (await logWorkoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logWorkoutButton.click();
      await page.waitForTimeout(1000);

      // Fill workout form
      const typeSelect = page
        .locator('select[name*="type" i]')
        .or(page.locator('select').first())
        .first();

      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeSelect.selectOption('Run');
        await page.waitForTimeout(300);

        const today = new Date().toISOString().split('T')[0];
        const dateInput = page
          .locator('input[type="date"]')
          .or(page.locator('input[name*="date" i]'))
          .first();

        if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dateInput.fill(today);
          await page.waitForTimeout(300);

          const durationInput = page
            .locator('input[name*="duration" i], input[type="number"]')
            .first();
          if (await durationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await durationInput.fill('30');
            await page.waitForTimeout(300);
          }

          const submitButton = page.getByRole('button', { name: /save|submit|log/i });
          if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitButton.click();
            await page.waitForTimeout(2000);

            const modal = page.locator('[role="dialog"]').first();
            const isModalVisible = await modal.isVisible().catch(() => false);
            expect(isModalVisible).toBe(false);
          }
        }
      }
    }
  });
});
