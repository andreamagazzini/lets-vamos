'use client'

import { useState, useEffect } from 'react'
import type { Workout, Member } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const WORKOUT_TYPES = ['Run', 'Bike', 'Swim', 'Strength', 'Other']

interface LogWorkoutModalProps {
  groupId: string
  members: Member[]
  workout?: Workout | null
  onSave: (workout: Omit<Workout, 'id' | 'createdAt'>) => void
  onClose: () => void
}

export default function LogWorkoutModal({
  groupId,
  members,
  workout,
  onSave,
  onClose,
}: LogWorkoutModalProps) {
  const user = getCurrentUser()
  const currentMember = members.find(m => m.email === user?.email)
  
  const [type, setType] = useState('Run')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (workout) {
      setType(workout.type)
      setDuration(workout.duration?.toString() || '')
      setDistance(workout.distance?.toString() || '')
      setNotes(workout.notes || '')
      setDate(workout.date)
    } else {
      const today = new Date().toISOString().split('T')[0]
      setDate(today)
    }
  }, [workout])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!type) {
      newErrors.type = 'Workout type is required'
    }

    if (!duration && !distance) {
      newErrors.duration = 'At least one of duration or distance is required'
      newErrors.distance = 'At least one of duration or distance is required'
    }

    if (!date) {
      newErrors.date = 'Date is required'
    } else {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (!currentMember) {
      alert('You must be a member of this group to log workouts')
      return
    }

    const workoutData: Omit<Workout, 'id' | 'createdAt'> = {
      groupId,
      memberId: currentMember.id,
      type,
      duration: duration ? parseInt(duration) : undefined,
      distance: distance ? parseFloat(distance) : undefined,
      notes: notes.trim() || undefined,
      date,
    }

    onSave(workoutData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h2 className="heading-md text-black tracking-tight">Log Workout</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black text-3xl font-light transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-black mb-3">
              Workout Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors bg-white"
            >
              {WORKOUT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.type}</p>
            )}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-semibold text-black mb-3">
              Duration (minutes) - Optional
            </label>
            <input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
              placeholder="28"
            />
            {errors.duration && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.duration}</p>
            )}
          </div>

          <div>
            <label htmlFor="distance" className="block text-sm font-semibold text-black mb-3">
              Distance (km) - Optional
            </label>
            <input
              id="distance"
              type="number"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
              placeholder="5.2"
            />
            {errors.distance && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.distance}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-black mb-3">
              Notes - Optional
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Felt great, good pace"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-black mb-3">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
            />
            {errors.date && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.date}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full text-lg"
          >
            {workout ? 'Update Workout' : 'Log Workout'}
          </button>
        </form>
      </div>
    </div>
  )
}
