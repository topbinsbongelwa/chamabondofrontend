import { useEffect, useState } from 'react'
import { fetchAttendanceSummary } from '../lib/api'
import type { AttendanceSummary } from '../lib/attendance'

const EMPTY_SUMMARY: AttendanceSummary = {
  present: 0,
  late: 0,
  sickLeave: 0,
  leave: 0,
  absent: 0,
}

interface UseAttendanceSummaryResult {
  summary: AttendanceSummary
  loading: boolean
  error: string | null
  reload: () => void
}

export function useAttendanceSummary(
  refreshToken: number,
): UseAttendanceSummaryResult {
  const [summary, setSummary] = useState<AttendanceSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchAttendanceSummary()
        if (!cancelled) setSummary(data)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load your summary.',
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
  }, [refreshToken, retryVersion])

  return {
    summary,
    loading,
    error,
    reload: () => setRetryVersion((version) => version + 1),
  }
}
