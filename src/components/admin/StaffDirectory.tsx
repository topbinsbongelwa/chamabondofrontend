import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { statusKey, type AttendanceStatusKey } from '../../lib/attendance'
import { formatRoleLabel } from '../../lib/roles'
import { formatTime } from '../../lib/format'
import { getInitials } from '../../lib/auth'
import type { StaffMember } from '../../lib/staff'
import {
  AlertIcon,
  ChevronRightIcon,
  RefreshIcon,
  SearchIcon,
  UsersIcon,
} from '../icons'
import { StatusBadge } from '../dashboard/StatusBadge'
import { StaffDetailDrawer } from './StaffDetailDrawer'

type StatusFilter = 'all' | 'present' | 'late' | 'away' | 'not-marked'

const AWAY_STATUSES: AttendanceStatusKey[] = [
  'sick-leave',
  'leave',
  'holiday',
  'school-duty',
  'sports-duty',
  'absent',
]

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All staff' },
  { value: 'present', label: 'Present today' },
  { value: 'late', label: 'Late today' },
  { value: 'away', label: 'Away today' },
  { value: 'not-marked', label: 'Not marked' },
]

function matchesFilter(member: StaffMember, filter: StatusFilter): boolean {
  if (filter === 'all') return true

  const key = statusKey(member.today?.status)
  if (filter === 'present') return key === 'present'
  if (filter === 'late') return key === 'late'
  if (filter === 'away') return AWAY_STATUSES.includes(key)

  return key === 'unknown'
}

interface StaffDirectoryProps {
  staff: StaffMember[]
  loading: boolean
  error: string | null
  onRetry: () => void
  limit?: number
  viewAllHref?: string
}

export function StaffDirectory({
  staff,
  loading,
  error,
  onRetry,
  limit,
  viewAllHref,
}: StaffDirectoryProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<StaffMember | null>(null)

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()

    return staff.filter((member) => {
      if (!matchesFilter(member, statusFilter)) return false
      if (!search) return true

      return [member.name, member.ecNumber, member.department, member.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    })
  }, [staff, query, statusFilter])

  const rows = typeof limit === 'number' ? filtered.slice(0, limit) : filtered
  const hasFilters = query.trim().length > 0 || statusFilter !== 'all'

  const clearFilters = () => {
    setQuery('')
    setStatusFilter('all')
  }

  return (
    <section
      aria-labelledby="staff-directory-heading"
      aria-busy={loading}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
    >
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Staff
            </p>
            <h2
              id="staff-directory-heading"
              className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
            >
              Staff directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review profiles, today&apos;s attendance and monthly records.
            </p>
          </div>

          {viewAllHref ? (
            <Link
              to={viewAllHref}
              className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold text-primary transition hover:bg-primary-50"
            >
              View all staff
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="staff-search" className="sr-only">
              Search staff
            </label>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="staff-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, EC number or department"
              className="input pl-10"
            />
          </div>

          <div className="sm:w-52">
            <label htmlFor="staff-status-filter" className="sr-only">
              Filter by today&apos;s status
            </label>
            <select
              id="staff-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="input"
            >
              {FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div>
          <div className="hidden animate-pulse space-y-3 p-5 lg:block sm:p-6">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100" />
                <div className="h-5 w-36 rounded bg-slate-100" />
                <div className="h-5 w-28 rounded bg-slate-100" />
                <div className="h-6 w-20 rounded-full bg-slate-100" />
                <div className="h-5 flex-1 rounded bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="animate-pulse p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                  <div className="h-5 w-36 rounded bg-slate-100" />
                </div>
                <div className="mt-3 h-20 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>

          <p className="sr-only" role="status">
            Loading staff directory
          </p>
        </div>
      ) : error ? (
        <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 sm:m-6">
          <p className="flex items-start gap-2 text-sm font-medium text-red-700">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <RefreshIcon className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center sm:p-10">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
            <UsersIcon className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {hasFilters ? 'No staff match your search' : 'No staff found'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {hasFilters
              ? 'Try a different name, EC number, department or status.'
              : 'Staff accounts will appear here once they are registered.'}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex min-h-[40px] items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3 sm:px-6">
                      Staff
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Role &amp; department
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Today
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Check-in
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Present
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Late
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Absent
                    </th>
                    <th scope="col" className="px-5 py-3 text-right sm:px-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((member, index) => (
                    <tr
                      key={member.id ?? `${member.name}-${index}`}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary ring-1 ring-inset ring-primary/10">
                            {getInitials(member.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {member.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {member.ecNumber ?? 'No EC number'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-slate-700">
                          {formatRoleLabel(member.role)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {member.department ?? 'No department'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={member.today?.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm tabular-nums text-slate-600">
                        {formatTime(member.today?.checkIn)}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold tabular-nums text-emerald-700">
                        {member.summary.present}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold tabular-nums text-amber-700">
                        {member.summary.late}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold tabular-nums text-red-700">
                        {member.summary.absent}
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6">
                        <button
                          type="button"
                          onClick={() => setSelected(member)}
                          className="inline-flex min-h-[34px] items-center rounded-lg px-2.5 text-sm font-semibold text-primary transition hover:bg-primary-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {rows.map((member, index) => (
              <article
                key={member.id ?? `${member.name}-${index}`}
                className="p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary ring-1 ring-inset ring-primary/10">
                      {getInitials(member.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {formatRoleLabel(member.role)}
                        {member.department ? ` · ${member.department}` : ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={member.today?.status} />
                </div>

                <dl className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3">
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      In
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-slate-700">
                      {formatTime(member.today?.checkIn)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      Out
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-slate-700">
                      {formatTime(member.today?.checkOut)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      Present
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold tabular-nums text-emerald-700">
                      {member.summary.present}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      Late
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold tabular-nums text-amber-700">
                      {member.summary.late}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => setSelected(member)}
                  className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center gap-1 rounded-xl border border-primary/20 bg-primary-50 px-3 text-sm font-semibold text-primary transition hover:bg-primary-100"
                >
                  View staff details
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:px-6">
            <p>
              Showing {rows.length} of {filtered.length} staff
              {filtered.length !== staff.length ? ` (${staff.length} total)` : ''}
            </p>
          </div>
        </>
      )}

      {selected ? (
        <StaffDetailDrawer
          member={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </section>
  )
}
