import type { Page } from '@playwright/test';

/**
 * Helper functions for Clerk authentication in Playwright tests
 */

/**
 * Authenticate a user by setting Clerk session token in cookies
 * This is a workaround for testing - in production, use Clerk's proper test utilities
 */
export async function authenticateUser(page: Page, _userId: string, sessionToken: string) {
  // Set Clerk session cookie
  await page.context().addCookies([
    {
      name: '__session',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Also set in localStorage if needed
  await page.addInitScript((token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('__clerk_db_jwt', token);
    }
  }, sessionToken);
}

/**
 * Sign in via UI flow (for email code authentication)
 */
export async function signInViaUI(page: Page, email: string) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Look for sign in button
  const signInButton = page.getByRole('button', { name: /sign in|log in|get started/i }).first();
  if (await signInButton.isVisible().catch(() => false)) {
    await signInButton.click();
    await page.waitForTimeout(1000);

    // Fill email
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(email);
      await page.waitForTimeout(500);

      // Submit
      const continueButton = page.getByRole('button', { name: /continue|next|send code/i }).first();
      if (await continueButton.isVisible().catch(() => false)) {
        await continueButton.click();
        await page.waitForTimeout(2000);
      }
    }
  }
}

/**
 * Wait for user to be authenticated
 */
export async function waitForAuth(page: Page) {
  // Wait for Clerk to initialize
  await page.waitForFunction(
    () => {
      return typeof window !== 'undefined' && (window as any).Clerk;
    },
    { timeout: 10000 }
  );

  // Wait for user to be loaded
  await page.waitForFunction(
    () => {
      const clerk = (window as any).Clerk;
      return clerk?.user;
    },
    { timeout: 10000 }
  );
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const clerk = (window as any).Clerk;
    return clerk && clerk.user !== null;
  });
}
