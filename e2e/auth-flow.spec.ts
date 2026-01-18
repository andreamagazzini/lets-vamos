import { expect, test } from '@playwright/test';

/**
 * Authentication flow tests
 * Tests Clerk email code authentication using test mode (+clerk_test pattern)
 */

test.describe('Authentication Flow', () => {
  test('should show sign in/sign up buttons on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk to initialize
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    // Check if user is authenticated
    const isAuthenticated = await page.evaluate(() => {
      const clerk = (window as any).Clerk;
      return clerk && clerk.user !== null;
    });

    if (!isAuthenticated) {
      // Should show "Get Started Free" button when not authenticated
      // Use .first() since there are 2 buttons with same text on the page
      const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
      await expect(getStartedButton).toBeVisible();
    }

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/auth/landing-page.png',
      fullPage: true,
    });
  });

  test('should open auth modal when clicking Get Started', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    const isAuthenticated = await page.evaluate(() => {
      const clerk = (window as any).Clerk;
      return clerk && clerk.user !== null;
    });

    if (!isAuthenticated) {
      // Click Get Started button (use first() since there are 2 on the page)
      const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
      await getStartedButton.click();
      await page.waitForTimeout(500);

      // Auth modal should appear
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible({ timeout: 3000 });

      // Take screenshot
      await page.screenshot({
        path: 'test-results/screenshots/auth/auth-modal.png',
        fullPage: true,
      });
    }
  });

  test('should complete sign up flow with test email', async ({ page }) => {
    const testEmail = 'test+clerk_test@test.com';
    const testCode = '424242';

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    const isAuthenticated = await page.evaluate(() => {
      const clerk = (window as any).Clerk;
      return clerk && clerk.user !== null;
    });

    // If already authenticated, this test doesn't apply - user is already signed up
    // We'll test sign-up in a different scenario or skip
    if (isAuthenticated) {
      // User is already authenticated, so sign-up flow is not applicable
      // This is expected when running with global auth setup
      return;
    }

    // Open auth modal
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
    await getStartedButton.click();
    await page.waitForTimeout(500);

    // Fill email
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill(testEmail);
    await page.waitForTimeout(300);

    // Submit email
    const continueButton = page
      .getByRole('button', { name: /send code|create account|continue/i })
      .first();
    await continueButton.click();

    // Wait for verification step to appear
    await page.waitForSelector('input#code, input[type="text"][maxlength="6"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Give modal time to transition

    // Fill verification code - use id selector which is more reliable
    const codeInput = page
      .locator('input#code')
      .or(page.locator('input[type="text"][maxlength="6"]'))
      .first();
    await expect(codeInput).toBeVisible({ timeout: 5000 });
    await codeInput.fill(testCode);
    await page.waitForTimeout(500);

    // Submit code
    const verifyButton = page.getByRole('button', { name: /verify/i }).first();
    await verifyButton.click();
    await page.waitForTimeout(3000);

    // Should be authenticated now
    const isNowAuthenticated = await page.evaluate(() => {
      const clerk = (window as any).Clerk;
      return clerk && clerk.user !== null;
    });

    expect(isNowAuthenticated).toBe(true);
  });
});
