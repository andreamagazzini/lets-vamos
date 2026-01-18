import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { type CreateGroupInput, type Group, GroupSchema } from '@/lib/schemas/Group';

const COLLECTION_NAME = 'groups';

export class MongoDBGroupsAdapter {
  async createGroup(data: CreateGroupInput): Promise<Group> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Check for duplicate invite code
    const existing = await collection.findOne({ inviteCode: data.inviteCode });
    if (existing) {
      throw new Error(`Invite code ${data.inviteCode} already exists`);
    }

    const now = new Date();
    const group = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    // Validate with Zod
    const validated = GroupSchema.parse(group);

    try {
      const result = await collection.insertOne(validated);
      return {
        ...validated,
        _id: result.insertedId,
      };
    } catch (error: any) {
      // Handle duplicate key error from MongoDB
      if (error.code === 11000 || error.message?.includes('duplicate key')) {
        throw new Error(`Invite code ${data.inviteCode} already exists`);
      }
      throw error;
    }
  }

  async getGroupById(groupId: string): Promise<Group | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Validate ObjectId format
    if (!ObjectId.isValid(groupId)) {
      return null;
    }

    const group = await collection.findOne({
      _id: new ObjectId(groupId),
      deletedAt: { $exists: false },
    });
    if (!group) return null;

    return GroupSchema.parse(group);
  }

  async getGroupByInviteCode(inviteCode: string): Promise<Group | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Normalize invite code (uppercase, trimmed)
    const normalizedCode = inviteCode.trim().toUpperCase();

    // Try exact match first
    let group = await collection.findOne({
      inviteCode: normalizedCode,
      deletedAt: { $exists: false },
    });

    // If not found, try case-insensitive search (in case codes were stored in different case)
    if (!group) {
      group = await collection.findOne({
        inviteCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') },
        deletedAt: { $exists: false },
      });
    }

    if (!group) {
      return null;
    }

    return GroupSchema.parse(group);
  }

  async updateGroup(
    groupId: string,
    updates: Partial<Omit<Group, '_id' | 'createdAt'>>
  ): Promise<Group | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Validate ObjectId format
    if (!ObjectId.isValid(groupId)) {
      return null;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(groupId), deletedAt: { $exists: false } },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) return null;

    return GroupSchema.parse(result);
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Soft delete - set deletedAt instead of actually deleting
    if (!ObjectId.isValid(groupId)) {
      return false;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(groupId) },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
    return result !== null;
  }

  async getGroupsByUser(userId: string): Promise<Group[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // Get groups where user is the creator (exclude soft-deleted)
    const groups = await collection
      .find({ createdBy: userId, deletedAt: { $exists: false } })
      .toArray();
    return groups.map((g) => GroupSchema.parse(g));
  }
}
