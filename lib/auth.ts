// Simple mock authentication for prototyping
// In production, this would use a real auth service

export interface AuthUser {
  id: string
  email: string
}

const AUTH_STORAGE_KEY = 'traintogether-auth'

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function setCurrentUser(user: AuthUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

export function clearCurrentUser(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

// Mock magic link - just sets the user immediately
export async function sendMagicLink(email: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // For prototyping, we just create a user immediately
  const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  setCurrentUser({ id: userId, email })
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

// Quick test login for prototyping - no password needed
export function quickTestLogin(email: string = 'test@example.com'): void {
  const userId = `user-test-${email.replace('@', '-at-')}`
  setCurrentUser({ id: userId, email })
}
