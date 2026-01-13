# TrainTogether

A shared group dashboard for small training groups (2-5 people) to track workouts and stay accountable for a shared fitness goal.

## Features

- Create training groups with custom goals (marathon, triathlon, etc.)
- Set up weekly training plans
- Log workouts with duration, distance, and notes
- View group activity and progress
- Invite friends via shareable links
- All data stored locally using IndexedDB

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **IndexedDB (via idb)** - Local data storage
- **React Hooks** - State management

## Project Structure

- `/app` - Next.js app router pages
- `/components` - Reusable React components
- `/lib` - Utility functions and database operations
  - `db.ts` - IndexedDB operations
  - `auth.ts` - Mock authentication

## User Flows

1. **Create Group** - Set up a new training group with goal and date
2. **Setup Plan** - Define weekly training schedule
3. **Join Group** - Use invite code to join existing groups
4. **Log Workouts** - Track individual workouts
5. **View Dashboard** - See group progress and activity

## Notes

- Authentication is mocked for prototyping (magic links are simulated)
- All data persists in browser's IndexedDB
- No backend required - fully client-side application
