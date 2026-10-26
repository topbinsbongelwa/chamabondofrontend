import { useEffect, useState } from 'react'
import {
  fetchSchoolAttendanceStats,
  type SchoolAttendanceStatsQuery,
} from '../lib/api'
import type { SchoolAttendanceStats } from '../lib/attendanceStats'
import {
  attendanceCacheKey,
  readAttendanceCache,
  writeAttendanceCache,
} from '../lib/attendanceCache'

interface UseSchoolAttendanceStatsResult {
  data: SchoolAttendanceStats | null
  loading: boolean
  error: string | null
  usingCache: boolean
  cachedAt: number | null
  reload: () => void
}

function messageFromError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Could not load the school attendance statistics.'
}

export function useSchoolAttendanceStats(
  query: SchoolAttendanceStatsQuery,
  refreshToken = 0,
): UseSchoolAttendanceStatsResult {
  const [data, setData] = useState<SchoolAttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingCache, setUsingCache] = useState(false)
  const [cachedAt, setCachedAt] = useState<number | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)
  const from = query.from?.trim() ?? ''
  const to = query.to?.trim() ?? ''
  const department = query.department?.trim() ?? ''
  const teacherId = query.teacherId?.trim() ?? ''
  const cacheKey = attendanceCacheKey([
    'school',
    from,
    to,
    department,
    teacherId,
  ])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const cached = readAttendanceCache<SchoolAttendanceStats>(cacheKey)

      setLoading(true)
      setError(null)
      setUsingCache(false)
      setCachedAt(cached?.savedAt ?? null)
      setData(cached?.data ?? null)

      try {
        const response = await fetchSchoolAttendanceStats({
          from,
          to,
          department: department || undefined,
          teacherId: teacherId || undefined,
        })
        if (cancelled) return

        writeAttendanceCache(cacheKey, response)
        setData(response)
        setCachedAt(Date.now())
      } catch (loadError) {
        if (cancelled) return

        const fallback = readAttendanceCache<SchoolAttendanceStats>(cacheKey)
        setError(messageFromError(loadError))

        if (fallback) {
          setData(fallback.data)
          setUsingCache(true)
          setCachedAt(fallback.savedAt)
        } else {
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (!from || !to) {
      setLoading(false)
      setError('Choose a valid date range to load school attendance.')
      setData(null)
      return
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [
    cacheKey,
    department,
    from,
    refreshToken,
    retryVersion,
    teacherId,
    to,
  ])

  return {
    data,
    loading,
    error,
    usingCache,
    cachedAt,
    reload: () => setRetryVersion((version) => version + 1),
  }
}
