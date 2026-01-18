/**
 * MongoDB Database Adapter
 *
 * This is the MongoDB-specific implementation of the database adapter interface.
 * To switch to another database, create a new adapter in lib/adapters/[new-db]/
 * and implement the DatabaseAdapter interface.
 */

import type { DatabaseAdapter } from '@/lib/db';
import type { CreateGroupInput, Group } from '@/lib/schemas/Group';
import type { CreateMemberInput, Member } from '@/lib/schemas/Member';
import type { CreateWorkoutInput, Workout } from '@/lib/schemas/Workout';
import { MongoDBGroupsAdapter } from './groups';
import { MongoDBMembersAdapter } from './members';
import { MongoDBWorkoutsAdapter } from './workouts';

export class MongoDBAdapter implements DatabaseAdapter {
  private groups: MongoDBGroupsAdapter;
  private members: MongoDBMembersAdapter;
  private workouts: MongoDBWorkoutsAdapter;

  constructor() {
    this.groups = new MongoDBGroupsAdapter();
    this.members = new MongoDBMembersAdapter();
    this.workouts = new MongoDBWorkoutsAdapter();
  }

  // Group operations
  async createGroup(data: CreateGroupInput): Promise<Group> {
    return this.groups.createGroup(data);
  }

  async getGroupById(groupId: string): Promise<Group | null> {
    return this.groups.getGroupById(groupId);
  }

  async getGroupByInviteCode(inviteCode: string): Promise<Group | null> {
    return this.groups.getGroupByInviteCode(inviteCode);
  }

  async updateGroup(
    groupId: string,
    updates: Partial<Omit<Group, '_id' | 'createdAt'>>
  ): Promise<Group | null> {
    return this.groups.updateGroup(groupId, updates);
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    return this.groups.deleteGroup(groupId);
  }

  async getGroupsByUser(userId: string): Promise<Group[]> {
    return this.groups.getGroupsByUser(userId);
  }

  // Member operations
  async createMember(data: CreateMemberInput): Promise<Member> {
    return this.members.createMember(data);
  }

  async getMemberByGroupAndUser(groupId: string, userId: string): Promise<Member | null> {
    return this.members.getMemberByGroupAndUser(groupId, userId);
  }

  async getMembersByGroup(groupId: string): Promise<Member[]> {
    return this.members.getMembersByGroup(groupId);
  }

  async getGroupIdsByUser(userId: string): Promise<string[]> {
    return this.members.getGroupsByUser(userId);
  }

  // Combined method to get all groups a user belongs to (created + joined)
  async getAllGroupsByUser(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Group[]> {
    const createdGroups = await this.groups.getGroupsByUser(userId);
    const joinedGroupIds = await this.members.getGroupsByUser(userId);

    // Get groups for joined group IDs
    const joinedGroups = await Promise.all(
      joinedGroupIds.map((id) => this.groups.getGroupById(id))
    );

    // Combine and deduplicate
    const allGroups = [...createdGroups, ...joinedGroups.filter((g): g is Group => g !== null)];
    const uniqueGroups = Array.from(new Map(allGroups.map((g) => [g._id?.toString(), g])).values());

    // Apply pagination if provided
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      return uniqueGroups.slice(offset, offset + limit);
    }

    return uniqueGroups;
  }

  async deleteMember(groupId: string, userId: string): Promise<boolean> {
    return this.members.deleteMember(groupId, userId);
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    return this.members.isMember(groupId, userId);
  }

  async isAdmin(groupId: string, userId: string): Promise<boolean> {
    return this.members.isAdmin(groupId, userId);
  }

  // Workout operations
  async createWorkout(data: CreateWorkoutInput): Promise<Workout> {
    return this.workouts.createWorkout(data);
  }

  async getWorkoutById(workoutId: string): Promise<Workout | null> {
    return this.workouts.getWorkoutById(workoutId);
  }

  async getWorkoutsByGroup(
    groupId: string,
    options?: {
      userId?: string;
      date?: string;
      limit?: number;
      sort?: { [key: string]: 1 | -1 };
    }
  ): Promise<Workout[]> {
    return this.workouts.getWorkoutsByGroup(groupId, options);
  }

  async updateWorkout(
    workoutId: string,
    updates: Partial<Omit<Workout, '_id' | 'groupId' | 'userId' | 'createdAt'>>
  ): Promise<Workout | null> {
    return this.workouts.updateWorkout(workoutId, updates);
  }

  async deleteWorkout(workoutId: string): Promise<boolean> {
    return this.workouts.deleteWorkout(workoutId);
  }
}
