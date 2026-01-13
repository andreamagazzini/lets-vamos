# Let's Vamos (TrainTogether)

A shared group dashboard for small training groups (2-5 people) to track workouts and stay accountable for a shared fitness goal (marathon, Hyrox, triathlon, etc).

## 🎯 Current Status

**Version:** 1.0.0 (Prototype)

This is a fully functional prototype using:
- **IndexedDB** for local data storage (client-side only)
- **Mock authentication** (no real auth service)
- **No backend** - all data stored in browser

### ⚠️ Migration Notes

- All IndexedDB operations are marked with `TODO` comments for future migration to a real database
- Authentication is mocked and needs to be replaced with a real auth service
- See `lib/db.ts` for all database operations that need API integration

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

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Quick Test Login

The app includes quick test login buttons on the home page:
- **Test User 1**: `test1@example.com`
- **Test User 2**: `test2@example.com`

No password required - click the buttons to log in instantly for testing.

## 🛠 Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **IndexedDB (via idb)** - Local browser storage (prototype only)
- **React Hooks** - State management

## 📁 Project Structure

```
/app
  /create-group      - Group creation flow
  /dashboard         - Main dashboard with progress tracking
  /setup-plan        - Weekly training plan setup
  /join              - Join group with invite code
/components
  LogWorkoutModal.tsx - Workout logging modal
/lib
  db.ts              - IndexedDB operations (TODO: migrate to API)
  auth.ts            - Mock authentication (TODO: real auth)
  db-debug.ts        - Debug utilities
```

## 🔄 User Flows

1. **Create Group** → Enter email → Set group name, goal type, and event date
2. **Setup Plan** → Add workouts to each day of the week (Mon-Sun)
3. **Join Group** → Use invite code → Enter display name
4. **Log Workouts** → Click "+ Log Workout" → Fill in details
5. **View Dashboard** → See countdown, weekly plan, progress chart, and activity feed

## 🎨 Design

- **Color Palette**: Dark blue (#1e3a8a) primary, light blue (#60a5fa) accents
- **Typography**: Inter font family, bold headings
- **Style**: Modern, sporty, clean design inspired by WHOOP

## 📝 Development Notes

### Current Limitations (Prototype)

- All data is stored locally in browser's IndexedDB
- No backend API - fully client-side
- Mock authentication (no real magic links)
- Data is not synced across devices
- No user accounts or password recovery

### Future Improvements

- [ ] Migrate IndexedDB to PostgreSQL/MongoDB backend
- [ ] Implement real authentication (Auth0, Clerk, or Supabase)
- [ ] Add API endpoints for all database operations
- [ ] Add data synchronization across devices
- [ ] Add email notifications
- [ ] Add workout statistics and analytics
- [ ] Add mobile app (React Native)

## 📄 License

MIT

## 👤 Author

Andrea Magazzini
