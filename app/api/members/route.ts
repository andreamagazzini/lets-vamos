import { auth, clerkClient } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { createMember, getMemberByGroupAndUser, getMembersByGroup, isMember } from '@/lib/db';
import { CreateMemberSchema } from '@/lib/schemas/Member';

// GET /api/members?groupId=xxx - Get all members of a group
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Check if user is a member of the group
    const userIsMember = await isMember(groupId, userId);
    if (!userIsMember) {
      return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
    }

    const members = await getMembersByGroup(groupId);

    // All members should have displayName (enforced in schema), but we return them as-is
    // The displayName is set when the member is created, using Clerk data
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// POST /api/members - Join a group (create a member)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, displayName } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = await getMemberByGroupAndUser(groupId, userId);
    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 });
    }

    // Fetch user data from Clerk to get displayName
    let finalDisplayName = displayName?.trim();

    if (!finalDisplayName) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const firstName = clerkUser.firstName || '';
        const lastName = clerkUser.lastName || '';
        finalDisplayName = [firstName, lastName].filter(Boolean).join(' ').trim();

        // If no firstName/lastName, use email username as fallback
        if (!finalDisplayName) {
          const email = clerkUser.emailAddresses?.[0]?.emailAddress;
          if (email) {
            finalDisplayName = email.split('@')[0];
          }
        }
      } catch (error) {
        console.error('Failed to fetch Clerk user from clerkClient, trying currentUser:', error);
        // Try to get email from currentUser as fallback
        try {
          const { currentUser } = await import('@clerk/nextjs/server');
          const user = await currentUser();
          const email = user?.emailAddresses?.[0]?.emailAddress;
          if (email) {
            finalDisplayName = email.split('@')[0];
          } else {
            throw new Error('No email available');
          }
        } catch (fallbackError) {
          console.error('Failed to get email from currentUser:', fallbackError);
          return NextResponse.json(
            {
              error:
                'Unable to determine display name. Please ensure your account has an email address.',
            },
            { status: 400 }
          );
        }
      }
    }

    // Ensure we have a displayName (required by schema)
    if (!finalDisplayName || finalDisplayName.trim() === '') {
      return NextResponse.json(
        {
          error:
            'Unable to determine display name. Please ensure your account has an email address.',
        },
        { status: 400 }
      );
    }

    const validated = CreateMemberSchema.parse({
      groupId,
      userId,
      displayName: finalDisplayName,
      role: 'member',
    });

    const member = await createMember(validated);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
