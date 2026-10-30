import { useMemo, useState } from 'react'
import { TodayAttendanceCard } from '../dashboard/TodayAttendanceCard'
import { useAttendanceStats } from '../../hooks/useAttendanceStats'
import {
  emptyStatusCounts,
  type AttendanceRangeStats,
} from '../../lib/attendanceStats'
import {
  currentMonthValue,
  formatRangeLabel,
  isRangeValid,
  monthBounds,
  monthFromDate,
  rangeLengthInDays,
} from '../../lib/dateRange'
import { AttendanceFilters } from './AttendanceFilters'
import { AttendanceNotice } from './AttendanceNotice'
import { AttendanceStatCards } from './AttendanceStatCards'
import { AttendancePieChart } from './AttendancePieChart'
import { AttendanceBarChart } from './AttendanceBarChart'
import { AttendanceRecordsTable } from './AttendanceRecordsTable'

interface AppliedRange {
  from: string
  to: string
  month: string
}

function initialRange(): AppliedRange {
  const month = currentMonthValue()
  const bounds = monthBounds(month)

  return {
    from: bounds?.from ?? '',
    to: bounds?.to ?? '',
    month,
  }
}

const EMPTY_COUNTS = emptyStatusCounts()

export function MyAttendanceTab() {
  const initial = useMemo(initialRange, [])
  const [draftMonth, setDraftMonth] = useState(initial.month)
  const [draftFrom, setDraftFrom] = useState(initial.from)
  const [draftTo, setDraftTo] = useState(initial.to)
  const [applied, setApplied] = useState<AppliedRange>(initial)
  const [refreshToken, setRefreshToken] = useState(0)

  const invalidRange = !isRangeValid(draftFrom, draftTo)
  const { stats, loading, error, usingCache, cachedAt, reload } =
    useAttendanceStats(
      { from: applied.from, to: applied.to },
      refreshToken,
    )

  const periodLabel = formatRangeLabel(applied.from, applied.to)
  const defaultMode =
    rangeLengthInDays(applied.from, applied.to) > 62 ? 'monthly' : 'weekly'

  const handleMonthChange = (value: string) => {
    setDraftMonth(value)
    const bounds = monthBounds(value)
    if (bounds) {
      setDraftFrom(bounds.from)
      setDraftTo(bounds.to)
    }
  }

  const handleRefresh = () => {
    if (invalidRange) return

    setApplied({
      from: draftFrom,
      to: draftTo,
      month: monthFromDate(draftFrom) || draftMonth || currentMonthValue(),
    })
    setRefreshToken((token) => token + 1)
  }

  const handleAttendanceChanged = () => {
    setRefreshToken((token) => token + 1)
  }

  const safeStats: AttendanceRangeStats | null = stats

  return (
    <div className="space-y-4 sm:space-y-5">
      <TodayAttendanceCard onChanged={handleAttendanceChanged} />

      <AttendanceFilters
        month={draftMonth}
        from={draftFrom}
        to={draftTo}
        onMonthChange={handleMonthChange}
        onFromChange={setDraftFrom}
        onToChange={setDraftTo}
        onRefresh={handleRefresh}
        loading={loading}
        invalidRange={invalidRange}
      />

      {error ? (
        <AttendanceNotice
          error={error}
          usingCache={usingCache}
          cachedAt={cachedAt}
          onRetry={reload}
        />
      ) : null}

      <AttendanceStatCards
        stats={safeStats}
        loading={loading}
        periodLabel={periodLabel}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <AttendancePieChart
          counts={safeStats?.counts ?? EMPTY_COUNTS}
          loading={loading}
        />
        <AttendanceBarChart
          weekly={safeStats?.weekly ?? []}
          monthly={safeStats?.monthly ?? []}
          loading={loading}
          initialMode={defaultMode}
        />
      </div>

      <AttendanceRecordsTable
        month={applied.month}
        refreshToken={refreshToken}
      />
    </div>
  )
}
