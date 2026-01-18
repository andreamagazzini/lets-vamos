# Playwright Authentication Setup

This directory contains authentication state for Playwright tests.

## Automated Authentication (Current Setup)

The setup uses **Clerk's test mode** which allows fully automated authentication:

- **Test Email Pattern**: Emails containing `+clerk_test` (e.g., `user+clerk_test@test.com`)
- **Test Verification Code**: Always `424242` for test emails
- **Fully Automated**: No manual intervention needed, works in headless mode

### How It Works

1. Global setup runs before all tests
2. Automatically navigates to the app and opens auth modal
3. Enters test email: `user+clerk_test@test.com`
4. Submits email and waits for code input
5. Enters test code: `424242`
6. Completes authentication and saves state to `user.json`
7. All subsequent tests use the saved authentication state

### Environment Variables

Optional - defaults work out of the box:

```bash
TEST_USER_EMAIL=user+clerk_test@test.com  # Default if not set
```

### Running Tests

Just run tests normally - authentication is fully automated:

```bash
# Headless (default) - works perfectly
pnpm test

# Headed mode (if you want to see what's happening)
pnpm test:headed

# UI mode (interactive)
pnpm test:ui
```

## Files

- `user.json` - Saved authentication state (auto-generated, git-ignored)
- `setup.ts` - Global setup script for automated authentication
