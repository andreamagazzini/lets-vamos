import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getGroupById, isMember } from '@/lib/db';

// GET /api/groups/[groupId] - Get a specific group
export async function GET(_req: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.organizationId; // Keep param name for backward compatibility
    const group = await getGroupById(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member (or is the creator)
    const userIsMember = group.createdBy === userId || (await isMember(groupId, userId));

    if (!userIsMember) {
      return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}
