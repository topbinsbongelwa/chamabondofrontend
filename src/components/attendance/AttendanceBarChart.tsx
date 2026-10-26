import { useEffect, useState } from 'react'
import type {
  AttendanceBucket,
  BucketMode,
} from '../../lib/attendanceStats'
import {
  StatusStackedBarChart,
  type StatusStackedRow,
} from './StatusStackedBarChart'

interface AttendanceBarChartProps {
  weekly: AttendanceBucket[]
  monthly: AttendanceBucket[]
  loading?: boolean
  initialMode?: BucketMode
}

function rowsFromBuckets(buckets: AttendanceBucket[]): StatusStackedRow[] {
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    counts: bucket.counts,
  }))
}

export function AttendanceBarChart({
  weekly,
  monthly,
  loading = false,
  initialMode = 'weekly',
}: AttendanceBarChartProps) {
  const [mode, setMode] = useState<BucketMode>(initialMode)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const buckets = mode === 'weekly' ? weekly : monthly

  return (
    <section
      aria-labelledby="attendance-bar-heading"
      aria-busy={loading}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Attendance trend
          </p>
          <h2
            id="attendance-bar-heading"
            className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            {mode === 'weekly' ? 'Weekly' : 'Monthly'} attendance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Status counts stacked over the selected period.
          </p>
        </div>

        <div
          role="group"
          aria-label="Chart grouping"
          className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
        >
          <button
            type="button"
            onClick={() => setMode('weekly')}
            aria-pressed={mode === 'weekly'}
            className={`inline-flex min-h-[36px] items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
              mode === 'weekly'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setMode('monthly')}
            aria-pressed={mode === 'monthly'}
            className={`inline-flex min-h-[36px] items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
              mode === 'monthly'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="mt-4">
        <StatusStackedBarChart
          rows={rowsFromBuckets(buckets)}
          loading={loading}
          ariaLabel={`${mode === 'weekly' ? 'Weekly' : 'Monthly'} stacked attendance chart`}
        />
      </div>
    </section>
  )
}
