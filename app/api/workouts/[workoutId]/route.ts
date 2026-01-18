import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { deleteWorkout, getWorkoutById, isAdmin, isMember, updateWorkout } from '@/lib/db';
import type { Workout } from '@/lib/schemas/Workout';

// GET /api/workouts/[workoutId] - Get a specific workout
export async function GET(_req: NextRequest, { params }: { params: { workoutId: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workout = await getWorkoutById(params.workoutId);

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Check if user is a member of the group
    const userIsMember = await isMember(workout.groupId, userId);
    if (!userIsMember) {
      return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
    }

    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json({ error: 'Failed to fetch workout' }, { status: 500 });
  }
}

// PATCH /api/workouts/[workoutId] - Update a workout
export async function PATCH(req: NextRequest, { params }: { params: { workoutId: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const workout = await getWorkoutById(params.workoutId);

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Check if user owns this workout or is admin
    if (workout.userId !== userId) {
      const userIsAdmin = await isAdmin(workout.groupId, userId);
      if (!userIsAdmin) {
        return NextResponse.json({ error: 'You can only edit your own workouts' }, { status: 403 });
      }
    }

    const updatedWorkout = await updateWorkout(
      params.workoutId,
      body as Partial<Omit<Workout, '_id' | 'groupId' | 'userId' | 'createdAt'>>
    );

    return NextResponse.json({ workout: updatedWorkout });
  } catch (error) {
    console.error('Error updating workout:', error);
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 });
  }
}

// DELETE /api/workouts/[workoutId] - Delete a workout
export async function DELETE(_req: NextRequest, { params }: { params: { workoutId: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workout = await getWorkoutById(params.workoutId);

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Only allow users to delete their own workouts (unless admin)
    if (workout.userId !== userId) {
      const userIsAdmin = await isAdmin(workout.groupId, userId);
      if (!userIsAdmin) {
        return NextResponse.json(
          { error: 'You can only delete your own workouts' },
          { status: 403 }
        );
      }
    }

    await deleteWorkout(params.workoutId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
  }
}
