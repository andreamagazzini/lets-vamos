// Debug utility to check IndexedDB status
export async function checkIndexedDBAvailability(): Promise<{
  available: boolean
  error?: string
  details?: any
}> {
  if (typeof window === 'undefined') {
    return { available: false, error: 'Not in browser environment' }
  }

  if (!window.indexedDB) {
    return { available: false, error: 'IndexedDB not supported' }
  }

  try {
    const db = await import('./db').then(m => m.getDB())
    return { available: true, details: { dbName: 'traintogether-db' } }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    }
  }
}

// Utility to list all groups (for debugging)
export async function listAllGroups() {
  try {
    const { getDB } = await import('./db')
    const db = await getDB()
    const groups = await db.getAll('groups')
    console.log('All groups in IndexedDB:', groups)
    return groups
  } catch (error) {
    console.error('Error listing groups:', error)
    return []
  }
}
