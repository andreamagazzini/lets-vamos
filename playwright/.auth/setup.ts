import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium, type FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 *
 * Uses Clerk's test mode with +clerk_test email pattern.
 * Test verification code is always 424242 for emails containing +clerk_test
 */
async function globalSetup(config: FullConfig) {
  const authDir = path.join(__dirname, '..');
  const authFile = path.join(authDir, 'user.json');

  // Create auth directory if it doesn't exist
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // If auth file already exists and is recent (less than 1 hour old), skip setup
  if (fs.existsSync(authFile)) {
    const stats = fs.statSync(authFile);
    const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    if (ageInHours < 1) {
      console.log('Using existing authentication state');
      return;
    }
    console.log('Authentication state is old, refreshing...');
  }

  const { baseURL } = config.projects[0].use;
  const url = baseURL || 'http://localhost:3000';
  const testEmail = process.env.TEST_USER_EMAIL || 'user+clerk_test@test.com';
  const testCode = '424242'; // Clerk test mode verification code

  console.log('Setting up authentication with Clerk test mode...');
  console.log(`Test email: ${testEmail}`);
  console.log(`Test code: ${testCode}`);

  // Launch browser (headless is fine for automated flow)
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    // Wait for Clerk to load
    await page.waitForFunction(() => typeof window !== 'undefined' && (window as any).Clerk, {
      timeout: 10000,
    });

    // Find and click sign in/sign up button
    const signInButton = page
      .getByRole('button', { name: /sign in|log in|get started|sign up/i })
      .first();

    if (await signInButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signInButton.click();
      await page.waitForTimeout(1000);
    }

    // Wait for auth modal to appear
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 5000,
    });

    // Fill in email
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill(testEmail);
    await page.waitForTimeout(500);

    // Submit email form
    const continueButton = page
      .getByRole('button', { name: /continue|send code|create account|sign in/i })
      .first();

    if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueButton.click();
      await page.waitForTimeout(2000);
    }

    // Wait for verification code input to appear - use id selector which is more reliable
    await page.waitForSelector('input#code, input[type="text"][maxlength="6"]', {
      timeout: 10000,
    });
    await page.waitForTimeout(1000); // Give modal time to transition

    // Fill in test verification code
    const codeInput = page
      .locator('input#code')
      .or(page.locator('input[type="text"][maxlength="6"]'))
      .first();
    await codeInput.fill(testCode);
    await page.waitForTimeout(500);

    // Submit verification code
    const verifyButton = page.getByRole('button', { name: /verify|continue|submit/i }).first();

    if (await verifyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await verifyButton.click();
      await page.waitForTimeout(3000);
    }

    // Wait for authentication to complete
    // Check if we're authenticated - wait up to 15 seconds
    let isAuth = false;
    try {
      await page.waitForFunction(
        () => {
          const clerk = (window as any).Clerk;
          return clerk && clerk.user !== null;
        },
        { timeout: 15000 }
      );
      isAuth = true;
    } catch {
      console.warn('Authentication check timed out, verifying manually...');
      // Try one more time with a direct check
      isAuth = await page.evaluate(() => {
        const clerk = (window as any).Clerk;
        return clerk && clerk.user !== null;
      });
    }

    if (isAuth) {
      // Wait a bit more for session to fully establish
      await page.waitForTimeout(2000);
      await context.storageState({ path: authFile });
      console.log('✓ Authentication state saved successfully');

      // Verify the auth file was created
      if (fs.existsSync(authFile)) {
        const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
        console.log(`✓ Auth file contains ${authData.cookies?.length || 0} cookies`);
      }
    } else {
      console.error('❌ Authentication failed - user is not authenticated');
      console.error('Current URL:', page.url());

      // Take a screenshot for debugging
      await page.screenshot({ path: path.join(authDir, 'auth-failed.png') });

      // Don't create empty auth file - let it fail so we know there's a problem
      throw new Error('Authentication setup failed - user is not authenticated after signup flow');
    }
  } catch (error) {
    console.error('Error during authentication setup:', error);
    // Create empty auth file to prevent re-running setup
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
