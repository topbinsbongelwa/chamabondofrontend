import { useCallback, useEffect, useState } from 'react'
import { fetchCalendarItems } from '../lib/api'
import {
  CALENDAR_CACHE_KEY,
  readCalendarCache,
  writeCalendarItemsCache,
} from '../lib/calendarCache'
import type { CalendarItem } from '../lib/calendar'

export interface UseCalendarDataResult {
  items: CalendarItem[]
  loading: boolean
  error: string | null
  usingSavedData: boolean
  savedAt: number | null
  reload: () => void
}

export function useCalendarData(): UseCalendarDataResult {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingSavedData, setUsingSavedData] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    const cached = readCalendarCache<CalendarItem[]>(CALENDAR_CACHE_KEY)

    if (cached) {
      setItems(cached.data)
      setSavedAt(cached.savedAt)
    }

    setLoading(true)
    setError(null)
    setUsingSavedData(false)

    const load = async () => {
      try {
        const data = await fetchCalendarItems()
        if (cancelled) return

        setItems(data)
        setSavedAt(writeCalendarItemsCache(data))
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
              : 'Could not load the calendar.',
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
  }, [version])

  const reload = useCallback(() => {
    setVersion((current) => current + 1)
  }, [])

  return {
    items,
    loading,
    error,
    usingSavedData,
    savedAt,
    reload,
  }
}
