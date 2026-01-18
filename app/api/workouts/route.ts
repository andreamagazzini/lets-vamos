import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { createWorkout, getWorkoutsByGroup, isMember } from '@/lib/db';
import type { CreateWorkoutInput } from '@/lib/schemas/Workout';
import { CreateWorkoutSchema } from '@/lib/schemas/Workout';

// GET /api/workouts?groupId=xxx - Get workouts for a group
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const userIdFilter = searchParams.get('userId'); // Optional: filter by user

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Check if user is a member
    const userIsMember = await isMember(groupId, userId);
    if (!userIsMember) {
      return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
    }

    const workouts = await getWorkoutsByGroup(groupId, {
      userId: userIdFilter || undefined,
      sort: { date: -1, createdAt: -1 },
    });

    return NextResponse.json({ workouts });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

// POST /api/workouts - Create a new workout
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, type, date, ...workoutData } = body;

    if (!groupId || !type || !date) {
      return NextResponse.json({ error: 'Group ID, type, and date are required' }, { status: 400 });
    }

    // Check if user is a member
    const userIsMember = await isMember(groupId, userId);
    if (!userIsMember) {
      return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
    }

    // Validate input
    const validated: CreateWorkoutInput = CreateWorkoutSchema.parse({
      groupId,
      userId,
      type,
      date,
      ...workoutData,
    });

    const workout = await createWorkout(validated);

    return NextResponse.json({ workout }, { status: 201 });
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 });
  }
}
