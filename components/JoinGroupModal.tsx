'use client';

import { useUser } from '@clerk/nextjs';
import { Users, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Group } from '@/lib/db';
import { getErrorMessage, handleAsync } from '@/lib/error-handler';
import { isNotEmpty } from '@/lib/validation';
import { useToast } from './Toast';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInviteCode?: string;
}

export default function JoinGroupModal({
  isOpen,
  onClose,
  initialInviteCode = '',
}: JoinGroupModalProps) {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoaded: userLoaded } = useUser();

  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [group, setGroup] = useState<Group | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'join'>('code');

  const loadGroup = useCallback(
    async (code: string) => {
      if (!code.trim()) return;

      setLoading(true);
      setErrors({});

      const { data: response, error } = await handleAsync(async () => {
        const res = await fetch(`/api/groups/invite/${code.trim()}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Group not found');
        }
        return await res.json();
      }, 'loadGroup');

      if (error || !response?.group) {
        setErrors({ inviteCode: 'Invalid invite code. Please check and try again.' });
        toast.error('Group not found');
        setLoading(false);
        return;
      }

      setGroup(response.group);
      setStep('join');
      setLoading(false);
    },
    [toast.error]
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInviteCode(initialInviteCode);
      setGroup(null);
      setDisplayName('');
      setErrors({});
      setStep('code');
    } else if (initialInviteCode) {
      // If invite code is provided, load the group immediately
      loadGroup(initialInviteCode);
    }
  }, [isOpen, initialInviteCode, loadGroup]);

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadGroup(inviteCode);
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNotEmpty(displayName)) {
      setErrors({ displayName: 'Display name is required' });
      return;
    }

    if (!user) {
      toast.error('You must be signed in to join a group');
      onClose();
      return;
    }

    if (!group || !group._id) {
      setErrors({ group: 'Group not found' });
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
          toast.success('Already a member!');
          onClose();
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

    toast.success('Successfully joined the group!');
    onClose();
    router.push(`/dashboard/${groupId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#02182c]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#fcfcfa] rounded-2xl shadow-2xl border-2 border-[#02182c]/10 animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#02182c] transition-colors"
          aria-label="Close"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Let's Vamos" width={120} height={60} priority />
          </div>

          {step === 'code' ? (
            <>
              {/* Enter Invite Code Step */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-[#02182c] mb-2">Join a Group</h2>
                <p className="text-gray-600">Enter the invite code to join a training group</p>
              </div>

              <form onSubmit={handleSubmitCode} className="space-y-4">
                <div>
                  <label
                    htmlFor="inviteCode"
                    className="block text-sm font-semibold text-[#02182c] mb-2"
                  >
                    Invite Code
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2888fb] transition-colors bg-white text-center font-mono text-lg tracking-wider uppercase"
                    placeholder="ABC123"
                  />
                </div>

                {errors.inviteCode && (
                  <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                    <p className="text-sm text-red-600 font-medium">{errors.inviteCode}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !inviteCode.trim()}
                  className="w-full bg-[#02182c] text-[#fcfcfa] py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-[#010f1a] hover:scale-[1.02] active:scale-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Continue'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Join Group Step */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#2888fb]/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#2888fb]" />
                </div>
                <h2 className="text-3xl font-extrabold text-[#02182c] mb-2">
                  {group?.emoji} {group?.name}
                </h2>
                <p className="text-gray-600">
                  Training for: <span className="font-semibold">{group?.goalType}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Event date: {group?.goalDate ? new Date(group.goalDate).toLocaleDateString() : ''}
                </p>
              </div>

              {!userLoaded || !user ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">You need to sign in to join this group</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-[#02182c] text-[#fcfcfa] px-6 py-3 rounded-xl font-semibold hover:bg-[#010f1a] transition-colors"
                  >
                    Sign In First
                  </button>
                </div>
              ) : (
                <form onSubmit={handleJoinGroup} className="space-y-4">
                  <div>
                    <label
                      htmlFor="displayName"
                      className="block text-sm font-semibold text-[#02182c] mb-2"
                    >
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2888fb] transition-colors bg-white"
                      placeholder="Your name"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This is how other group members will see you
                    </p>
                  </div>

                  {(errors.displayName || errors.form) && (
                    <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                      <p className="text-sm text-red-600 font-medium">
                        {errors.displayName || errors.form}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('code');
                        setGroup(null);
                        setDisplayName('');
                        setErrors({});
                      }}
                      className="flex-1 bg-gray-100 text-[#02182c] py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !displayName.trim()}
                      className="flex-1 bg-[#02182c] text-[#fcfcfa] py-3 rounded-xl font-bold shadow-lg hover:bg-[#010f1a] hover:scale-[1.02] active:scale-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Joining...' : 'Join Group'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
