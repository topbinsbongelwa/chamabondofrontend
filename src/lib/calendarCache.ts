import type { CalendarItem } from './calendar'

const CACHE_PREFIX = 'chamabondo:calendar-cache:v1:'

export const CALENDAR_CACHE_KEY = `${CACHE_PREFIX}items`

export function upcomingCacheKey(limit: number): string {
  return `${CACHE_PREFIX}upcoming|${limit}`
}

export interface CalendarCacheEntry<T> {
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

export function readCalendarCache<T>(
  key: string,
): CalendarCacheEntry<T> | null {
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

export function writeCalendarCache<T>(key: string, data: T): void {
  const store = storage()
  if (!store) return

  try {
    store.setItem(
      key,
      JSON.stringify({
        data,
        savedAt: Date.now(),
      } satisfies CalendarCacheEntry<T>),
    )
  } catch {
    // Cache writes are best effort; storage may be full or blocked.
  }
}

export function writeCalendarItemsCache(items: CalendarItem[]): number {
  const savedAt = Date.now()
  const store = storage()
  if (!store) return savedAt

  try {
    store.setItem(
      CALENDAR_CACHE_KEY,
      JSON.stringify({ data: items, savedAt } satisfies CalendarCacheEntry<
        CalendarItem[]
      >),
    )
  } catch {
    // Ignore storage quota or privacy-mode failures.
  }

  return savedAt
}

export function formatCalendarCacheTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
