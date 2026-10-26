import { useEffect, useState } from 'react'
import { fetchMyAttendance } from '../lib/api'
import type { AttendanceRecord } from '../lib/attendance'
import {
  attendanceCacheKey,
  readAttendanceCache,
  writeAttendanceCache,
} from '../lib/attendanceCache'

interface UseMonthlyAttendanceResult {
  records: AttendanceRecord[]
  loading: boolean
  error: string | null
  usingCache: boolean
  cachedAt: number | null
  reload: () => void
}

function messageFromError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Could not load your attendance records.'
}

export function useMonthlyAttendance(
  month: string,
  refreshToken = 0,
): UseMonthlyAttendanceResult {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingCache, setUsingCache] = useState(false)
  const [cachedAt, setCachedAt] = useState<number | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)
  const cacheKey = attendanceCacheKey(['records', month])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const cached = readAttendanceCache<AttendanceRecord[]>(cacheKey)

      setLoading(true)
      setError(null)
      setUsingCache(false)
      setCachedAt(cached?.savedAt ?? null)
      setRecords(cached?.data ?? [])

      try {
        const data = await fetchMyAttendance(month || undefined)
        if (cancelled) return

        writeAttendanceCache(cacheKey, data)
        setRecords(data)
        setCachedAt(Date.now())
      } catch (loadError) {
        if (cancelled) return

        const fallback = readAttendanceCache<AttendanceRecord[]>(cacheKey)
        setError(messageFromError(loadError))

        if (fallback) {
          setRecords(fallback.data)
          setUsingCache(true)
          setCachedAt(fallback.savedAt)
        } else {
          setRecords([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [cacheKey, month, refreshToken, retryVersion])

  return {
    records,
    loading,
    error,
    usingCache,
    cachedAt,
    reload: () => setRetryVersion((version) => version + 1),
  }
}
