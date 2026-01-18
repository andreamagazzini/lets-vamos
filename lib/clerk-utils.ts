'use server';

import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Server-only Clerk utility functions
 * These functions can only be used in Server Components or API routes
 */

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

/**
 * Get the current user's ID
 * Returns null if not authenticated
 */
export async function getCurrentUserId() {
  const { userId } = await auth();
  return userId;
}
