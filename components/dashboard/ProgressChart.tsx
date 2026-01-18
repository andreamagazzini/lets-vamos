'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { getWeeklyPlanProgress } from '@/lib/dashboard-utils';
import type { Group, Member, Workout } from '@/lib/db';
import { getMemberDisplayName } from '@/lib/utils';

interface ProgressChartProps {
  group: Group;
  members: Member[];
  workouts: Workout[];
}

interface BreakdownModalProps {
  member: Member;
  breakdown: Record<string, { planned: number; logged: number; unit: string }>;
  onClose: () => void;
}

function BreakdownModal({ member, breakdown, onClose }: BreakdownModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="modal-title" className="heading-md text-black tracking-tight">
            {getMemberDisplayName(member)}'s Weekly Breakdown
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(breakdown).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No breakdown data available</p>
          ) : (
            Object.entries(breakdown).map(([type, data]) => {
              const typePercentage =
                data.planned > 0 ? Math.round((data.logged / data.planned) * 100) : 0;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-black">{type}</span>
                    <span className="text-sm text-gray-600">
                      {Math.round(data.logged)}/{Math.round(data.planned)} {data.unit}
                      {data.planned > 0 && (
                        <span className="ml-2 text-primary font-bold">{typePercentage}%</span>
                      )}
                    </span>
                  </div>
                  {data.planned > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          typePercentage === 100
                            ? 'bg-success'
                            : typePercentage >= 70
                              ? 'bg-accent'
                              : typePercentage >= 40
                                ? 'bg-warning'
                                : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(typePercentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProgressChart({ group, members, workouts }: ProgressChartProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Record<
    string,
    { planned: number; logged: number; unit: string }
  > | null>(null);

  if (members.length === 0) return null;

  const handleMemberClick = (member: Member) => {
    const progress = getWeeklyPlanProgress(group, member.userId, workouts);
    if (progress.breakdown && Object.keys(progress.breakdown).length > 0) {
      setSelectedMember(member);
      setSelectedBreakdown(progress.breakdown);
    }
  };

  return (
    <>
      <div className="card-modern mb-6">
        <h2 className="heading-md text-black mb-6 tracking-tight">Weekly Plan Progress</h2>
        <div className="space-y-6">
          {members.map((member) => {
            const progress = getWeeklyPlanProgress(group, member.userId, workouts);
            const hasBreakdown = progress.breakdown && Object.keys(progress.breakdown).length > 0;
            return (
              <div key={member.userId} className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => hasBreakdown && handleMemberClick(member)}
                    className={`font-semibold text-black ${hasBreakdown ? 'hover:text-primary cursor-pointer transition-colors' : ''}`}
                  >
                    {getMemberDisplayName(member)}
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                    {progress.completed}/{progress.total}
                    {progress.total > 0 && (
                      <span className="ml-2 text-primary font-bold">{progress.percentage}%</span>
                    )}
                  </span>
                </div>
                {progress.total > 0 ? (
                  <button
                    type="button"
                    onClick={() => hasBreakdown && handleMemberClick(member)}
                    className={`w-full bg-gray-100 rounded-full h-4 overflow-hidden ${hasBreakdown ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    disabled={!hasBreakdown}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress.percentage === 100
                          ? 'bg-success'
                          : progress.percentage >= 70
                            ? 'bg-accent'
                            : progress.percentage >= 40
                              ? 'bg-warning'
                              : 'bg-red-400'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </button>
                ) : (
                  <div className="text-gray-400 body-sm">No workouts planned for this week</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedMember && selectedBreakdown && (
        <BreakdownModal
          member={selectedMember}
          breakdown={selectedBreakdown}
          onClose={() => {
            setSelectedMember(null);
            setSelectedBreakdown(null);
          }}
        />
      )}
    </>
  );
}
