import { expect, test } from '@playwright/test';

/**
 * Create Group flow tests
 * Tests the complete group creation flow
 */

test.describe('Create Group Flow', () => {
  test('should navigate to create group page when authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk to initialize
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    // Wait for user to be authenticated (with better error handling)
    // If not authenticated, the test will fail with a clear message
    const isAuthenticated = await page
      .waitForFunction(
        () => {
          const clerk = (window as any).Clerk;
          return clerk && clerk.user !== null;
        },
        { timeout: 15000 }
      )
      .then(() => true)
      .catch(async () => {
        // If auth check fails, verify the auth state
        const authCheck = await page.evaluate(() => {
          const clerk = (window as any).Clerk;
          return {
            clerkExists: !!clerk,
            user: clerk?.user,
            loaded: clerk?.loaded,
          };
        });
        console.error('Auth check failed:', authCheck);
        return false;
      });

    if (!isAuthenticated) {
      throw new Error(
        'User is not authenticated. Check that global setup completed successfully and storageState is being loaded.'
      );
    }

    // Click "Create Your Group" button
    const createButton = page
      .getByRole('button', { name: /create.*group|create your group/i })
      .first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Should navigate to create group page
    await page.waitForURL(/\/create-group/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/create-group/);

    // Wait for page to finish loading (auth check completes)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give time for skeleton to disappear

    // Verify form elements are present (using id selectors since labels use htmlFor)
    await expect(page.locator('input#groupName')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('select#goalType')).toBeVisible();
    await expect(page.locator('input#goalDate, [id*="goalDate"]')).toBeVisible();
  });

  test('should create a group successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk to initialize and check auth
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    // Wait for user to be authenticated
    await page.waitForFunction(
      () => {
        const clerk = (window as any).Clerk;
        return clerk && clerk.user !== null;
      },
      { timeout: 10000 }
    );

    // Navigate to create group
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

    // Wait for page to finish loading (auth check completes)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give time for skeleton to disappear

    // Fill in group form using id selectors
    const groupName = `Test Group ${Date.now()}`;
    await page.locator('input#groupName').fill(groupName);
    await page.waitForTimeout(300);

    // Select goal type (default is Marathon)
    const goalTypeSelect = page.locator('select#goalType');
    await goalTypeSelect.selectOption('Marathon');
    await page.waitForTimeout(300);

    // Set goal date (30 days from now) - DatePicker is a custom component
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    // Click the DatePicker button to open calendar
    const datePickerButton = page
      .locator('button[aria-label="Select date"]')
      .or(page.locator('button').filter({ hasText: /select date/i }))
      .first();
    await datePickerButton.click();
    await page.waitForTimeout(500);

    // Click on the target date in the calendar
    const targetDay = futureDate.getDate();
    const dateButton = page
      .locator(`button[aria-label*="${futureDate.getFullYear()}"]`)
      .filter({
        hasText: new RegExp(`^${targetDay}$`),
      })
      .first();
    await dateButton.click();
    await page.waitForTimeout(300);

    // Submit form
    const submitButton = page.getByRole('button', { name: /create.*group/i });
    await submitButton.click();

    // Should redirect to setup plan page
    await page.waitForURL(/\/setup-plan\//, { timeout: 10000 });
    await expect(page).toHaveURL(/\/setup-plan\//);
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/create-group');
    await page.waitForLoadState('networkidle');

    // Wait for Clerk to initialize and check auth
    await page.waitForFunction(
      () => typeof window !== 'undefined' && (window as any).Clerk !== undefined,
      { timeout: 10000 }
    );

    // Wait for user to be authenticated
    await page.waitForFunction(
      () => {
        const clerk = (window as any).Clerk;
        return clerk && clerk.user !== null;
      },
      { timeout: 10000 }
    );

    // Wait for page to finish loading (auth check completes)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give time for skeleton to disappear

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /create.*group/i });
    await submitButton.click();
    await page.waitForTimeout(500);

    // Should show validation errors
    const errorMessages = page.locator('text=/required|invalid|error/i');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
  });
});
