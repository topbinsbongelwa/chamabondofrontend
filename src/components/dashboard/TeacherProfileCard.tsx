import { Link } from 'react-router-dom'
import type { AttendanceSummary } from '../../lib/attendance'
import { getCurrentUser, getDisplayName, getInitials } from '../../lib/auth'
import { formatMonthYear } from '../../lib/format'

interface TeacherProfileCardProps {
  summary: AttendanceSummary
  loading: boolean
  error: string | null
}

function formatRole(role?: string): string {
  if (!role) return 'Teacher'

  return role
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function TeacherProfileCard({
  summary,
  loading,
  error,
}: TeacherProfileCardProps) {
  const user = getCurrentUser()
  const name = getDisplayName()
  const initials = getInitials(name)
  const role = formatRole(user?.role)
  const department = user?.department?.trim() || 'Not set'
  const ecNumber = user?.ecNumber?.trim() || 'Not set'

  const stats = [
    {
      label: 'Present',
      value: summary.present,
      valueClass: 'text-emerald-700',
    },
    {
      label: 'Late',
      value: summary.late,
      valueClass: 'text-amber-700',
    },
    {
      label: 'Absent',
      value: summary.absent,
      valueClass: 'text-red-700',
    },
  ]

  return (
    <section
      aria-labelledby="teacher-profile-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
    >
      <div className="relative bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-gold/20 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-wrap items-center gap-4 sm:gap-5">
          <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-gold/70 bg-white/10 text-xl font-bold text-white shadow-lg backdrop-blur sm:h-[72px] sm:w-[72px] sm:text-2xl">
            {initials}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-100">
              Teacher profile
            </p>
            <h2
              id="teacher-profile-heading"
              className="mt-1 truncate text-xl font-bold tracking-tight text-white sm:text-2xl"
            >
              {name}
            </h2>
            <p className="mt-1 text-sm font-medium text-primary-100">
              {role}
              {department !== 'Not set' ? ` · ${department}` : ''}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary-100">
                EC number
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">
                {ecNumber}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary-100">
                Department
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">
                {department}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-3.5 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {stat.label}
              <span className="hidden sm:inline"> this month</span>
            </p>
            {loading ? (
              <div className="mx-auto mt-1 h-6 w-8 animate-pulse rounded bg-slate-200/70 sm:mx-0" />
            ) : error ? (
              <p className="mt-0.5 text-xl font-bold text-slate-300">—</p>
            ) : (
              <p className={`mt-0.5 text-xl font-bold tabular-nums ${stat.valueClass}`}>
                {stat.value}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5">
        <p className="text-[11px] font-medium text-slate-400">
          {formatMonthYear(new Date())}
        </p>
        <Link
          to="/updates"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary transition hover:bg-primary-100"
        >
          View updates
        </Link>
      </div>
    </section>
  )
}
