import { useEffect, useState } from 'react'
import { fetchStaffDirectory } from '../lib/api'
import type { StaffMember } from '../lib/staff'

interface UseStaffDirectoryResult {
  staff: StaffMember[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useStaffDirectory(): UseStaffDirectoryResult {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchStaffDirectory()
        if (!cancelled) setStaff(data)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load the staff directory.',
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

  return {
    staff,
    loading,
    error,
    reload: () => setVersion((current) => current + 1),
  }
}
