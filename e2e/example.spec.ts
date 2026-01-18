import { expect, test } from '@playwright/test';

/**
 * Example E2E test with screenshot capabilities
 *
 * This test demonstrates how to:
 * - Navigate pages
 * - Take screenshots at any point
 * - Save screenshots to a specific directory
 * - Test user interactions
 */

test.describe('Home Page', () => {
  test('should load home page and take screenshot', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the entire page
    await page.screenshot({
      path: 'test-results/screenshots/home-page.png',
      fullPage: true,
    });

    // Verify page loaded correctly
    await expect(page).toHaveTitle(/Let's Vamos/i);
  });

  test('should show create group button when authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk to initialize and check if user is authenticated
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    // Wait for authentication state to be determined
    // If authenticated, "Create Your Group" button will appear
    // If not authenticated, "Get Started Free" button will appear
    const isAuthenticated = await page.evaluate(() => {
      const clerk = (window as any).Clerk;
      return clerk && clerk.user !== null;
    });

    if (isAuthenticated) {
      // Take screenshot before interaction
      await page.screenshot({
        path: 'test-results/screenshots/home-before-click.png',
      });

      // Find and verify create group button exists (only visible when authenticated)
      const createButton = page.getByRole('button', { name: /create.*group|create your group/i });
      await expect(createButton).toBeVisible({ timeout: 5000 });

      // Take screenshot of button
      await createButton.screenshot({
        path: 'test-results/screenshots/create-group-button.png',
      });
    } else {
      // If not authenticated, verify "Get Started Free" button exists instead
      // Use .first() to handle multiple buttons with same text
      const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
      await expect(getStartedButton).toBeVisible({ timeout: 5000 });

      // Take screenshot
      await page.screenshot({
        path: 'test-results/screenshots/home-unauthenticated.png',
      });
    }
  });
});

test.describe('Screenshot Examples', () => {
  test('should capture different viewport sizes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Desktop screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({
      path: 'test-results/screenshots/desktop-view.png',
      fullPage: true,
    });

    // Tablet screenshot
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: 'test-results/screenshots/tablet-view.png',
      fullPage: true,
    });

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: 'test-results/screenshots/mobile-view.png',
      fullPage: true,
    });
  });

  test('should capture element screenshots', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot of specific element
    const logo = page.locator('img[alt*="logo"], img[alt*="Logo"]').first();
    if (await logo.isVisible().catch(() => false)) {
      await logo.screenshot({
        path: 'test-results/screenshots/logo-element.png',
      });
    }

    // Screenshot of a section
    const mainContent = page.locator('main, [role="main"]').first();
    if (await mainContent.isVisible().catch(() => false)) {
      await mainContent.screenshot({
        path: 'test-results/screenshots/main-content.png',
      });
    }
  });
});
