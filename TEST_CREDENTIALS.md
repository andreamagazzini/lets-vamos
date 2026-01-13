# Test Credentials

For quick prototyping and testing, you can use these test credentials:

## Quick Login (No Password Required)

The app includes a **Quick Test Login** feature on the home page. Simply click one of these buttons:

- **Test User 1**: `test1@example.com`
- **Test User 2**: `test2@example.com`

No password is needed - these buttons will log you in immediately for testing purposes.

## Alternative: Email-Based Login

You can also use any email address when creating a group or joining. The app uses a mock authentication system, so:

1. Enter any email (e.g., `yourname@example.com`)
2. Click "Continue" 
3. You'll be automatically logged in (no actual email is sent)

## Test Workflow

1. **Create a Group**:
   - Click "Quick Test Login" → Login as Test User 1
   - Click "Create Group"
   - Fill in group details and create

2. **Join a Group**:
   - Use the invite code from the group you created
   - Or click "Quick Test Login" → Login as Test User 2
   - Enter the invite code to join

3. **Log Workouts**:
   - Once in a group, click "+ Log Workout"
   - Fill in workout details
   - Save to see it on the dashboard

## Notes

- All data is stored locally in your browser's IndexedDB
- No backend or real authentication is required
- You can use any email address - it's just for identification
- Test users persist until you clear browser storage
