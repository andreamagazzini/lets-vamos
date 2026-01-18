import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { createGroup, databaseAdapter, getGroupById, updateGroup } from '@/lib/db';
import type { CreateGroupInput, Group } from '@/lib/schemas/Group';
import { CreateGroupSchema } from '@/lib/schemas/Group';

// GET /api/groups - Get all groups for the authenticated user
// Query param ?groupId=xxx to get a specific group
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    // If groupId is provided, get that specific group
    if (groupId) {
      const group = await getGroupById(groupId);
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
      return NextResponse.json({ group });
    }

    // Otherwise, get all groups for user (created + joined)
    const groups = await databaseAdapter.getAllGroupsByUser(userId);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups - Create a new group
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, goalType, goalDate, inviteCode } = body;

    // Validate input
    const validated: CreateGroupInput = CreateGroupSchema.parse({
      name,
      goalType,
      goalDate,
      inviteCode,
      createdBy: userId,
      trainingPlan: {},
      planSettings: {
        displayStyle: 'expanded',
        showIcons: true,
        showDetails: true,
        colorTheme: 'default',
        highlightToday: true,
      },
    });

    // Check for duplicate invite code before creating
    const { getGroupByInviteCode } = await import('@/lib/db');
    const existingGroup = await getGroupByInviteCode(inviteCode);
    if (existingGroup) {
      return NextResponse.json(
        { error: 'Invite code already exists. Please try again.' },
        { status: 400 }
      );
    }

    const group = await createGroup(validated);

    // Fetch user data from Clerk to get displayName for admin member
    const { clerkClient, currentUser } = await import('@clerk/nextjs/server');
    let displayName = '';

    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';
      displayName = [firstName, lastName].filter(Boolean).join(' ').trim();

      // If no firstName/lastName, use email username as fallback
      if (!displayName) {
        const email = clerkUser.emailAddresses?.[0]?.emailAddress;
        if (email) {
          displayName = email.split('@')[0];
        }
      }
    } catch (error) {
      console.error('Failed to fetch Clerk user from clerkClient, trying currentUser:', error);
      // Try to get email from currentUser as fallback
      try {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress;
        if (email) {
          displayName = email.split('@')[0];
        } else {
          throw new Error('No email available');
        }
      } catch (fallbackError) {
        console.error('Failed to get email from currentUser:', fallbackError);
        // Last resort: return error instead of using userId
        return NextResponse.json(
          {
            error:
              'Unable to determine display name. Please ensure your account has an email address.',
          },
          { status: 400 }
        );
      }
    }

    // Ensure we have a displayName
    if (!displayName || displayName.trim() === '') {
      return NextResponse.json(
        {
          error:
            'Unable to determine display name. Please ensure your account has an email address.',
        },
        { status: 400 }
      );
    }

    // Create the creator as an admin member
    if (!group._id) {
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }

    const { createMember } = await import('@/lib/db');
    await createMember({
      groupId: group._id.toString(),
      userId,
      displayName,
      role: 'admin',
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);

    // Handle duplicate invite code error from MongoDB
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Invite code already exists. Please try again.' },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

// PATCH /api/groups - Update a group
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, ...updates } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Check if user is admin of the group
    const { isAdmin } = await import('@/lib/db');
    const userIsAdmin = await isAdmin(groupId, userId);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const group = await updateGroup(groupId, updates as Partial<Omit<Group, '_id' | 'createdAt'>>);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}
