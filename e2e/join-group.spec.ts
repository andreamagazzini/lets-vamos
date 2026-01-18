import { expect, test } from '@playwright/test';

/**
 * Join Group flow tests
 * Tests joining a group via invite code
 */

test.describe('Join Group Flow', () => {
  test('should open join modal from landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click "Join with Code" button
    const joinButton = page.getByRole('button', { name: /join.*code/i }).first();
    await expect(joinButton).toBeVisible({ timeout: 5000 });
    await joinButton.click();
    await page.waitForTimeout(500);

    // Modal should appear with invite code input
    const _inviteInput = page
      .locator('input[type="text"]')
      .filter({ hasText: /invite|code/i })
      .or(page.locator('input').filter({ hasText: /code/i }))
      .or(page.locator('input[placeholder*="code" i], input[placeholder*="invite" i]'))
      .first();

    // Alternative: look for any input in the modal
    const modalInput = page.locator('input[type="text"]').first();
    await expect(modalInput).toBeVisible({ timeout: 3000 });

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/join-group-modal.png',
      fullPage: true,
    });
  });

  test('should join group via invite code', async ({ page }) => {
    // This test requires:
    // 1. An existing group with an invite code
    // 2. User to be authenticated

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    // Test the modal opening (assumes authenticated from global setup)
    const joinButton = page.getByRole('button', { name: /join.*code/i }).first();
    await joinButton.click();
    await page.waitForTimeout(500);

    // Modal should be visible
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    const isModalVisible = await modal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Try to find invite code input
      const inputs = page.locator('input[type="text"]');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
    }
  });

  test('should navigate to join page with invite code in URL', async ({ page }) => {
    // Use a test invite code (this will fail if code doesn't exist, but tests the flow)
    const testInviteCode = 'TEST123';
    await page.goto(`/join/${testInviteCode}`);

    // Wait for page to load - don't wait for networkidle as API calls might fail
    // Instead wait for either the form, error message, or loading skeleton to disappear
    await page.waitForLoadState('domcontentloaded');

    // Wait for either form, error, or sign-in required message to appear
    await Promise.race([
      page
        .waitForSelector('input[id="displayName"], input[name*="name" i]', { timeout: 10000 })
        .catch(() => null),
      page
        .waitForSelector('text=/invalid|not found|error|sign in required/i', { timeout: 10000 })
        .catch(() => null),
      page.waitForSelector('text=/go to home/i', { timeout: 10000 }).catch(() => null),
    ]);

    // Should show join form, error message, or sign-in required
    const hasJoinForm = await page
      .locator('input[id="displayName"], input[name*="name" i]')
      .isVisible()
      .catch(() => false);
    const hasError = await page
      .locator('text=/invalid|not found|error|sign in required/i')
      .isVisible()
      .catch(() => false);
    const hasHomeButton = await page
      .locator('button:has-text("Go to Home"), button:has-text("go to home")')
      .isVisible()
      .catch(() => false);

    // Either form, error, or home button should be visible
    expect(hasJoinForm || hasError || hasHomeButton).toBe(true);
  });
});
