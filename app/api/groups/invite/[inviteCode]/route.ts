import { type NextRequest, NextResponse } from 'next/server';
import { getGroupByInviteCode } from '@/lib/db';

// GET /api/groups/invite/[inviteCode] - Get group by invite code
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> | { inviteCode: string } }
) {
  try {
    // Handle both async and sync params (Next.js 13+ vs 14+)
    const resolvedParams = await Promise.resolve(params);
    let inviteCode = resolvedParams.inviteCode;

    // Decode URL encoding if present
    try {
      inviteCode = decodeURIComponent(inviteCode);
    } catch {
      // If decode fails, use original
    }

    inviteCode = inviteCode.trim().toUpperCase();

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const group = await getGroupByInviteCode(inviteCode);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Return minimal info (no sensitive data)
    return NextResponse.json({
      group: {
        _id: group._id,
        name: group.name,
        emoji: group.emoji,
        goalType: group.goalType,
        goalDate: group.goalDate,
        inviteCode: group.inviteCode,
      },
    });
  } catch (error) {
    console.error('Error fetching group by invite code:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}
