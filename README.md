# Let's Vamos

A shared group dashboard for small training groups (2-5 people) to track workouts and stay accountable for a shared fitness goal (marathon, Hyrox, triathlon, etc).

## 🎯 Current Status

**Version:** 2.0.0 (Production Ready)

Built with:
- **Clerk** for authentication
- **MongoDB** for data storage (with abstraction layer for easy DB switching)
- **Next.js 14** with API routes
- **TypeScript** + **Zod** for type safety

## ✨ Features

- ✅ Create training groups with custom goals (marathon, triathlon, cycling, etc.)
- ✅ Set up weekly training plans (Mon-Sun)
- ✅ Log workouts with duration, distance, and notes
- ✅ View group activity and progress dashboard
- ✅ Weekly plan progress tracking with visual charts
- ✅ Invite friends via shareable invite codes
- ✅ Edit and delete workouts
- ✅ Modern, sporty UI inspired by WHOOP design
- ✅ Responsive design (mobile & desktop)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (package manager)
- Clerk account ([clerk.com](https://clerk.com))
- MongoDB (Atlas cloud or local)

### Installation

1. **Clone and install dependencies:**
```bash
pnpm install
```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your Clerk keys from [dashboard.clerk.com](https://dashboard.clerk.com)
   - Add your MongoDB connection string

3. **Set up MongoDB indexes:**
```bash
pnpm run setup:indexes
```

4. **Run the development server:**
```bash
pnpm dev
```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

### Environment Variables

Required variables (see `.env.example`):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- `CLERK_SECRET_KEY` - From Clerk dashboard
- `MONGODB_URI` - MongoDB connection string

## 🛠 Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Clerk** - Authentication
- **MongoDB** - Data storage (with abstraction layer)
- **Zod** - Runtime validation and type inference
- **Tailwind CSS** - Utility-first styling
- **Biome** - Fast linting and formatting

## 📁 Project Structure

```
/app
  /api               - API routes (protected by Clerk)
  /create-group      - Group creation flow
  /dashboard         - Main dashboard with progress tracking
  /setup-plan        - Weekly training plan setup
  /join              - Join group with invite code
/lib
  /db                - Database abstraction layer
  /adapters          - Database-specific implementations
    /mongodb         - MongoDB adapter
  /schemas           - Zod schemas and TypeScript types
/components          - React components
/hooks               - Custom React hooks
```

## 🏗 Architecture

### Data Storage Strategy

- **Clerk**: User authentication
- **MongoDB**: 
  - **Groups Collection**: Training plans, weekly overrides, settings
  - **Members Collection**: Group membership and roles
  - **Workouts Collection**: All workout logs

### Database Abstraction Layer

The codebase uses a database abstraction layer (`lib/db/`) that makes it easy to switch databases:

```
lib/
  db/
    index.ts          # Database interface/abstraction
  adapters/
    mongodb/          # MongoDB-specific implementation
      index.ts
      groups.ts
      members.ts
      workouts.ts
```

**To switch databases:**
1. Create a new adapter in `lib/adapters/[new-db]/`
2. Implement the `DatabaseAdapter` interface
3. Update `lib/db/index.ts` to use the new adapter
4. No changes needed in API routes or business logic

### Security

- All API routes protected by Clerk middleware
- Group membership verified on every request
- Data queries filtered by `groupId` and user membership
- Input validation with Zod schemas
- Type-safe operations with TypeScript
- Soft deletes for data recovery

### Data Models

See `lib/schemas/` for Zod schemas and TypeScript types:
- `Group.ts` - Group schema with training plans
- `Member.ts` - Member schema with roles (admin/member)
- `Workout.ts` - Workout schema with all workout types

## 📚 API Documentation

Interactive API documentation is available at `/api-docs`. The documentation is generated from the OpenAPI 3.1 specification.

- **Interactive Docs**: Visit `/api-docs` in your browser
- **OpenAPI Spec**: Available at `/api/openapi` (JSON format)

### API Endpoints

#### Groups
- `GET /api/groups` - Get groups for authenticated user
- `POST /api/groups` - Create a new group
- `PATCH /api/groups` - Update a group (admin only)
- `GET /api/groups/{groupId}` - Get a specific group
- `GET /api/groups/invite/{inviteCode}` - Get group by invite code (public)

#### Members
- `GET /api/members?groupId=xxx` - Get members of a group
- `POST /api/members` - Join a group (create member)

#### Workouts
- `GET /api/workouts?groupId=xxx` - Get workouts for a group
- `POST /api/workouts` - Create a new workout
- `GET /api/workouts/{workoutId}` - Get a specific workout
- `PATCH /api/workouts/{workoutId}` - Update a workout
- `DELETE /api/workouts/{workoutId}` - Delete a workout

### Adding New Endpoints

When adding a new API endpoint, update the OpenAPI spec in `app/api/openapi/route.ts` manually. This ensures accurate, helpful documentation.

## 🔄 User Flows

1. **Create Group** → Enter email → Set group name, goal type, and event date
2. **Setup Plan** → Add workouts to each day of the week (Mon-Sun)
3. **Join Group** → Use invite code → Enter display name
4. **Log Workouts** → Click "+ Log Workout" → Fill in details
5. **View Dashboard** → See countdown, weekly plan, progress chart, and activity feed

## 🎨 Design

- **Color Palette**: 
  - Primary: `#02182c` (Dark Navy)
  - Accent: `#2888fb` (Bright Blue)
  - Background: `#fcfcfa` (Off White)
- **Typography**: Inter font family, bold headings
- **Style**: Modern, sporty, clean design inspired by WHOOP

## 🧪 Testing

This project uses [Playwright](https://playwright.dev) for End-to-End (E2E) testing.

### Quick Start

```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run all tests
pnpm test

# Run tests with UI mode (interactive)
pnpm test:ui

# Run tests in headed mode (see browser)
pnpm test:headed

# View test report
pnpm test:report
```

### Test Structure

```
e2e/
  ├── example.spec.ts          # Basic examples
  ├── auth-flow.spec.ts        # Authentication tests
  ├── dashboard.spec.ts        # Dashboard tests
  └── test-helpers.ts          # Reusable test utilities
```

Screenshots are automatically captured on test failures and saved to `test-results/`.

## 🔧 Development

### Code Quality

This project uses **Biome** for linting and formatting (faster than ESLint).

```bash
# Check everything (lint + format, read-only)
pnpm check

# Fix everything automatically (lint + format)
pnpm check:fix

# Format code only
pnpm format

# Lint only
pnpm lint
```

**Recommended workflow:**
- Before committing: `pnpm check:fix` (fixes everything)
- In CI/CD: `pnpm check` (just checks, fails if issues found)

### MongoDB Indexes

After setting up MongoDB, run the index setup script:

```bash
pnpm run setup:indexes
```

This creates indexes for:
- Groups: `inviteCode` (unique), `createdBy`, `deletedAt`
- Members: `groupId + userId` (unique), `groupId`, `userId`, `groupId + role`
- Workouts: `groupId + date`, `groupId + userId + date`, `userId + date`

### Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm test             # Run E2E tests
pnpm check:fix        # Fix linting and formatting
pnpm setup:indexes    # Set up MongoDB indexes
```

## 📝 Development Notes

### Database Migration

The codebase migrated from IndexedDB to MongoDB. All data is now stored in MongoDB with:
- Soft delete support (`deletedAt` field)
- Proper indexes for performance
- Member-based access control (replacing Clerk organizations)

### Future Improvements

- [ ] Add email notifications
- [ ] Add workout statistics and analytics
- [ ] Add mobile app (React Native)
- [ ] Add caching layer (Redis)
- [ ] Add rate limiting
- [ ] Add workout templates
- [ ] Add social features (comments, reactions)

## 📄 License

MIT

## 👤 Author

Andrea Magazzini
