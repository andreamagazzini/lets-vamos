/**
 * MongoDB Indexes Setup Script
 *
 * Run this script to create necessary indexes for optimal performance:
 * pnpm tsx scripts/setup-indexes.ts
 *
 * Or use: pnpm run setup:indexes
 */

import { getDb } from '../lib/mongodb';

async function setupIndexes() {
  try {
    console.log('🔧 Setting up MongoDB indexes...');

    const db = await getDb();

    // Groups collection indexes
    const groupsCollection = db.collection('groups');

    await groupsCollection.createIndex(
      { inviteCode: 1 },
      { unique: true, name: 'idx_inviteCode_unique' }
    );
    console.log('✅ Created index: groups.inviteCode (unique)');

    await groupsCollection.createIndex(
      { createdBy: 1, deletedAt: 1 },
      { name: 'idx_createdBy_deletedAt' }
    );
    console.log('✅ Created index: groups.createdBy + deletedAt');

    await groupsCollection.createIndex({ deletedAt: 1 }, { name: 'idx_deletedAt' });
    console.log('✅ Created index: groups.deletedAt');

    // Members collection indexes
    const membersCollection = db.collection('members');

    await membersCollection.createIndex(
      { groupId: 1, userId: 1 },
      { unique: true, name: 'idx_groupId_userId_unique' }
    );
    console.log('✅ Created index: members.groupId + userId (unique)');

    await membersCollection.createIndex({ groupId: 1 }, { name: 'idx_groupId' });
    console.log('✅ Created index: members.groupId');

    await membersCollection.createIndex({ userId: 1 }, { name: 'idx_userId' });
    console.log('✅ Created index: members.userId');

    await membersCollection.createIndex({ groupId: 1, role: 1 }, { name: 'idx_groupId_role' });
    console.log('✅ Created index: members.groupId + role');

    // Workouts collection indexes
    const workoutsCollection = db.collection('workouts');

    await workoutsCollection.createIndex({ groupId: 1, date: -1 }, { name: 'idx_groupId_date' });
    console.log('✅ Created index: workouts.groupId + date');

    await workoutsCollection.createIndex(
      { groupId: 1, userId: 1, date: -1 },
      { name: 'idx_groupId_userId_date' }
    );
    console.log('✅ Created index: workouts.groupId + userId + date');

    await workoutsCollection.createIndex({ groupId: 1 }, { name: 'idx_groupId' });
    console.log('✅ Created index: workouts.groupId');

    await workoutsCollection.createIndex({ userId: 1 }, { name: 'idx_userId' });
    console.log('✅ Created index: workouts.userId');

    await workoutsCollection.createIndex({ userId: 1, date: -1 }, { name: 'idx_userId_date' });
    console.log('✅ Created index: workouts.userId + date');

    console.log('\n✨ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    process.exit(1);
  }
}

setupIndexes();
