# E2E Tests

This directory contains End-to-End tests using Playwright.

## Quick Start

```bash
# Install browsers (first time only)
pnpm exec playwright install

# Run all tests
pnpm test

# Run with UI (interactive)
pnpm test:ui

# Run in headed mode (see browser)
pnpm test:headed
```

## Authentication Setup

The app uses Clerk for authentication. To run tests that require authentication:

### Option 1: Manual Authentication (Easiest)

1. Run tests in headed mode:
   ```bash
   pnpm test:headed
   ```

2. When the browser opens, manually sign in with a test account
3. The authentication state will be saved to `playwright/.auth/user.json`
4. Future tests will automatically use this saved state

### Option 2: Skip Authentication (Public Routes Only)

Tests for public routes (like the landing page) don't require authentication and will work without setup.

### Option 3: Use Test Helpers

Import authentication helpers in your tests:

```typescript
import { signInViaUI, waitForAuth } from './auth-helpers';

test('authenticated test', async ({ page }) => {
  await signInViaUI(page, 'test@example.com');
  await waitForAuth(page);
  // Your test code here
});
```

## Screenshot Locations

All screenshots are saved to:
- `test-results/screenshots/` - Manual screenshots from tests
- `test-results/` - Auto-generated failure screenshots

## Test Files

- `example.spec.ts` - Basic examples with screenshot capabilities
- `auth-flow.spec.ts` - Authentication flow tests
- `dashboard.spec.ts` - Dashboard page tests
- `test-helpers.ts` - Reusable test utilities
- `auth-helpers.ts` - Authentication helper functions

## Adding New Tests

1. Create a new `.spec.ts` file in this directory
2. Import test utilities: `import { test, expect } from '@playwright/test'`
3. Use helper functions from `test-helpers.ts` for common operations
4. Take screenshots at key points in your test flow

Example:

```typescript
import { test, expect } from '@playwright/test';
import { takeScreenshot } from './test-helpers';

test('my new test', async ({ page }) => {
  await page.goto('/my-page');
  await page.waitForLoadState('networkidle');
  
  await takeScreenshot(page, 'my-page', { fullPage: true });
  
  await expect(page.locator('h1')).toBeVisible();
});
```

## Troubleshooting

### Tests failing due to authentication

- Make sure you've run authentication setup at least once
- Check that `playwright/.auth/user.json` exists
- Try running in headed mode to see what's happening: `pnpm test:headed`

### Authentication state expired

- Delete `playwright/.auth/user.json` and re-run authentication setup
- Or manually authenticate again in headed mode
