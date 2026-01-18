'use client';

import { useUser } from '@clerk/nextjs';
import { ArrowRight, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import Navbar from '@/components/Navbar';
import type { Group } from '@/lib/db';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const [, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoaded || !user) {
      if (userLoaded && !user) {
        router.push('/');
      }
      return;
    }

    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/groups');
        if (res.ok) {
          const data = await res.json();
          const userGroups = data.groups || [];
          setGroups(userGroups);

          // If user has groups, redirect to the first one
          if (userGroups.length > 0) {
            const firstGroup = userGroups[0];
            const groupId = firstGroup._id?.toString() || firstGroup._id || firstGroup.id;
            if (groupId) {
              router.replace(`/dashboard/${groupId}`);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user, userLoaded, router]);

  if (!userLoaded || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show create group button if no groups
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-24 h-24 rounded-full bg-[#02182c] text-[#fcfcfa] flex items-center justify-center mb-6">
            <Users className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-extrabold text-[#02182c] mb-4">No Groups Yet</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-md">
            Create your first training group to start tracking workouts with your crew
          </p>
          <button
            type="button"
            onClick={() => router.push('/create-group')}
            className="group bg-[#02182c] text-[#fcfcfa] px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-[#010f1a] hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
          >
            Create Your First Group
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
