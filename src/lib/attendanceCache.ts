const CACHE_PREFIX = 'chamabondo:attendance-cache:v1:'

export interface AttendanceCacheEntry<T> {
  data: T
  savedAt: number
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function attendanceCacheKey(parts: Array<string | number | null | undefined>): string {
  return `${CACHE_PREFIX}${parts
    .map((part) => (part === null || part === undefined ? '' : String(part)))
    .join('|')}`
}

export function readAttendanceCache<T>(
  key: string,
): AttendanceCacheEntry<T> | null {
  const store = storage()
  if (!store) return null

  try {
    const raw = store.getItem(key)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const entry = parsed as { data?: unknown; savedAt?: unknown }
    if (!('data' in entry) || typeof entry.savedAt !== 'number') return null

    return { data: entry.data as T, savedAt: entry.savedAt }
  } catch {
    return null
  }
}

export function writeAttendanceCache<T>(key: string, data: T): void {
  const store = storage()
  if (!store) return

  try {
    store.setItem(
      key,
      JSON.stringify({ data, savedAt: Date.now() } satisfies AttendanceCacheEntry<T>),
    )
  } catch {
    // Cache writes are best effort; storage may be full or blocked.
  }
}

export function formatCacheTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
