'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DatePicker from '@/components/DatePicker';
import { FormSkeleton } from '@/components/LoadingSkeleton';
import { useToast } from '@/components/Toast';
import EditableEmoji, { getRandomEmoji } from '@/components/dashboard/EditableEmoji';
import { GOAL_TYPES, SUCCESS_MESSAGES } from '@/lib/constants';
import { isDateInFuture } from '@/lib/date-utils';
import { getErrorMessage, handleAsync } from '@/lib/error-handler';
import { generateInviteCode } from '@/lib/utils';
import { isNotEmpty } from '@/lib/validation';

export default function CreateGroupPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoaded: userLoaded } = useUser();
  const [groupName, setGroupName] = useState('');
  const [emoji, setEmoji] = useState(() => getRandomEmoji());
  const [goalType, setGoalType] = useState('Marathon');
  const [customGoalType, setCustomGoalType] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (userLoaded) {
      if (!user) {
        router.push('/');
        return;
      }
      setInitialLoading(false);
    }
  }, [user, userLoaded, router]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!isNotEmpty(groupName)) {
      newErrors.groupName = 'Group name is required';
    }

    const finalGoalType = goalType === 'Other' ? customGoalType : goalType;
    if (!isNotEmpty(finalGoalType)) {
      newErrors.goalType = 'Goal type is required';
    }

    if (!goalDate) {
      newErrors.goalDate = 'Event date is required';
    } else if (!isDateInFuture(goalDate)) {
      newErrors.goalDate = 'Event date must be in the future';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a group');
      router.push('/');
      return;
    }

    setLoading(true);
    setErrors({});

    // Create group in MongoDB via API
    const { data: group, error: groupError } = await handleAsync(async () => {
      const inviteCode = generateInviteCode();
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          emoji: emoji || '🏃',
          goalType: finalGoalType,
          goalDate,
          inviteCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group');
      }

      return await response.json();
    }, 'createGroup');

    if (groupError || !group) {
      setErrors({ form: getErrorMessage(groupError) || 'Failed to create group' });
      toast.error('Failed to create group');
      setLoading(false);
      return;
    }

    toast.success(SUCCESS_MESSAGES.GROUP_CREATED);
    // Navigate using groupId (MongoDB _id)
    // MongoDB returns _id as ObjectId, convert to string
    const groupId = group.group._id?.toString() || group.group._id || group.group.id;
    if (!groupId) {
      toast.error('Failed to get group ID');
      setLoading(false);
      return;
    }
    router.push(`/setup-plan/${groupId}`);
  };

  if (initialLoading || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <FormSkeleton />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-lg card-modern animate-fade-in">
        <h1 className="heading-lg text-black mb-8 tracking-tight">Create Your Training Group</h1>
        <form onSubmit={handleCreateGroup} className="space-y-6">
          <div>
            <label htmlFor="groupName" className="block text-sm font-semibold text-black mb-3">
              Group Name
            </label>
            <div className="flex items-center gap-3">
              <EditableEmoji emoji={emoji} onChange={setEmoji} size="lg" />
              <div className="flex-1">
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g., Marathon Crew 2025"
                  aria-describedby={errors.groupName ? 'groupName-error' : undefined}
                  aria-invalid={!!errors.groupName}
                />
                {errors.groupName && (
                  <p
                    id="groupName-error"
                    className="mt-2 text-sm text-red-600 font-medium"
                    role="alert"
                  >
                    {errors.groupName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="goalType" className="block text-sm font-semibold text-black mb-3">
              What are you training for?
            </label>
            <select
              id="goalType"
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
            >
              {GOAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {goalType === 'Other' && (
              <input
                type="text"
                value={customGoalType}
                onChange={(e) => setCustomGoalType(e.target.value)}
                placeholder="Enter goal type"
                className="w-full mt-3 px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
              />
            )}
            {errors.goalType && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.goalType}</p>
            )}
          </div>

          <div>
            <label htmlFor="goalDate" className="block text-sm font-semibold text-black mb-3">
              Event Date
            </label>
            <DatePicker
              id="goalDate"
              value={goalDate}
              onChange={(date) => setGoalDate(date)}
              minDate={new Date()}
              error={errors.goalDate}
              aria-describedby={errors.goalDate ? 'goalDate-error' : undefined}
              aria-invalid={!!errors.goalDate}
            />
          </div>

          {errors.form && (
            <div className="p-5 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-semibold mb-2">{errors.form}</p>
              <p className="text-xs text-red-500">Check the browser console for more details.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Group →'}
          </button>
        </form>
      </div>
    </div>
  );
}
