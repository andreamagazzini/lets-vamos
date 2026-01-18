import { getDb } from '@/lib/mongodb';
import { type CreateMemberInput, type Member, MemberSchema } from '@/lib/schemas/Member';

const COLLECTION_NAME = 'members';

export class MongoDBMembersAdapter {
  async createMember(data: CreateMemberInput): Promise<Member> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const now = new Date();
    // Ensure displayName is always set (required by schema)
    if (!data.displayName || data.displayName.trim() === '') {
      throw new Error('displayName is required');
    }

    const member = {
      ...data,
      displayName: data.displayName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    // Validate with Zod
    const validated = MemberSchema.parse(member);

    const result = await collection.insertOne(validated);

    return {
      ...validated,
      _id: result.insertedId,
    };
  }

  async getMemberByGroupAndUser(groupId: string, userId: string): Promise<Member | null> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    // groupId is stored as string in members collection
    const member = await collection.findOne({ groupId, userId });
    if (!member) return null;

    // Ensure displayName is always a string (should never be null in DB, but handle legacy data)
    if (!member.displayName || member.displayName.trim() === '') {
      throw new Error(`Member ${member._id} has invalid displayName`);
    }

    return MemberSchema.parse(member);
  }

  async getMembersByGroup(groupId: string): Promise<Member[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const members = await collection.find({ groupId }).toArray();
    return members.map((m) => {
      // Ensure displayName is always a string (should never be null in DB, but handle legacy data)
      if (!m.displayName || m.displayName.trim() === '') {
        throw new Error(`Member ${m._id} has invalid displayName`);
      }
      return MemberSchema.parse(m);
    });
  }

  async getGroupsByUser(userId: string): Promise<string[]> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const members = await collection.find({ userId }).toArray();
    return members.map((m) => m.groupId);
  }

  async deleteMember(groupId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.deleteOne({ groupId, userId });
    return result.deletedCount > 0;
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const member = await this.getMemberByGroupAndUser(groupId, userId);
    return member !== null;
  }

  async isAdmin(groupId: string, userId: string): Promise<boolean> {
    const member = await this.getMemberByGroupAndUser(groupId, userId);
    return member?.role === 'admin';
  }
}
