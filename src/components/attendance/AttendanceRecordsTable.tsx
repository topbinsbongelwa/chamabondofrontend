import { useMonthlyAttendance } from '../../hooks/useMonthlyAttendance'
import type { AttendanceRecord } from '../../lib/attendance'
import { formatDate, formatTime, parseDateValue } from '../../lib/format'
import { formatMonthValue } from '../../lib/dateRange'
import { CalendarIcon, SpinnerIcon } from '../icons'
import { StatusBadge } from '../dashboard/StatusBadge'
import { AttendanceNotice } from './AttendanceNotice'

interface AttendanceRecordsTableProps {
  month: string
  refreshToken?: number
}

function sortValue(record: AttendanceRecord): number {
  const date = parseDateValue(record.date)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function recordKey(record: AttendanceRecord, index: number): string {
  return `${record.id ?? record.date}-${index}`
}

function TableSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden animate-pulse space-y-3 p-5 md:block sm:p-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex gap-4">
            <div className="h-5 w-28 rounded bg-slate-100" />
            <div className="h-5 w-24 rounded bg-slate-100" />
            <div className="h-5 w-16 rounded bg-slate-100" />
            <div className="h-5 w-16 rounded bg-slate-100" />
            <div className="h-5 flex-1 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="animate-pulse p-4">
            <div className="h-5 w-32 rounded bg-slate-100" />
            <div className="mt-2 h-6 w-24 rounded-full bg-slate-100" />
            <div className="mt-3 h-16 rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>

      <p className="sr-only" role="status">
        Loading attendance records
      </p>
    </div>
  )
}

export function AttendanceRecordsTable({
  month,
  refreshToken = 0,
}: AttendanceRecordsTableProps) {
  const { records, loading, error, usingCache, cachedAt, reload } =
    useMonthlyAttendance(month, refreshToken)

  const rows = [...records].sort((a, b) => sortValue(b) - sortValue(a))
  const hasRows = rows.length > 0

  return (
    <section
      aria-labelledby="attendance-records-heading"
      aria-busy={loading}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Records
          </p>
          <h2
            id="attendance-records-heading"
            className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            Attendance records
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatMonthValue(month)}
          </p>
        </div>

        {loading && hasRows ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
            Updating
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="border-b border-slate-100 p-4 sm:px-6">
          <AttendanceNotice
            error={error}
            usingCache={usingCache}
            cachedAt={cachedAt}
            onRetry={reload}
            compact
          />
        </div>
      ) : null}

      {loading && !hasRows ? (
        <TableSkeleton />
      ) : !hasRows ? (
        <div className="p-8 text-center sm:p-10">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
            <CalendarIcon className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            No attendance records for this period
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try another month or refresh after checking in.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3 sm:px-6">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Check-in
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Check-out
                    </th>
                    <th scope="col" className="px-5 py-3 sm:px-6">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((record, index) => (
                    <tr
                      key={recordKey(record, index)}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-700 sm:px-6">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm tabular-nums text-slate-600">
                        {formatTime(record.checkIn)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm tabular-nums text-slate-600">
                        {formatTime(record.checkOut)}
                      </td>
                      <td
                        className="max-w-[260px] truncate px-5 py-3.5 text-sm text-slate-500 sm:px-6"
                        title={record.note ?? undefined}
                      >
                        {record.note || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {rows.map((record, index) => (
              <article key={recordKey(record, index)} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    {formatDate(record.date)}
                  </p>
                  <StatusBadge status={record.status} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Check-in
                    </dt>
                    <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-700">
                      {formatTime(record.checkIn)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Check-out
                    </dt>
                    <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-700">
                      {formatTime(record.checkOut)}
                    </dd>
                  </div>
                </dl>

                {record.note ? (
                  <p className="mt-2.5 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Note: </span>
                    {record.note}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
