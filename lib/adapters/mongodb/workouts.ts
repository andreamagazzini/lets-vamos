import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { type CreateWorkoutInput, type Workout, WorkoutSchema } from '@/lib/schemas/Workout';

const COLLECTION_NAME = 'workouts';

export class MongoDBWorkoutsAdapter {
  async createWorkout(data: CreateWorkoutInput): Promise<Workout> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();
    const workout = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    // Validate with Zod
    const validated = WorkoutSchema.parse(workout);

    const result = await collection.insertOne(validated);
    return {
      ...validated,
      _id: result.insertedId,
    };
  }

  async getWorkoutById(workoutId: string): Promise<Workout | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Validate ObjectId format
    if (!ObjectId.isValid(workoutId)) {
      return null;
    }

    const workout = await collection.findOne({ _id: new ObjectId(workoutId) });
    if (!workout) return null;

    return WorkoutSchema.parse(workout);
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
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // groupId is stored as string in workouts collection
    const query: any = { groupId };
    if (options?.userId) {
      query.userId = options.userId;
    }
    if (options?.date) {
      query.date = options.date;
    }

    let cursor = collection.find(query);

    if (options?.sort) {
      cursor = cursor.sort(options.sort);
    } else {
      cursor = cursor.sort({ date: -1, createdAt: -1 });
    }

    if (options?.limit) {
      cursor = cursor.limit(options.limit);
    }

    const workouts = await cursor.toArray();
    return workouts.map((w) => WorkoutSchema.parse(w));
  }

  async updateWorkout(
    workoutId: string,
    updates: Partial<Omit<Workout, '_id' | 'groupId' | 'userId' | 'createdAt'>>
  ): Promise<Workout | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Validate ObjectId format
    if (!ObjectId.isValid(workoutId)) {
      return null;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(workoutId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) return null;

    return WorkoutSchema.parse(result);
  }

  async deleteWorkout(workoutId: string): Promise<boolean> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Validate ObjectId format
    if (!ObjectId.isValid(workoutId)) {
      return false;
    }

    const result = await collection.deleteOne({ _id: new ObjectId(workoutId) });
    return result.deletedCount > 0;
  }
}
