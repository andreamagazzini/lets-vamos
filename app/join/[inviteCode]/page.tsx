'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getGroupByInviteCode, getMembersByGroup, createMember } from '@/lib/db'
import { sendMagicLink, getCurrentUser, isAuthenticated } from '@/lib/auth'
import { getUserByEmail, createUser } from '@/lib/db'
import { generateId } from '@/lib/db'
import type { Group } from '@/lib/db'

export default function JoinGroupPage() {
  const router = useRouter()
  const params = useParams()
  const inviteCode = params.inviteCode as string
  const [group, setGroup] = useState<Group | null>(null)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadGroup()
    if (isAuthenticated()) {
      setShowEmailForm(false)
      const user = getCurrentUser()
      if (user) setEmail(user.email)
    }
  }, [inviteCode])

  const loadGroup = async () => {
    const loadedGroup = await getGroupByInviteCode(inviteCode)
    if (!loadedGroup) {
      setErrors({ group: 'Invalid invite code. Please check the link and try again.' })
      return
    }
    setGroup(loadedGroup)
  }

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

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setErrors({ displayName: 'Display name is required' })
      return
    }

    if (!group) {
      setErrors({ group: 'Group not found' })
      return
    }

    setLoading(true)
    try {
      const user = getCurrentUser()
      if (!user) {
        router.push('/')
        return
      }

      // Check if user is already a member
      const existingMembers = await getMembersByGroup(group.id)
      const isAlreadyMember = existingMembers.some(m => m.email === user.email)

      if (isAlreadyMember) {
        router.push(`/dashboard/${group.id}`)
        return
      }

      const memberId = generateId()
      await createMember({
        id: memberId,
        groupId: group.id,
        email: user.email,
        displayName: displayName.trim(),
        joinedAt: new Date().toISOString(),
      })

      router.push(`/dashboard/${group.id}`)
    } catch (error) {
      setErrors({ form: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!group && !errors.group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (errors.group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-lg card-modern animate-fade-in">
          <h1 className="heading-lg text-black mb-4 tracking-tight">Invalid Invite Link</h1>
          <p className="text-gray-600 mb-6 body-md">{errors.group}</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary w-full text-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  if (showEmailForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-lg card-modern animate-fade-in">
          <h1 className="heading-lg text-black mb-2 tracking-tight">Join {group?.name}</h1>
          <p className="text-gray-600 body-md mb-6">
            Enter your email to join this training group
          </p>
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
              />
              {errors.displayName && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.displayName}</p>
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
  )
}
