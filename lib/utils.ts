/**
 * Client-safe utility functions
 * These can be used in both client and server components
 */

/**
 * Generate a random invite code
 */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Get display name from member
 * displayName is always required in the schema, so this is just a type-safe getter
 */
export function getMemberDisplayName(member: { displayName: string }): string {
  return member.displayName;
}
