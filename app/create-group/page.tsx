'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { sendMagicLink, getCurrentUser, isAuthenticated } from '@/lib/auth'
import { createGroup, generateId, generateInviteCode, createUser, getUserByEmail, createMember, getDB } from '@/lib/db'
import type { Group } from '@/lib/db'

const GOAL_TYPES = [
  'Marathon',
  'Half-Marathon',
  'Hyrox',
  'Triathlon',
  'Cycling',
  'Other',
]

export default function CreateGroupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(true)
  const [groupName, setGroupName] = useState('')
  const [goalType, setGoalType] = useState('Marathon')
  const [customGoalType, setCustomGoalType] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<string>('')

  useEffect(() => {
    // Test IndexedDB on mount
    const testDB = async () => {
      try {
        await getDB()
        setDbStatus('✓ IndexedDB is ready')
      } catch (error) {
        setDbStatus(`✗ IndexedDB error: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }
    testDB()
  }, [])

  useEffect(() => {
    if (isAuthenticated()) {
      setShowEmailForm(false)
      const user = getCurrentUser()
      if (user) setEmail(user.email)
    }
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    setLoading(true)
    try {
      let user = await getUserByEmail(email)
      if (!user) {
        const userId = generateId()
        user = { id: userId, email, createdAt: new Date().toISOString() }
        await createUser(user)
      }
      await sendMagicLink(email)
      setShowEmailForm(false)
      setErrors({})
    } catch (error) {
      setErrors({ email: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!groupName.trim()) {
      newErrors.groupName = 'Group name is required'
    }

    const finalGoalType = goalType === 'Other' ? customGoalType : goalType
    if (!finalGoalType.trim()) {
      newErrors.goalType = 'Goal type is required'
    }

    if (!goalDate) {
      newErrors.goalDate = 'Event date is required'
    } else {
      const selectedDate = new Date(goalDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate <= today) {
        newErrors.goalDate = 'Event date must be in the future'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const user = getCurrentUser()
      if (!user) {
        router.push('/')
        return
      }

      const groupId = generateId()
      const group: Group = {
        id: groupId,
        name: groupName.trim(),
        goalType: finalGoalType,
        goalDate,
        createdAt: new Date().toISOString(),
        inviteCode: generateInviteCode(),
        trainingPlan: {},
      }

      // Create the group in IndexedDB
      await createGroup(group)
      
      // Also create the creator as a member
      const memberId = generateId()
      await createMember({
        id: memberId,
        groupId: groupId,
        email: user.email,
        displayName: user.email.split('@')[0], // Use email prefix as default display name
        joinedAt: new Date().toISOString(),
      })

      router.push(`/setup-plan/${groupId}`)
    } catch (error) {
      console.error('Error creating group:', error)
      setErrors({ form: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setLoading(false)
    }
  }

  if (showEmailForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-lg card-modern animate-fade-in">
          <h1 className="heading-lg text-black mb-8 tracking-tight">Create Your Training Group</h1>
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-black mb-3">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.email}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Continue →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-lg card-modern animate-fade-in">
        <h1 className="heading-lg text-black mb-8 tracking-tight">Create Your Training Group</h1>
        {dbStatus && (
          <div className={`mb-4 p-2 rounded text-xs ${dbStatus.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {dbStatus}
          </div>
        )}
        <form onSubmit={handleCreateGroup} className="space-y-6">
          <div>
            <label htmlFor="groupName" className="block text-sm font-semibold text-black mb-3">
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g., Marathon Crew 2025"
            />
            {errors.groupName && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.groupName}</p>
            )}
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
            <input
              id="goalDate"
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors"
            />
            {errors.goalDate && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.goalDate}</p>
            )}
          </div>

          {errors.form && (
            <div className="p-5 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-semibold mb-2">{errors.form}</p>
              <p className="text-xs text-red-500">
                Check the browser console for more details. Make sure IndexedDB is enabled in your browser.
              </p>
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
  )
}
