'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getGroup, getMembersByGroup, getWorkoutsByGroup, createWorkout, updateWorkout, deleteWorkout } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { Group, Member, Workout } from '@/lib/db'
import LogWorkoutModal from '@/components/LogWorkoutModal'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DashboardPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [showLogModal, setShowLogModal] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)

  useEffect(() => {
    loadData()
  }, [groupId])

  const loadData = async () => {
    const [loadedGroup, loadedMembers, loadedWorkouts] = await Promise.all([
      getGroup(groupId),
      getMembersByGroup(groupId),
      getWorkoutsByGroup(groupId),
    ])

    if (!loadedGroup) {
      router.push('/')
      return
    }

    setGroup(loadedGroup)
    setMembers(loadedMembers)
    setWorkouts(loadedWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  const handleLogWorkout = () => {
    setEditingWorkout(null)
    setShowLogModal(true)
  }

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout)
    setShowLogModal(true)
  }

  const handleSaveWorkout = async (workoutData: Omit<Workout, 'id' | 'createdAt'>) => {
    const user = getCurrentUser()
    if (!user) return

    let member = members.find(m => m.email === user.email)
    if (!member) {
      // This shouldn't happen, but handle gracefully
      return
    }

    if (editingWorkout) {
      const updated: Workout = {
        ...editingWorkout,
        ...workoutData,
      }
      await updateWorkout(updated)
    } else {
      const newWorkout: Workout = {
        id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...workoutData,
        createdAt: new Date().toISOString(),
      }
      await createWorkout(newWorkout)
    }

    setShowLogModal(false)
    setEditingWorkout(null)
    await loadData()
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      await deleteWorkout(workoutId)
      await loadData()
    }
  }

  const getDaysUntilGoal = () => {
    if (!group) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const goalDate = new Date(group.goalDate)
    goalDate.setHours(0, 0, 0, 0)
    const diff = goalDate.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getCurrentWeekPlan = () => {
    if (!group || !group.trainingPlan) return {}
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    
    const plan: Record<string, string[]> = {}
    DAYS.forEach((day, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const dateKey = date.toISOString().split('T')[0]
      plan[day] = group.trainingPlan[day] || []
    })
    return plan
  }

  const getRecentWorkouts = () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return workouts.filter(w => new Date(w.date) >= sevenDaysAgo)
  }

  const getWorkoutsByMemberId = (memberId: string) => {
    return getRecentWorkouts().filter(w => w.memberId === memberId)
  }

  // Calculate weekly plan progress for each member
  const getWeeklyPlanProgress = (memberId: string) => {
    if (!group || !group.trainingPlan) return { completed: 0, total: 0, percentage: 0 }
    
    const weekPlan = getCurrentWeekPlan()
    const memberWorkouts = getWorkoutsByMemberId(memberId)
    
    // Count total planned workouts for the week
    let totalPlanned = 0
    Object.values(weekPlan).forEach(dayWorkouts => {
      totalPlanned += dayWorkouts.length
    })
    
    if (totalPlanned === 0) return { completed: 0, total: 0, percentage: 0 }
    
    // Count completed workouts (matching planned workouts)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    
    let completed = 0
    DAYS.forEach((day, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const dateKey = date.toISOString().split('T')[0]
      
      // Check if member has logged a workout on this day
      const hasWorkout = memberWorkouts.some(w => {
        const workoutDate = new Date(w.date).toISOString().split('T')[0]
        return workoutDate === dateKey
      })
      
      // If there's a planned workout for this day, check if it's completed
      if (weekPlan[day] && weekPlan[day].length > 0) {
        if (hasWorkout) {
          completed += weekPlan[day].length
        }
      }
    })
    
    const percentage = totalPlanned > 0 ? Math.round((completed / totalPlanned) * 100) : 0
    
    return { completed, total: totalPlanned, percentage }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getInviteUrl = () => {
    if (!group) return ''
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.inviteCode}`
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const daysUntil = getDaysUntilGoal()
  const weekPlan = getCurrentWeekPlan()
  const recentWorkouts = getRecentWorkouts()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h1 className="heading-lg text-black tracking-tight">{group.name}</h1>
            <button
              onClick={handleLogWorkout}
              className="btn-primary text-base"
            >
              + Log Workout
            </button>
          </div>

          {/* Countdown */}
          <div className="text-center py-8 bg-primary text-white rounded-2xl shadow-lg border-0">
            <div className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">
              {daysUntil}
            </div>
            <div className="text-xl md:text-2xl font-bold text-white mb-2">
              {daysUntil === 1 ? 'day' : 'days'} until {group.goalType}
            </div>
            <div className="text-white/80 body-md">
              {new Date(group.goalDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Weekly Plan Progress Chart */}
        {members.length > 0 && (
          <div className="card-modern mb-6">
            <h2 className="heading-md text-black mb-6 tracking-tight">Weekly Plan Progress</h2>
            <div className="space-y-6">
              {members.map((member) => {
                const progress = getWeeklyPlanProgress(member.id)
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-black">{member.displayName}</span>
                      <span className="text-sm font-medium text-gray-600">
                        {progress.completed}/{progress.total} workouts
                        {progress.total > 0 && (
                          <span className="ml-2 text-primary font-bold">{progress.percentage}%</span>
                        )}
                      </span>
                    </div>
                    {progress.total > 0 ? (
                      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
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
                      </div>
                    ) : (
                      <div className="text-gray-400 body-sm">No workouts planned for this week</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* This Week's Plan */}
          <div className="card-modern">
            <h2 className="heading-md text-black mb-6 tracking-tight">This Week's Plan</h2>
            <div className="space-y-2">
              {DAYS.map((day, index) => {
                const workouts = weekPlan[day] || []
                const today = new Date()
                const dayOfWeek = today.getDay()
                const isToday = index === (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
                
                return (
                  <div
                    key={day}
                    className={`p-4 rounded-xl transition-all ${isToday ? 'bg-primary text-white border-2 border-primary' : 'bg-gray-50 border-2 border-gray-100 hover:border-primary/20'}`}
                  >
                    <div className="font-bold text-sm mb-2 tracking-wide">{day}</div>
                    {workouts.length > 0 ? (
                      <div className={`body-sm ${isToday ? 'text-gray-200' : 'text-gray-700'}`}>
                        {workouts.map((workout, i) => (
                          <div key={i} className="mb-1">{workout}</div>
                        ))}
                      </div>
                    ) : (
                      <div className={`body-sm ${isToday ? 'text-gray-300' : 'text-gray-400'}`}>No workouts planned</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-modern">
            <h2 className="heading-md text-black mb-6 tracking-tight">Recent Activity</h2>
            <div className="space-y-6">
              {members.length === 0 ? (
                <div className="text-gray-500 body-md text-center py-12">
                  No members yet. Share the invite link to get started!
                </div>
              ) : (
                <div className="space-y-6">
                  {members.map((member) => {
                    const memberWorkouts = getWorkoutsByMemberId(member.id)
                    return (
                      <div key={member.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                        <div className="font-bold text-black mb-4 text-lg">
                          {member.displayName}
                        </div>
                        {memberWorkouts.length > 0 ? (
                          <div className="space-y-3">
                            {memberWorkouts.map((workout) => (
                              <div
                                key={workout.id}
                                className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                              >
                                <div className="flex-1">
                                  <div className="text-black body-sm font-medium mb-1">
                                    <span className="text-success mr-2">✓</span>
                                    {formatDate(workout.date)}: {workout.type}
                                    {workout.distance && `, ${workout.distance}km`}
                                    {workout.duration && `, ${workout.duration} min`}
                                  </div>
                                  {workout.notes && (
                                    <div className="text-gray-500 body-xs mt-1">{workout.notes}</div>
                                  )}
                                </div>
                                <div className="flex gap-3 ml-4">
                                  <button
                                    onClick={() => handleEditWorkout(workout)}
                                    className="text-primary hover:text-primary-dark text-xs font-medium transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteWorkout(workout.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 body-sm">
                            No workouts logged this week
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invite Link */}
        <div className="card-modern">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-black mb-2 text-lg">Invite More People</h3>
              <p className="text-gray-600 body-sm">Share this link with your training crew</p>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={getInviteUrl()}
                readOnly
                className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-full bg-gray-50 text-sm font-medium focus:outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getInviteUrl())
                  // You could add a toast notification here
                }}
                className="btn-primary whitespace-nowrap text-base"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLogModal && (
        <LogWorkoutModal
          groupId={groupId}
          members={members}
          workout={editingWorkout}
          onSave={handleSaveWorkout}
          onClose={() => {
            setShowLogModal(false)
            setEditingWorkout(null)
          }}
        />
      )}
    </div>
  )
}
