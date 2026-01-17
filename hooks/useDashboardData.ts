import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
	getGroup,
	getMembersByGroup,
	getWorkoutsByGroup,
	createWorkout,
	updateWorkout,
	deleteWorkout,
	updateGroup,
	type Group,
	type Member,
	type Workout,
} from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export function useDashboardData(groupId: string) {
	const router = useRouter();
	const [group, setGroup] = useState<Group | null>(null);
	const [members, setMembers] = useState<Member[]>([]);
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(async () => {
		try {
			const [loadedGroup, loadedMembers, loadedWorkouts] = await Promise.all([
				getGroup(groupId),
				getMembersByGroup(groupId),
				getWorkoutsByGroup(groupId),
			]);

			if (!loadedGroup) {
				router.push('/');
				return;
			}

			setGroup(loadedGroup);
			setMembers(loadedMembers);
			setWorkouts(
				loadedWorkouts.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				),
			);
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			setLoading(false);
		}
	}, [groupId, router]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleSaveWorkout = async (
		workoutData: Omit<Workout, 'id' | 'createdAt'>,
		editingWorkout: Workout | null,
	) => {
		const user = getCurrentUser();
		if (!user) return;

		const member = members.find((m) => m.email === user.email);
		if (!member) return;

		if (editingWorkout) {
			const updated: Workout = {
				...editingWorkout,
				...workoutData,
			};
			await updateWorkout(updated);
		} else {
			const newWorkout: Workout = {
				id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				...workoutData,
				createdAt: new Date().toISOString(),
			};
			await createWorkout(newWorkout);
		}

		await loadData();
	};

	const handleDeleteWorkout = async (workoutId: string) => {
		if (confirm('Are you sure you want to delete this workout?')) {
			await deleteWorkout(workoutId);
			await loadData();
		}
	};

	const handleUpdateGroup = async (updates: Partial<Group>) => {
		if (!group) return;
		const updated: Group = { ...group, ...updates };
		await updateGroup(updated);
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
