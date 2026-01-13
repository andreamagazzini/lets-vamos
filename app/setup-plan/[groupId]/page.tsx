'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getGroup, createGroup } from '@/lib/db'
import type { Group, WeeklyPlan } from '@/lib/db'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export default function SetupPlanPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string
  const [group, setGroup] = useState<Group | null>(null)
  const [trainingPlan, setTrainingPlan] = useState<WeeklyPlan>({})
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [workoutInput, setWorkoutInput] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    loadGroup()
  }, [groupId])

  const loadGroup = async () => {
    const loadedGroup = await getGroup(groupId)
    if (!loadedGroup) {
      router.push('/')
      return
    }
    setGroup(loadedGroup)
    setTrainingPlan(loadedGroup.trainingPlan || {})
  }

  const handleAddWorkout = (day: string) => {
    setEditingDay(day)
    setWorkoutInput('')
  }

  const handleSaveWorkout = () => {
    if (!workoutInput.trim() || !editingDay) return

    const day = editingDay
    const newPlan = { ...trainingPlan }
    if (!newPlan[day]) {
      newPlan[day] = []
    }
    newPlan[day] = [...newPlan[day], workoutInput.trim()]
    setTrainingPlan(newPlan)
    setWorkoutInput('')
    setEditingDay(null)
  }

  const handleDeleteWorkout = (day: string, index: number) => {
    const newPlan = { ...trainingPlan }
    if (newPlan[day]) {
      newPlan[day] = newPlan[day].filter((_, i) => i !== index)
      if (newPlan[day].length === 0) {
        delete newPlan[day]
      }
      setTrainingPlan(newPlan)
    }
  }

  const handleDone = async () => {
    if (!group) return

    const updatedGroup: Group = {
      ...group,
      trainingPlan,
    }

    await createGroup(updatedGroup)
    setShowInviteModal(true)
  }

  const handleGoToDashboard = () => {
    router.push(`/dashboard/${groupId}`)
  }

  const handleCopyLink = () => {
    if (!group) return
    const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`
    navigator.clipboard.writeText(inviteUrl)
    // You could add a toast notification here
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="heading-lg text-gray-900 mb-6">Set Up Your Weekly Training Plan</h1>

        <div className="space-y-6">
          {DAYS.map((day) => (
            <div key={day} className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="heading-sm text-gray-900">{day}</h3>
                {editingDay !== day && (
                  <button
                    onClick={() => handleAddWorkout(day)}
                    className="text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    + Add workout
                  </button>
                )}
              </div>

              {editingDay === day && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={workoutInput}
                    onChange={(e) => setWorkoutInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveWorkout()}
                    placeholder="e.g., 5K easy run"
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveWorkout}
                    className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setEditingDay(null)
                      setWorkoutInput('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ×
                  </button>
                </div>
              )}

              {trainingPlan[day] && trainingPlan[day].length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {trainingPlan[day].map((workout, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
                    >
                      <span>{workout}</span>
                      <button
                        onClick={() => handleDeleteWorkout(day, index)}
                        className="text-primary hover:text-primary-dark"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={handleDone}
            className="btn-primary w-full text-lg"
          >
            Done →
          </button>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <h2 className="heading-md text-gray-900 mb-4">✓ Group Created!</h2>
            <p className="body-md text-gray-700 mb-4">
              Invite your crew with this link:
            </p>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.inviteCode}`}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
            <button
              onClick={handleGoToDashboard}
              className="btn-primary w-full text-lg"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
