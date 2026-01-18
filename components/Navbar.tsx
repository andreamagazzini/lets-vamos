'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { ChevronDown, LogOut, Share2, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/Toast';
import { getInviteUrl } from '@/lib/dashboard-utils';
import type { Group } from '@/lib/db';
import { getErrorMessage, handleAsync } from '@/lib/error-handler';

interface NavbarProps {
  currentGroupId?: string;
}

export default function Navbar({ currentGroupId }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const loadedUserIdRef = useRef<string>('');

  const currentGroupIdRef = useRef<string | undefined>(currentGroupId);
  const loadedGroupsRef = useRef<Group[]>([]);

  useEffect(() => {
    currentGroupIdRef.current = currentGroupId;
  }, [currentGroupId]);

  useEffect(() => {
    if (!userLoaded || !user) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous loads
    if (loadingRef.current) return;

    // Check if we've already loaded groups for this user
    if (loadedUserIdRef.current === user.id) {
      // Still check if we need to load current group
      if (currentGroupId && !currentGroup) {
        const loadCurrentGroup = async () => {
          const { data: directGroup } = await handleAsync(async () => {
            const res = await fetch(`/api/groups/${currentGroupId}`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.group;
          }, 'loadCurrentGroup');
          if (directGroup) {
            setCurrentGroup(directGroup);
            // Add it to the groups list if not already there
            const existingGroups = loadedGroupsRef.current;
            if (
              !existingGroups.find(
                (g) =>
                  (g._id?.toString() || g._id) === (directGroup._id?.toString() || directGroup._id)
              )
            ) {
              const updatedGroups = [...existingGroups, directGroup];
              loadedGroupsRef.current = updatedGroups;
              setGroups(updatedGroups);
            }
          }
        };
        loadCurrentGroup();
      }
      setLoading(false);
      return;
    }

    const loadGroups = async () => {
      loadingRef.current = true;
      setLoading(true);
      const { data: loadedGroups, error } = await handleAsync(async () => {
        // Fetch all groups for the user
        const res = await fetch('/api/groups');
        if (!res.ok) {
          throw new Error('Failed to fetch groups');
        }
        const data = await res.json();
        return data.groups || [];
      }, 'loadGroups');

      if (error) {
        toast.error(getErrorMessage(error));
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      if (loadedGroups) {
        loadedGroupsRef.current = loadedGroups;
        setGroups(loadedGroups);
        loadedUserIdRef.current = user.id;

        const currentId = currentGroupIdRef.current;
        if (currentId) {
          const found = loadedGroups.find((g: Group) => (g._id?.toString() || g._id) === currentId);
          if (found) {
            setCurrentGroup(found);
          } else {
            // If group not found in list, fetch it directly (e.g., just created)
            const { data: directGroup } = await handleAsync(async () => {
              const res = await fetch(`/api/groups/${currentId}`);
              if (!res.ok) return null;
              const data = await res.json();
              return data.group;
            }, 'loadCurrentGroup');
            if (directGroup) {
              setCurrentGroup(directGroup);
              // Add it to the groups list if not already there
              if (
                !loadedGroups.find(
                  (g: Group) =>
                    (g._id?.toString() || g._id) ===
                    (directGroup._id?.toString() || directGroup._id)
                )
              ) {
                const updatedGroups = [...loadedGroups, directGroup];
                loadedGroupsRef.current = updatedGroups;
                setGroups(updatedGroups);
              }
            }
          }
        }
      }
      setLoading(false);
      loadingRef.current = false;
    };

    loadGroups();
  }, [userLoaded, user, currentGroupId, toast, currentGroup]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGroupDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showGroupDropdown || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showGroupDropdown, showUserDropdown]);

  const handleGroupChange = (groupId: string) => {
    setShowGroupDropdown(false);
    // Navigate to the same page type but with new group ID
    if (pathname.includes('/dashboard/')) {
      router.push(`/dashboard/${groupId}`);
    } else if (pathname.includes('/edit-plan/')) {
      router.push(`/edit-plan/${groupId}`);
    } else if (pathname.includes('/setup-plan/')) {
      router.push(`/setup-plan/${groupId}`);
    } else {
      router.push(`/dashboard/${groupId}`);
    }
  };

  const handleShare = async () => {
    if (!currentGroup) return;

    const inviteUrl = getInviteUrl(currentGroup);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${currentGroup.name} on Let's Vamos`,
          text: `Join my training group "${currentGroup.name}"!`,
          url: inviteUrl,
        });
        toast.success('Link shared!');
      } catch (error) {
        // User cancelled or error
        if (error instanceof Error && error.name !== 'AbortError') {
          copyToClipboard(inviteUrl);
        }
      }
    } else {
      copyToClipboard(inviteUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Invite link copied to clipboard!');
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    try {
      await signOut();
      // After sign out, redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Logo/Home - Hidden on mobile */}
          <div className="hidden md:flex items-center flex-shrink-0">
            <button
              onClick={() => router.push('/')}
              className="text-lg sm:text-xl font-bold text-primary hover:text-primary-dark transition-colors"
              type="button"
            >
              Let's Vamos
            </button>
          </div>

          {/* Center: Group Selector - Hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex flex-1 items-center justify-center max-w-md mx-4">
            {loading ? (
              <div className="text-xs sm:text-sm text-gray-400">Loading...</div>
            ) : currentGroup || groups.length > 0 ? (
              <div className="relative w-full" ref={dropdownRef}>
                <button
                  onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border-2 border-gray-200 rounded-full hover:border-primary transition-colors"
                  aria-label="Select group"
                  type="button"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {currentGroup?.emoji && (
                      <span className="text-base sm:text-lg flex-shrink-0">
                        {currentGroup.emoji}
                      </span>
                    )}
                    <span className="font-semibold text-xs sm:text-sm truncate">
                      {currentGroup?.name || 'Select a group'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {showGroupDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                    {groups.map((group) => {
                      const groupId = group._id?.toString() || group._id;
                      return (
                        <button
                          key={groupId}
                          onClick={() => handleGroupChange(groupId)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            groupId === currentGroupId
                              ? 'bg-primary/5 border-l-4 border-primary'
                              : ''
                          }`}
                          type="button"
                        >
                          {group.emoji && <span className="text-lg">{group.emoji}</span>}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{group.name}</div>
                            <div className="text-xs text-gray-500 truncate">{group.goalType}</div>
                          </div>
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowGroupDropdown(false);
                          router.push('/create-group');
                        }}
                        className="w-full px-4 py-3 text-left text-primary hover:bg-gray-50 font-medium text-sm"
                        type="button"
                      >
                        + Create New Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/create-group')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-primary hover:text-primary-dark"
                type="button"
              >
                Create Your First Group
              </button>
            )}
          </div>

          {/* Mobile: Group Selector Button - Shows on mobile only, positioned on left */}
          <div className="md:hidden flex items-center justify-start flex-1 min-w-0">
            {loading ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : currentGroup || groups.length > 0 ? (
              <div className="relative max-w-[180px] w-full" ref={dropdownRef}>
                <button
                  onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                  className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 border-2 border-gray-200 rounded-full hover:border-primary transition-colors"
                  aria-label="Select group"
                  type="button"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {currentGroup?.emoji && (
                      <span className="text-sm flex-shrink-0">{currentGroup.emoji}</span>
                    )}
                    <span className="font-semibold text-xs truncate">
                      {currentGroup?.name || 'Select'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {showGroupDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                    {groups.map((group) => {
                      const groupId = group._id?.toString() || group._id;
                      return (
                        <button
                          key={groupId}
                          onClick={() => handleGroupChange(groupId)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                            groupId === currentGroupId
                              ? 'bg-primary/5 border-l-4 border-primary'
                              : ''
                          }`}
                          type="button"
                        >
                          {group.emoji && <span className="text-base">{group.emoji}</span>}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate">{group.name}</div>
                            <div className="text-[10px] text-gray-500 truncate">
                              {group.goalType}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowGroupDropdown(false);
                          router.push('/create-group');
                        }}
                        className="w-full px-3 py-2.5 text-left text-primary hover:bg-gray-50 font-medium text-xs"
                        type="button"
                      >
                        + Create New Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/create-group')}
                className="px-2 py-1.5 text-xs font-medium text-primary hover:text-primary-dark"
                type="button"
              >
                Create Group
              </button>
            )}
          </div>

          {/* Right: Share & User */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {currentGroup && (
              <button
                onClick={handleShare}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition-colors"
                aria-label="Share group"
                title="Share invite link"
                type="button"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-full hover:bg-gray-50 transition-colors"
                aria-label="User menu"
                type="button"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 hidden lg:block max-w-[120px] truncate">
                  {user.primaryEmailAddress?.emailAddress.split('@')[0] || 'User'}
                </span>
                <ChevronDown
                  className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hidden lg:block transition-transform ${showUserDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="text-xs text-gray-500">Logged in as</div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.primaryEmailAddress?.emailAddress || 'User'}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors font-medium text-sm rounded-b-xl"
                    type="button"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
