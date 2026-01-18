'use client';

import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import AuthModal from '@/components/AuthModal';
import { FormSkeleton } from '@/components/LoadingSkeleton';
import { useToast } from '@/components/Toast';
import { SUCCESS_MESSAGES } from '@/lib/constants';
import type { Group } from '@/lib/db';
import { getErrorMessage, handleAsync } from '@/lib/error-handler';
import { isNotEmpty, isValidRouteParam } from '@/lib/validation';

export default function JoinGroupPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams();
  const inviteCodeParam = params.inviteCode;
  const inviteCode = isValidRouteParam(inviteCodeParam) ? inviteCodeParam : null;
  const { user, isLoaded: userLoaded } = useUser();

  const [group, setGroup] = useState<Group | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasAttemptedAutoJoin, setHasAttemptedAutoJoin] = useState(false);

  const loadGroup = useCallback(async () => {
    if (!inviteCode) return;
    const { data: response, error } = await handleAsync(async () => {
      // Ensure invite code is uppercase and URL-encoded
      const normalizedCode = encodeURIComponent(inviteCode.trim().toUpperCase());
      const res = await fetch(`/api/groups/invite/${normalizedCode}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Group not found');
      }
      return await res.json();
    }, 'loadGroup');

    if (error || !response?.group) {
      setErrors({ group: 'Invalid invite code. Please check the link and try again.' });
      toast.error('Group not found');
      setInitialLoading(false);
      return;
    }
    setGroup(response.group);
    setInitialLoading(false);
  }, [inviteCode, toast]);

  useEffect(() => {
    if (!inviteCode) {
      router.push('/');
      return;
    }
    loadGroup();
  }, [inviteCode, loadGroup, router]);

  // Auto-open auth modal if user is not authenticated and group is loaded
  useEffect(() => {
    if (userLoaded && !user && group && !initialLoading) {
      setShowAuthModal(true);
    }
    // Close auth modal when user becomes authenticated
    if (user && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [userLoaded, user, group, initialLoading, showAuthModal]);

  // After successful authentication, automatically join the group
  useEffect(() => {
    const handleAutoJoin = async () => {
      if (user && group && group._id && !loading && !showAuthModal && !hasAttemptedAutoJoin) {
        setHasAttemptedAutoJoin(true);

        // Small delay to ensure user session is fully established
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const groupId = group._id.toString();

        // Check if already a member
        const { error: checkError, data: checkData } = await handleAsync(async () => {
          const res = await fetch(`/api/members?groupId=${groupId}`);
          if (res.ok) {
            const data = await res.json();
            const isAlreadyMember = data.members?.some(
              (m: { userId: string }) => m.userId === user.id
            );
            if (isAlreadyMember) {
              router.push(`/dashboard/${groupId}`);
              return { isMember: true };
            }
          }
          return { isMember: false };
        }, 'checkMembership');

        // If not a member, join automatically (without display name for now)
        if (!checkError && !checkData?.isMember) {
          setLoading(true);
          const { error: joinError } = await handleAsync(async () => {
            const response = await fetch('/api/members', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                groupId,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to join group');
            }

            return await response.json();
          }, 'autoJoinGroup');

          if (!joinError) {
            toast.success(SUCCESS_MESSAGES.MEMBER_JOINED);
            router.push(`/dashboard/${groupId}`);
          } else {
            setLoading(false);
            setHasAttemptedAutoJoin(false); // Allow retry on error
          }
        }
      }
    };

    if (user && group && !showAuthModal && !hasAttemptedAutoJoin) {
      handleAutoJoin();
    }
  }, [user, group, showAuthModal, loading, hasAttemptedAutoJoin, router, toast]);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNotEmpty(displayName)) {
      setErrors({ displayName: 'Display name is required' });
      return;
    }

    if (!group || !group._id) {
      setErrors({ group: 'Group not found' });
      return;
    }

    if (!user) {
      toast.error('You must be logged in to join a group');
      router.push('/');
      return;
    }

    setLoading(true);
    setErrors({});

    const groupId = group._id.toString();

    // Check if user is already a member
    const { error: checkError } = await handleAsync(async () => {
      const res = await fetch(`/api/members?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        const isAlreadyMember = data.members?.some((m: { userId: string }) => m.userId === user.id);
        if (isAlreadyMember) {
          router.push(`/dashboard/${groupId}`);
          setLoading(false);
          return true; // Signal that we're done
        }
      }
      return false;
    }, 'checkMembership');

    if (checkError) {
      // Continue to join flow
    }

    // Join the group by creating a member
    const { error: joinError } = await handleAsync(async () => {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          displayName: displayName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join group');
      }

      return await response.json();
    }, 'joinGroup');

    if (joinError) {
      setErrors({ form: getErrorMessage(joinError) });
      toast.error('Failed to join group');
      setLoading(false);
      return;
    }

    toast.success(SUCCESS_MESSAGES.MEMBER_JOINED);
    router.push(`/dashboard/${groupId}`);
  };

  if (initialLoading || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <FormSkeleton />
      </div>
    );
  }

  if (errors.group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-lg card-modern animate-fade-in">
          <h1 className="heading-lg text-black mb-4 tracking-tight">Invalid Invite Link</h1>
          <p className="text-gray-600 mb-6 body-md">{errors.group}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn-primary w-full text-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (!user && group) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-6 bg-white">
          <div className="w-full max-w-lg card-modern animate-fade-in">
            <h1 className="heading-lg text-black mb-2 tracking-tight">Join {group.name}</h1>
            <p className="text-gray-600 body-md mb-4">Sign up to join this training group</p>
            <div className="text-sm text-gray-500">Opening signup...</div>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            // If they close without signing up, redirect to home
            if (!user) {
              router.push('/');
            }
          }}
          defaultMode="sign-up"
          redirectAfterSignup={group?._id ? `/join/${inviteCode}` : undefined}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-lg card-modern animate-fade-in">
        <h1 className="heading-lg text-black mb-2 tracking-tight">Join {group?.name}</h1>
        <p className="text-gray-600 body-md mb-6">
          Enter your display name to join this training group
        </p>
        <form onSubmit={handleJoinGroup} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold text-black mb-3">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
              placeholder="Your name"
              aria-describedby={errors.displayName ? 'displayName-error' : undefined}
              aria-invalid={!!errors.displayName}
            />
            {errors.displayName && (
              <p
                id="displayName-error"
                className="mt-2 text-sm text-red-600 font-medium"
                role="alert"
              >
                {errors.displayName}
              </p>
            )}
          </div>

          {errors.form && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-semibold">{errors.form}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Group →'}
          </button>
        </form>
      </div>
    </div>
  );
}
