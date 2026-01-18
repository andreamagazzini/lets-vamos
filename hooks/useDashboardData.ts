import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { SUCCESS_MESSAGES } from '@/lib/constants';
import type { Group, Member, Workout } from '@/lib/db';
import { getErrorMessage, handleAsync } from '@/lib/error-handler';

export function useDashboardData(groupId: string) {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoaded: userLoaded } = useUser();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const { data: results, error } = await handleAsync(async () => {
      const [groupRes, workoutsRes, membersRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/workouts?groupId=${groupId}`),
        fetch(`/api/members?groupId=${groupId}`),
      ]);

      if (!groupRes.ok) {
        throw new Error('Failed to fetch group');
      }
      if (!workoutsRes.ok) {
        throw new Error('Failed to fetch workouts');
      }

      const groupData = await groupRes.json();
      const workoutsData = await workoutsRes.json();
      const membersData = membersRes.ok ? await membersRes.json() : { members: [] };

      return {
        loadedGroup: groupData.group,
        loadedWorkouts: workoutsData.workouts || [],
        loadedMembers: membersData.members || [],
      };
    }, 'loadData');

    if (error) {
      toast.error(getErrorMessage(error));
      setLoading(false);
      return;
    }

    if (!results?.loadedGroup) {
      router.push('/dashboard');
      setLoading(false);
      return;
    }

    setGroup(results.loadedGroup);
    setMembers(results.loadedMembers);
    setWorkouts(
      results.loadedWorkouts.sort(
        (a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
    setLoading(false);
  }, [groupId, router, toast]);

  useEffect(() => {
    if (userLoaded && groupId) {
      loadData();
    }
  }, [loadData, userLoaded, groupId]);

  const handleSaveWorkout = async (
    workoutData: Omit<Workout, '_id' | 'createdAt'>,
    editingWorkout: Workout | null
  ) => {
    if (!user || !groupId) {
      toast.error('You must be logged in to log workouts');
      return;
    }

    const { error } = await handleAsync(async () => {
      if (editingWorkout?._id) {
        // Update existing workout
        const response = await fetch(`/api/workouts/${editingWorkout._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workoutData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update workout');
        }

        toast.success(SUCCESS_MESSAGES.WORKOUT_UPDATED);
      } else {
        // Create new workout
        const response = await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...workoutData,
            groupId,
            userId: user.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create workout');
        }

        toast.success(SUCCESS_MESSAGES.WORKOUT_LOGGED);
      }
    }, 'handleSaveWorkout');

    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }

    await loadData();
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    const { error } = await handleAsync(async () => {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workout');
      }
    }, 'handleDeleteWorkout');

    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }

    toast.success(SUCCESS_MESSAGES.WORKOUT_DELETED);
    await loadData();
  };

  const handleUpdateGroup = async (updates: Partial<Group>) => {
    if (!group || !group._id) return;

    const { error } = await handleAsync(async () => {
      const response = await fetch('/api/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group._id?.toString() || group._id,
          ...updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update group');
      }
    }, 'handleUpdateGroup');

    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }

    await loadData();
  };

  return {
    group,
    members,
    workouts,
    loading,
    loadData,
    handleSaveWorkout,
    handleDeleteWorkout,
    handleUpdateGroup,
  };
}
