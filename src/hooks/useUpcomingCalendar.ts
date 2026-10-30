import { useCallback, useEffect, useState } from 'react'
import { fetchUpcomingCalendarItems } from '../lib/api'
import type { CalendarItem } from '../lib/calendar'
import {
  readCalendarCache,
  upcomingCacheKey,
  writeCalendarCache,
} from '../lib/calendarCache'

interface UseUpcomingCalendarResult {
  items: CalendarItem[]
  loading: boolean
  error: string | null
  usingSavedData: boolean
  reload: () => void
}

export function useUpcomingCalendar(
  limit = 5,
  refreshKey = 0,
): UseUpcomingCalendarResult {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingSavedData, setUsingSavedData] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    const cacheKey = upcomingCacheKey(limit)
    const cached = readCalendarCache<CalendarItem[]>(cacheKey)

    if (cached) setItems(cached.data)

    setLoading(true)
    setError(null)
    setUsingSavedData(false)

    const load = async () => {
      try {
        const data = await fetchUpcomingCalendarItems(limit)
        if (cancelled) return

        setItems(data)
        writeCalendarCache(cacheKey, data)
        setError(null)
        setUsingSavedData(false)
      } catch (loadError) {
        if (cancelled) return

        if (cached) {
          setUsingSavedData(true)
          setError(null)
        } else {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load upcoming items.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [limit, refreshKey, version])

  const reload = useCallback(() => {
    setVersion((current) => current + 1)
  }, [])

  return { items, loading, error, usingSavedData, reload }
}
