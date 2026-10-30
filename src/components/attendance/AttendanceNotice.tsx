import { formatCacheTime } from '../../lib/attendanceCache'
import { AlertIcon, RefreshIcon } from '../icons'

interface AttendanceNoticeProps {
  error: string | null
  usingCache?: boolean
  cachedAt?: number | null
  onRetry?: () => void
  compact?: boolean
}

export function AttendanceNotice({
  error,
  usingCache = false,
  cachedAt = null,
  onRetry,
  compact = false,
}: AttendanceNoticeProps) {
  if (!error) return null

  const tone = usingCache
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-red-200 bg-red-50 text-red-700'

  return (
    <div
      role={usingCache ? 'status' : 'alert'}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 ${
        compact ? 'py-2.5' : 'py-3'
      } ${tone}`}
    >
      <p className="flex min-w-0 items-start gap-2 text-sm font-medium">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {error}
          {usingCache && cachedAt ? (
            <span className="mt-0.5 block text-xs font-normal opacity-80">
              Showing the last saved data from {formatCacheTime(cachedAt)}.
            </span>
          ) : null}
        </span>
      </p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition ${
            usingCache
              ? 'border-amber-200 text-amber-800 hover:bg-amber-100'
              : 'border-red-200 text-red-700 hover:bg-red-100'
          }`}
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Try again
        </button>
      ) : null}
    </div>
  )
}
