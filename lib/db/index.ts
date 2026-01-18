/**
 * Database Abstraction Layer
 *
 * This layer provides a database-agnostic interface for data operations.
 * To switch databases, implement the adapter interface and update the exports below.
 */

import type { CreateGroupInput, Group } from '@/lib/schemas/Group';
import type { CreateMemberInput, Member } from '@/lib/schemas/Member';
import type { CreateWorkoutInput, Workout } from '@/lib/schemas/Workout';

// Re-export types for backward compatibility with frontend
// Note: Frontend can import directly from @/lib/schemas/* for better tree-shaking
export type {
  Group,
  GroupPlanSettings,
  PlannedWorkout,
  WeeklyPlan,
  WeeklyPlanOverrides,
} from '@/lib/schemas/Group';
export type { CreateMemberInput, Member } from '@/lib/schemas/Member';
export type { Exercise, Interval, Workout, WorkoutSet } from '@/lib/schemas/Workout';

// Database adapter interface
export interface DatabaseAdapter {
  // Group operations
  createGroup(data: CreateGroupInput): Promise<Group>;
  getGroupById(groupId: string): Promise<Group | null>;
  getGroupByInviteCode(inviteCode: string): Promise<Group | null>;
  updateGroup(
    groupId: string,
    updates: Partial<Omit<Group, '_id' | 'createdAt'>>
  ): Promise<Group | null>;
  deleteGroup(groupId: string): Promise<boolean>;
  getGroupsByUser(userId: string): Promise<Group[]>;
  getAllGroupsByUser(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Group[]>;

  // Member operations
  createMember(data: CreateMemberInput): Promise<Member>;
  getMemberByGroupAndUser(groupId: string, userId: string): Promise<Member | null>;
  getMembersByGroup(groupId: string): Promise<Member[]>;
  getGroupIdsByUser(userId: string): Promise<string[]>;
  deleteMember(groupId: string, userId: string): Promise<boolean>;
  isMember(groupId: string, userId: string): Promise<boolean>;
  isAdmin(groupId: string, userId: string): Promise<boolean>;

  // Workout operations
  createWorkout(data: CreateWorkoutInput): Promise<Workout>;
  getWorkoutById(workoutId: string): Promise<Workout | null>;
  getWorkoutsByGroup(
    groupId: string,
    options?: {
      userId?: string;
      date?: string;
      limit?: number;
      sort?: { [key: string]: 1 | -1 };
    }
  ): Promise<Workout[]>;
  updateWorkout(
    workoutId: string,
    updates: Partial<Omit<Workout, '_id' | 'groupId' | 'userId' | 'createdAt'>>
  ): Promise<Workout | null>;
  deleteWorkout(workoutId: string): Promise<boolean>;
}

// Import the current adapter (MongoDB)
import { MongoDBAdapter } from '@/lib/adapters/mongodb';

// Export the adapter instance
const db: DatabaseAdapter = new MongoDBAdapter();

// Export convenience functions that use the adapter
export const createGroup = (data: CreateGroupInput) => db.createGroup(data);
export const getGroupById = (groupId: string) => db.getGroupById(groupId);
export const getGroupByInviteCode = (inviteCode: string) => db.getGroupByInviteCode(inviteCode);
export const updateGroup = (groupId: string, updates: Partial<Omit<Group, '_id' | 'createdAt'>>) =>
  db.updateGroup(groupId, updates);
export const deleteGroup = (groupId: string) => db.deleteGroup(groupId);
export const getGroupsByUser = (userId: string) => db.getGroupsByUser(userId);
export const getAllGroupsByUser = (userId: string, options?: { limit?: number; offset?: number }) =>
  db.getAllGroupsByUser(userId, options);

// Member operations
export const createMember = (data: CreateMemberInput) => db.createMember(data);
export const getMemberByGroupAndUser = (groupId: string, userId: string) =>
  db.getMemberByGroupAndUser(groupId, userId);
export const getMembersByGroup = (groupId: string) => db.getMembersByGroup(groupId);
export const getGroupIdsByUser = (userId: string) => db.getGroupIdsByUser(userId);
export const deleteMember = (groupId: string, userId: string) => db.deleteMember(groupId, userId);
export const isMember = (groupId: string, userId: string) => db.isMember(groupId, userId);
export const isAdmin = (groupId: string, userId: string) => db.isAdmin(groupId, userId);

// Workout operations
export const createWorkout = (data: CreateWorkoutInput) => db.createWorkout(data);
export const getWorkoutById = (workoutId: string) => db.getWorkoutById(workoutId);
export const getWorkoutsByGroup = (
  groupId: string,
  options?: {
    userId?: string;
    date?: string;
    limit?: number;
    sort?: { [key: string]: 1 | -1 };
  }
) => db.getWorkoutsByGroup(groupId, options);
export const updateWorkout = (
  workoutId: string,
  updates: Partial<Omit<Workout, '_id' | 'groupId' | 'userId' | 'createdAt'>>
) => db.updateWorkout(workoutId, updates);
export const deleteWorkout = (workoutId: string) => db.deleteWorkout(workoutId);

// Export adapter for advanced usage
export { db as databaseAdapter };
