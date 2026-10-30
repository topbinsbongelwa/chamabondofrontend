import { useMemo, useState } from 'react'
import type { TeacherAttendanceStat } from '../../lib/attendanceStats'
import { downloadCsv } from '../../lib/csv'
import {
  ChevronRightIcon,
  DownloadIcon,
  UsersIcon,
} from '../icons'

type SortKey =
  | 'name'
  | 'department'
  | 'attendedDays'
  | 'sickLeave'
  | 'duties'
  | 'absent'
  | 'attendanceRate'

type SortDirection = 'asc' | 'desc'

interface SortState {
  key: SortKey
  direction: SortDirection
}

interface TeacherBreakdownTableProps {
  teachers: TeacherAttendanceStat[]
  loading?: boolean
  from: string
  to: string
}

function percentage(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`
}

function rateBarClass(rate: number): string {
  if (rate >= 90) return 'bg-emerald-500'
  if (rate >= 75) return 'bg-amber-500'
  return 'bg-red-500'
}

function sortValue(teacher: TeacherAttendanceStat, key: SortKey): string | number {
  if (key === 'name' || key === 'department') return teacher[key].toLowerCase()
  if (key === 'sickLeave') return teacher.counts['sick-leave']
  if (key === 'absent') return teacher.counts.absent
  return teacher[key]
}

function sortTeachers(
  teachers: TeacherAttendanceStat[],
  sort: SortState,
): TeacherAttendanceStat[] {
  return [...teachers].sort((a, b) => {
    const aValue = sortValue(a, sort.key)
    const bValue = sortValue(b, sort.key)

    const result =
      typeof aValue === 'string' && typeof bValue === 'string'
        ? aValue.localeCompare(bValue)
        : Number(aValue) - Number(bValue)

    return sort.direction === 'asc' ? result : -result
  })
}

const COLUMNS: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
  { key: 'name', label: 'Teacher' },
  { key: 'department', label: 'Department' },
  { key: 'attendedDays', label: 'Attended', numeric: true },
  { key: 'sickLeave', label: 'Sick leave', numeric: true },
  { key: 'duties', label: 'Duties', numeric: true },
  { key: 'absent', label: 'Absent', numeric: true },
  { key: 'attendanceRate', label: 'Attendance rate', numeric: true },
]

export function TeacherBreakdownTable({
  teachers,
  loading = false,
  from,
  to,
}: TeacherBreakdownTableProps) {
  const [sort, setSort] = useState<SortState>({
    key: 'name',
    direction: 'asc',
  })

  const sorted = useMemo(() => sortTeachers(teachers, sort), [teachers, sort])

  const changeSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? {
            key,
            direction: current.direction === 'asc' ? 'desc' : 'asc',
          }
        : {
            key,
            direction: key === 'name' || key === 'department' ? 'asc' : 'desc',
          },
    )
  }

  const exportCsv = () => {
    const header = [
      'Teacher',
      'Department',
      'Attended days',
      'Sick leave days',
      'Duty days',
      'Absent days',
      'Attendance rate (%)',
    ]

    const rows = sorted.map((teacher) => [
      teacher.name,
      teacher.department,
      teacher.attendedDays,
      teacher.counts['sick-leave'],
      teacher.duties,
      teacher.counts.absent,
      teacher.attendanceRate,
    ])

    downloadCsv(`attendance-by-teacher-${from}-to-${to}.csv`, [header, ...rows])
  }

  const ariaSort = (key: SortKey): 'ascending' | 'descending' | 'none' => {
    if (sort.key !== key) return 'none'
    return sort.direction === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <section
      aria-labelledby="teacher-breakdown-heading"
      aria-busy={loading}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            School overview
          </p>
          <h2
            id="teacher-breakdown-heading"
            className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            By teacher
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Attended days, leave, duties and attendance rate for each teacher.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={loading || sorted.length === 0}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-50 px-3.5 py-2 text-sm font-semibold text-primary transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DownloadIcon className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:hidden">
        <label
          htmlFor="teacher-sort"
          className="text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          Sort by
        </label>
        <select
          id="teacher-sort"
          value={`${sort.key}:${sort.direction}`}
          onChange={(event) => {
            const [key, direction] = event.target.value.split(':')
            setSort({
              key: key as SortKey,
              direction: direction as SortDirection,
            })
          }}
          className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-700"
        >
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="attendanceRate:desc">Rate high–low</option>
          <option value="attendanceRate:asc">Rate low–high</option>
          <option value="attendedDays:desc">Attended high–low</option>
          <option value="sickLeave:desc">Sick leave high–low</option>
          <option value="duties:desc">Duties high–low</option>
          <option value="absent:desc">Absent high–low</option>
        </select>
      </div>

      {loading && teachers.length === 0 ? (
        <div className="p-5 sm:p-6" aria-hidden="true">
          <div className="hidden animate-pulse space-y-3 md:block">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex gap-4">
                <div className="h-5 w-40 rounded bg-slate-100" />
                <div className="h-5 w-28 rounded bg-slate-100" />
                <div className="h-5 w-16 rounded bg-slate-100" />
                <div className="h-5 w-16 rounded bg-slate-100" />
                <div className="h-5 flex-1 rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="animate-pulse space-y-3 md:hidden">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="rounded-xl border border-slate-100 p-4">
                <div className="h-5 w-36 rounded bg-slate-100" />
                <div className="mt-2 h-4 w-24 rounded bg-slate-100" />
                <div className="mt-3 h-16 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
          <p className="sr-only" role="status">
            Loading teacher attendance
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="p-8 text-center sm:p-10">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
            <UsersIcon className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            No attendance records for this period
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Teacher statistics will appear here after attendance is recorded.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <caption className="sr-only">
                  Attendance by teacher. Select a column heading to sort.
                </caption>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    {COLUMNS.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        aria-sort={ariaSort(column.key)}
                        className={`px-4 py-3 ${
                          column.key === 'name' ? 'pl-5 sm:pl-6' : ''
                        } ${column.numeric ? 'text-right' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => changeSort(column.key)}
                          className={`inline-flex min-h-[32px] items-center gap-1 rounded px-1 font-bold uppercase tracking-wide transition hover:text-primary ${
                            sort.key === column.key ? 'text-primary' : ''
                          }`}
                        >
                          {column.label}
                          <ChevronRightIcon
                            className={`h-3.5 w-3.5 transition ${
                              sort.key === column.key
                                ? sort.direction === 'asc'
                                  ? '-rotate-90'
                                  : 'rotate-90'
                                : 'rotate-90 opacity-30'
                            }`}
                          />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="max-w-[220px] px-4 py-3.5 pl-5 sm:pl-6">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {teacher.name}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {teacher.department}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-700">
                        {teacher.attendedDays}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-blue-700">
                        {teacher.counts['sick-leave']}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-teal-700">
                        {teacher.duties}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-red-700">
                        {teacher.counts.absent}
                      </td>
                      <td className="min-w-[150px] px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-bold tabular-nums text-slate-800">
                            {percentage(teacher.attendanceRate)}
                          </span>
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <span
                              className={`block h-full rounded-full ${rateBarClass(teacher.attendanceRate)}`}
                              style={{
                                width: `${Math.min(100, Math.max(0, teacher.attendanceRate))}%`,
                              }}
                            />
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {sorted.map((teacher) => (
              <article key={teacher.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {teacher.name}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {teacher.department}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary">
                    {percentage(teacher.attendanceRate)}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-xs text-slate-500">Attended</dt>
                    <dd className="font-bold tabular-nums text-emerald-700">
                      {teacher.attendedDays}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-xs text-slate-500">Sick leave</dt>
                    <dd className="font-bold tabular-nums text-blue-700">
                      {teacher.counts['sick-leave']}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-xs text-slate-500">Duties</dt>
                    <dd className="font-bold tabular-nums text-teal-700">
                      {teacher.duties}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-xs text-slate-500">Absent</dt>
                    <dd className="font-bold tabular-nums text-red-700">
                      {teacher.counts.absent}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className={`block h-full rounded-full ${rateBarClass(teacher.attendanceRate)}`}
                    style={{
                      width: `${Math.min(100, Math.max(0, teacher.attendanceRate))}%`,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
