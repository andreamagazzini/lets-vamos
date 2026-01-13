'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { quickTestLogin, isAuthenticated, getCurrentUser } from '@/lib/auth'
import { getGroupsByUserEmail } from '@/lib/db'

export default function Home() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    if (isAuthenticated()) {
      setCurrentUser(getCurrentUser())
    }
  }, [])

  const handleCreateGroup = () => {
    router.push('/create-group')
  }

  const handleJoinGroup = () => {
    if (inviteCode.trim()) {
      router.push(`/join/${inviteCode.trim()}`)
    } else {
      router.push('/join')
    }
  }

  const handleQuickLogin = async (email: string) => {
    quickTestLogin(email)
    setCurrentUser({ email })
    
    // Check if user has any groups and redirect to dashboard
    try {
      const groups = await getGroupsByUserEmail(email)
      if (groups.length > 0) {
        // Redirect to the first group's dashboard
        router.push(`/dashboard/${groups[0].id}`)
      } else {
        // No groups, redirect to create group page
        router.push('/create-group')
      }
    } catch (error) {
      console.error('Error checking user groups:', error)
      // On error, still redirect to create group
      router.push('/create-group')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Let's Vamos"
              width={300}
              height={150}
              priority
              className="object-contain"
            />
          </div>
          <p className="body-lg text-gray-600 max-w-md mx-auto">
            Stay accountable with your training crew. Track workouts, share progress, and achieve your goals together.
          </p>
        </div>

        <div className="card-modern space-y-6">
          <button
            onClick={handleCreateGroup}
            className="btn-primary w-full text-lg"
          >
            Create Group
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400 font-medium">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary focus:ring-0 transition-colors text-center font-semibold tracking-wider"
            />
            <button
              onClick={handleJoinGroup}
              className="btn-secondary w-full text-lg"
            >
              Join with Invite Link
            </button>
          </div>

          {/* Quick Test Login for Prototyping */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-4 text-center font-medium uppercase tracking-wider">Quick Test Login</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickLogin('test1@example.com')}
                className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-200 text-sm font-medium border border-gray-200 hover:border-gray-300"
              >
                Test User 1
              </button>
              <button
                onClick={() => handleQuickLogin('test2@example.com')}
                className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-200 text-sm font-medium border border-gray-200 hover:border-gray-300"
              >
                Test User 2
              </button>
            </div>
            {currentUser && (
              <p className="text-xs text-success mt-3 text-center font-medium">
                ✓ Logged in as {currentUser.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
