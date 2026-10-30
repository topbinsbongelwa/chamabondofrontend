import { useEffect, useState } from 'react'
import { fetchAttendanceStats, type AttendanceStatsQuery } from '../lib/api'
import type { AttendanceRangeStats } from '../lib/attendanceStats'
import {
  attendanceCacheKey,
  readAttendanceCache,
  writeAttendanceCache,
} from '../lib/attendanceCache'

interface UseAttendanceStatsResult {
  stats: AttendanceRangeStats | null
  loading: boolean
  error: string | null
  usingCache: boolean
  cachedAt: number | null
  reload: () => void
}

function messageFromError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Could not load your attendance statistics.'
}

export function useAttendanceStats(
  query: AttendanceStatsQuery,
  refreshToken = 0,
): UseAttendanceStatsResult {
  const [stats, setStats] = useState<AttendanceRangeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingCache, setUsingCache] = useState(false)
  const [cachedAt, setCachedAt] = useState<number | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)
  const from = query.from?.trim() ?? ''
  const to = query.to?.trim() ?? ''
  const cacheKey = attendanceCacheKey(['stats', from, to])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const cached = readAttendanceCache<AttendanceRangeStats>(cacheKey)

      setLoading(true)
      setError(null)
      setUsingCache(false)
      setCachedAt(cached?.savedAt ?? null)
      setStats(cached?.data ?? null)

      try {
        const data = await fetchAttendanceStats({ from, to })
        if (cancelled) return

        writeAttendanceCache(cacheKey, data)
        setStats(data)
        setCachedAt(Date.now())
      } catch (loadError) {
        if (cancelled) return

        const fallback = readAttendanceCache<AttendanceRangeStats>(cacheKey)
        setError(messageFromError(loadError))

        if (fallback) {
          setStats(fallback.data)
          setUsingCache(true)
          setCachedAt(fallback.savedAt)
        } else {
          setStats(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (!from || !to) {
      setLoading(false)
      setError('Choose a valid date range to load attendance.')
      setStats(null)
      return
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [cacheKey, from, to, refreshToken, retryVersion])

  return {
    stats,
    loading,
    error,
    usingCache,
    cachedAt,
    reload: () => setRetryVersion((version) => version + 1),
  }
}
