import { expect, type Page } from '@playwright/test';

/**
 * Helper function to fill the create group form
 */
export async function fillCreateGroupForm(
  page: Page,
  groupName: string,
  goalDate: Date,
  goalType: string = 'Marathon'
) {
  // Wait for form to be ready
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Give time for skeleton to disappear

  // Fill group name using id selector
  await page.locator('input#groupName').fill(groupName);
  await page.waitForTimeout(300);

  // Select goal type
  await page.locator('select#goalType').selectOption(goalType);
  await page.waitForTimeout(300);

  // Set goal date using DatePicker
  const datePickerButton = page
    .locator('button[aria-label="Select date"]')
    .or(page.locator('button').filter({ hasText: /select date/i }))
    .first();
  await expect(datePickerButton).toBeVisible({ timeout: 5000 });
  await datePickerButton.click();
  await page.waitForTimeout(500);

  // Wait for calendar to open
  await page.waitForSelector(
    'button[aria-label*="January"], button[aria-label*="February"], button[aria-label*="March"]',
    { timeout: 3000 }
  );

  // Click on the target date in the calendar
  const targetDay = goalDate.getDate();
  const monthName = goalDate.toLocaleString('en-US', { month: 'long' });
  const year = goalDate.getFullYear();

  // Try to find the date button by aria-label containing month and year, and text matching the day
  const dateButton = page
    .locator(`button[aria-label*="${monthName}"][aria-label*="${year}"]`)
    .filter({
      hasText: new RegExp(`^${targetDay}$`),
    })
    .first();

  // If not found, try a simpler approach - just find button with the day number
  if (!(await dateButton.isVisible({ timeout: 2000 }).catch(() => false))) {
    const allDateButtons = page
      .locator('button[aria-label*="202"]')
      .filter({ hasText: new RegExp(`^${targetDay}$`) });
    const count = await allDateButtons.count();
    if (count > 0) {
      await allDateButtons.first().click();
    } else {
      // Fallback: click any button with the day number that's not disabled
      await page.locator(`button:has-text("^${targetDay}$"):not([disabled])`).first().click();
    }
  } else {
    await dateButton.click();
  }
  await page.waitForTimeout(300);
}

/**
 * Helper function to create a group via the UI
 */
export async function createGroupViaUI(
  page: Page,
  groupName?: string,
  daysFromNow: number = 30
): Promise<string | null> {
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

  // Fill form
  const finalGroupName = groupName || `Test Group ${Date.now()}`;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);

  await fillCreateGroupForm(page, finalGroupName, futureDate);

  // Submit form
  const submitButton = page.getByRole('button', { name: /create.*group/i });
  await submitButton.click();

  // Wait for redirect to setup plan page
  await page.waitForURL(/\/setup-plan\//, { timeout: 10000 });

  // Extract groupId from URL
  const url = page.url();
  const match = url.match(/\/setup-plan\/([^/]+)/);
  return match ? match[1] : null;
}
