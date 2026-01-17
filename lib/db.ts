// TODO: Migrate from IndexedDB to a real database (PostgreSQL/MongoDB/etc)
// This file contains all IndexedDB operations that need to be replaced with API calls
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface Group {
  id: string
  name: string
  emoji?: string
  goalType: string
  goalDate: string
  createdAt: string
  inviteCode: string
  trainingPlan: WeeklyPlan
}

export interface WeeklyPlan {
  [day: string]: string[] // day: ['5K easy run', 'Rest day']
}

export interface Member {
  id: string
  groupId: string
  email: string
  displayName: string
  joinedAt: string
}

export interface Interval {
  type: 'warmup' | 'work' | 'recovery'
  distance?: number // km for Run/Bike, per 100m for Swim
  time?: number // seconds
  pace?: number // min/km or min/100m
  avgHeartRate?: number
}

export interface WorkoutSet {
  reps?: number
  weight?: number // kg
}

export interface Exercise {
  name: string
  sets: WorkoutSet[]
}

export interface Workout {
  id: string
  groupId: string
  memberId: string
  type: string
  duration?: number // minutes
  distance?: number // km for Run/Bike
  notes?: string
  date: string
  createdAt: string
  // Cardio fields (Run/Bike/Swim)
  calories?: number
  avgHeartRate?: number
  intervals?: Interval[]
  // Bike-specific
  avgSpeed?: number // km/h
  // Swim-specific
  distancePer100m?: number // seconds per 100m
  laps?: number
  poolLength?: number // meters
  // Strength training
  exercises?: Exercise[]
}

export interface User {
  id: string
  email: string
  createdAt: string
}

interface TrainTogetherDB extends DBSchema {
  groups: {
    key: string
    value: Group
  }
  members: {
    key: string
    value: Member
    indexes: { 'by-group': string }
  }
  workouts: {
    key: string
    value: Workout
    indexes: { 'by-group': string; 'by-member': string; 'by-date': string }
  }
  users: {
    key: string
    value: User
    indexes: { 'by-email': string }
  }
}

let dbInstance: IDBPDatabase<TrainTogetherDB> | null = null

// TODO: Replace with API call to backend database
export async function getDB(): Promise<IDBPDatabase<TrainTogetherDB>> {
  // Check if IndexedDB is available
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in the browser')
  }

  if (!window.indexedDB) {
    throw new Error('IndexedDB is not supported in this browser')
  }

  if (dbInstance) return dbInstance

  try {
    dbInstance = await openDB<TrainTogetherDB>('traintogether-db', 2, {
      upgrade(db, oldVersion) {
        console.log('Setting up IndexedDB...', 'oldVersion:', oldVersion)
        
        // Delete old stores if upgrading from version 1
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains('groups')) {
            db.deleteObjectStore('groups')
          }
          if (db.objectStoreNames.contains('members')) {
            db.deleteObjectStore('members')
          }
          if (db.objectStoreNames.contains('workouts')) {
            db.deleteObjectStore('workouts')
          }
          if (db.objectStoreNames.contains('users')) {
            db.deleteObjectStore('users')
          }
        }
        
        // Groups store with keyPath
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' })
          console.log('Created groups store')
        }

        // Members store with keyPath
        if (!db.objectStoreNames.contains('members')) {
          const membersStore = db.createObjectStore('members', { keyPath: 'id' })
          membersStore.createIndex('by-group', 'groupId')
          console.log('Created members store')
        }

        // Workouts store with keyPath
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutsStore = db.createObjectStore('workouts', { keyPath: 'id' })
          workoutsStore.createIndex('by-group', 'groupId')
          workoutsStore.createIndex('by-member', 'memberId')
          workoutsStore.createIndex('by-date', 'date')
          console.log('Created workouts store')
        }

        // Users store with keyPath
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' })
          usersStore.createIndex('by-email', 'email', { unique: true })
          console.log('Created users store')
        }
      },
    })

    console.log('IndexedDB initialized successfully')
    return dbInstance
  } catch (error) {
    console.error('Error initializing IndexedDB:', error)
    throw error
  }
}

// TODO: Replace IndexedDB operations with API calls
// Group operations
export async function createGroup(group: Group): Promise<void> {
  try {
    const db = await getDB()
    await db.put('groups', group)
    console.log('Group created successfully:', group.id)
  } catch (error) {
    console.error('Error creating group in IndexedDB:', error)
    throw error
  }
}

export async function getGroup(groupId: string): Promise<Group | undefined> {
  const db = await getDB()
  return db.get('groups', groupId)
}

export async function updateGroup(group: Group): Promise<void> {
  const db = await getDB()
  await db.put('groups', group)
}

export async function getGroupByInviteCode(inviteCode: string): Promise<Group | undefined> {
  const db = await getDB()
  const groups = await db.getAll('groups')
  return groups.find(g => g.inviteCode === inviteCode)
}

// TODO: Replace IndexedDB operations with API calls
// Member operations
export async function createMember(member: Member): Promise<void> {
  const db = await getDB()
  await db.put('members', member)
}

export async function getMembersByGroup(groupId: string): Promise<Member[]> {
  const db = await getDB()
  const index = db.transaction('members').store.index('by-group')
  return index.getAll(groupId)
}

export async function getMember(memberId: string): Promise<Member | undefined> {
  const db = await getDB()
  return db.get('members', memberId)
}

export async function getMemberByEmail(email: string): Promise<Member | undefined> {
  const db = await getDB()
  const members = await db.getAll('members')
  return members.find(m => m.email === email)
}

export async function getGroupsByUserEmail(email: string): Promise<Group[]> {
  const db = await getDB()
  const members = await db.getAll('members')
  const userMembers = members.filter(m => m.email === email)
  const groups = await db.getAll('groups')
  return groups.filter(g => userMembers.some(m => m.groupId === g.id))
}

// TODO: Replace IndexedDB operations with API calls
// Workout operations
export async function createWorkout(workout: Workout): Promise<void> {
  const db = await getDB()
  await db.put('workouts', workout)
}

export async function updateWorkout(workout: Workout): Promise<void> {
  const db = await getDB()
  await db.put('workouts', workout)
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const db = await getDB()
  await db.delete('workouts', workoutId)
}

export async function getWorkoutsByGroup(groupId: string): Promise<Workout[]> {
  const db = await getDB()
  const index = db.transaction('workouts').store.index('by-group')
  return index.getAll(groupId)
}

export async function getWorkoutsByMember(memberId: string): Promise<Workout[]> {
  const db = await getDB()
  const index = db.transaction('workouts').store.index('by-member')
  return index.getAll(memberId)
}

export async function getWorkout(workoutId: string): Promise<Workout | undefined> {
  const db = await getDB()
  return db.get('workouts', workoutId)
}

// TODO: Replace IndexedDB operations with API calls
// User operations
export async function createUser(user: User): Promise<void> {
  const db = await getDB()
  await db.put('users', user)
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDB()
  const index = db.transaction('users').store.index('by-email')
  return index.get(email)
}

export async function getUser(userId: string): Promise<User | undefined> {
  const db = await getDB()
  return db.get('users', userId)
}

// Utility functions
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}
