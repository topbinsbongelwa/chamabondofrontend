import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AttendancePieChart } from '../components/attendance/AttendancePieChart'
import { DepartmentBarChart } from '../components/attendance/DepartmentBarChart'
import { StatusBadge } from '../components/dashboard/StatusBadge'
import { SchoolUpdatesCard } from '../components/dashboard/SchoolUpdatesCard'
import { UpcomingCalendar } from '../components/calendar/UpcomingCalendar'
import { BookIcon, TargetIcon } from '../components/icons'
import { useSchoolAttendanceStats } from '../hooks/useSchoolAttendanceStats'
import { useStaffDirectory } from '../hooks/useStaffDirectory'
import { fetchReviewKras, fetchReviewSchemeBooks } from '../lib/api'
import { getDisplayName } from '../lib/auth'
import { emptyStatusCounts } from '../lib/attendanceStats'
import { statusKey } from '../lib/attendance'
import { currentMonthValue, formatIsoDate, monthBounds } from '../lib/dateRange'
import { formatTime } from '../lib/format'
import type { Kra } from '../lib/kras'
import { getDepartmentScope, getRole, getRoleLabel } from '../lib/roles'
import type { SchemeBook } from '../lib/schemeBooks'
import type { StaffMember } from '../lib/staff'

interface ReviewQueueItem {
  id: string | number
  kind: 'KRA' | 'Scheme book'
  title: string
  teacherName: string | null
  department: string | null
  createdAt: string | null
  href: string
}

type StaffFilter = 'all' | 'absent' | 'late'

function isWithinDepartment(department: string | null, scope: string | null) {
  return !scope || department?.trim().toLowerCase() === scope.trim().toLowerCase()
}

function oldestFirst(a: ReviewQueueItem, b: ReviewQueueItem) {
  if (!a.createdAt) return b.createdAt ? 1 : 0
  if (!b.createdAt) return -1
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

function toQueueItems(kras: Kra[], books: SchemeBook[], department: string | null) {
  const pendingKras = kras
    .filter((item) => item.status === 'pending' && isWithinDepartment(item.department, department))
    .map<ReviewQueueItem>((item) => ({
      id: item.id,
      kind: 'KRA',
      title: item.title,
      teacherName: item.teacherName,
      department: item.department,
      createdAt: item.createdAt,
      href: '/admin/kras?tab=review',
    }))
  const pendingBooks = books
    .filter((item) => item.status === 'pending' && isWithinDepartment(item.department, department))
    .map<ReviewQueueItem>((item) => ({
      id: item.id,
      kind: 'Scheme book',
      title: item.title,
      teacherName: item.teacherName,
      department: item.department,
      createdAt: item.createdAt,
      href: '/admin/scheme-books?tab=review',
    }))

  return [...pendingKras, ...pendingBooks].sort(oldestFirst)
}

function todayLabel() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function StatusSummaryCard({
  label,
  value,
  tone,
  loading,
}: {
  label: string
  value: number
  tone: string
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-2 h-9 w-14 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className={`mt-2 text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
      )}
    </div>
  )
}

export function AdminDashboardPage() {
  const role = getRole()
  const department = getDepartmentScope()
  const firstName = getDisplayName().split(/\s+/)[0]
  const monthBoundsValue = monthBounds(currentMonthValue())
  const monthFrom = monthBoundsValue?.from ?? ''
  const monthTo = formatIsoDate(new Date())
  const { staff: allStaff, loading: staffLoading, error: staffError, reload: reloadStaff } = useStaffDirectory()
  const [queue, setQueue] = useState<ReviewQueueItem[]>([])
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewLoading, setReviewLoading] = useState(true)
  const [reviewVersion, setReviewVersion] = useState(0)
  const [staffFilter, setStaffFilter] = useState<StaffFilter>('all')
  const attendance = useSchoolAttendanceStats({
    from: department === '' ? '' : monthFrom,
    to: monthTo,
    department: department ?? undefined,
  })

  const staff = useMemo(
    () => allStaff.filter((member) => isWithinDepartment(member.department, department)),
    [allStaff, department],
  )
  const todayCounts = useMemo(() => {
    const counts = emptyStatusCounts()
    for (const member of staff) {
      const key = statusKey(member.today?.status)
      if (key !== 'unknown') counts[key] += 1
    }
    return counts
  }, [staff])
  const dutyCount = todayCounts['school-duty'] + todayCounts['sports-duty']
  const leaveCount = todayCounts.leave + todayCounts['sick-leave']
  const visibleStaff = staff.filter((member) => {
    if (staffFilter === 'all') return true
    return statusKey(member.today?.status) === staffFilter
  })

  useEffect(() => {
    let cancelled = false
    setReviewLoading(true)
    setReviewError(null)
    Promise.all([fetchReviewKras(), fetchReviewSchemeBooks()])
      .then(([kras, books]) => {
        if (!cancelled) setQueue(toQueueItems(kras, books, department))
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReviewError(error instanceof Error ? error.message : 'Could not load items needing review.')
        }
      })
      .finally(() => {
        if (!cancelled) setReviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [department, reviewVersion])

  const weeklyRates = useMemo(
    () =>
      (attendance.data?.range.weekly ?? []).map((bucket) => {
        const total = Object.entries(bucket.counts)
          .filter(([status]) => status !== 'holiday')
          .reduce((sum, [, count]) => sum + count, 0)
        const attended = bucket.counts.present + bucket.counts.late
        return {
          week: bucket.label,
          rate: total ? Math.round((attended / total) * 100) : 0,
        }
      }),
    [attendance.data],
  )

  const attentionCount = queue.length
  const isLoading = staffLoading

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Admin dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{todayLabel()}</p>
        </div>
        <span
          title={department ? `All dashboard data is limited to ${department}.` : 'Dashboard data for the whole school.'}
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold-700"
        >
          {department !== null
            ? department
              ? `${department} department`
              : 'Department not assigned'
            : role === 'head' || role === 'deputy'
              ? 'Whole school'
              : getRoleLabel()}
        </span>
      </header>

      {staffError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{staffError}</span>
          <button type="button" onClick={reloadStaff} className="font-semibold underline">Retry</button>
        </div>
      ) : null}
      {attendance.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{attendance.error}{attendance.usingCache ? ' Showing cached attendance data.' : ''}</span>
          <button type="button" onClick={attendance.reload} className="font-semibold underline">Retry</button>
        </div>
      ) : null}
      {attendance.usingCache ? (
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Offline mode: showing the last saved attendance statistics.</p>
      ) : null}

      <section aria-label="Today's staff summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatusSummaryCard label="Total staff" value={staff.length} tone="text-slate-900" loading={isLoading} />
        <StatusSummaryCard label="Present today" value={todayCounts.present} tone="text-emerald-700" loading={isLoading} />
        <StatusSummaryCard label="Late today" value={todayCounts.late} tone="text-amber-700" loading={isLoading} />
        <StatusSummaryCard label="On leave / sick" value={leaveCount} tone="text-blue-700" loading={isLoading} />
        <StatusSummaryCard label="On duty" value={dutyCount} tone="text-teal-700" loading={isLoading} />
        <StatusSummaryCard label="Absent today" value={todayCounts.absent} tone="text-red-700" loading={isLoading} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Review queue</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Needs your attention</h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{attentionCount} pending</span>
        </div>
        {reviewError ? (
          <div role="alert" className="flex items-center justify-between gap-3 p-4 text-sm text-red-700">
            <span>{reviewError}</span>
            <button type="button" onClick={() => setReviewVersion((value) => value + 1)} className="font-semibold underline">Retry</button>
          </div>
        ) : reviewLoading ? (
          <div className="animate-pulse space-y-3 p-5" aria-label="Loading review queue">
            <div className="h-12 rounded-lg bg-slate-100" /><div className="h-12 rounded-lg bg-slate-100" />
          </div>
        ) : queue.length ? (
          <ul className="divide-y divide-slate-100">
            {queue.slice(0, 8).map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-primary-50 p-2 text-primary">
                    {item.kind === 'KRA' ? <TargetIcon className="h-4 w-4" /> : <BookIcon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.kind}{item.teacherName ? ` · ${item.teacherName}` : ''}{item.department ? ` · ${item.department}` : ''}
                      {item.createdAt ? ` · Submitted ${new Date(item.createdAt).toLocaleDateString('en-GB')}` : ''}
                    </p>
                  </div>
                </div>
                <Link to={item.href} className="inline-flex min-h-9 items-center rounded-lg border border-primary/20 px-3 text-sm font-semibold text-primary hover:bg-primary-50">Review</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-center text-sm text-slate-500">You are all caught up. No submissions are waiting for review.</p>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <AttendancePieChart counts={todayCounts} loading={isLoading} />
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Attendance trend</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Attendance rate by week</h2>
          {attendance.loading && weeklyRates.length === 0 ? (
            <div className="mt-4 h-64 animate-pulse rounded-xl bg-slate-100" />
          ) : weeklyRates.length ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRates} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Attendance rate']} />
                  <Bar dataKey="rate" fill="#087443" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Weekly attendance rates will appear when data is available.</p>
          )}
        </section>
      </div>

      {role === 'head' || role === 'deputy' ? (
        <DepartmentBarChart departments={attendance.data?.departments ?? []} loading={attendance.loading} />
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Live attendance</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Today&apos;s staff list</h2>
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Filter staff attendance">
            {(['all', 'absent', 'late'] as const).map((filter) => (
              <button key={filter} type="button" aria-pressed={staffFilter === filter} onClick={() => setStaffFilter(filter)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${staffFilter === filter ? 'bg-white text-primary shadow-sm' : 'text-slate-600'}`}>
                {filter === 'all' ? 'Everyone' : filter}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="animate-pulse space-y-3 p-5"><div className="h-10 rounded bg-slate-100" /><div className="h-10 rounded bg-slate-100" /></div>
        ) : visibleStaff.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No staff match this attendance filter.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3">Teacher</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Check-in</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleStaff.map((member) => <StaffAttendanceRow key={String(member.id ?? member.name)} member={member} />)}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 sm:hidden">
              {visibleStaff.map((member) => (
                <li key={String(member.id ?? member.name)} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{member.name}</p><p className="text-xs text-slate-500">{member.department || 'No department'} · {formatTime(member.today?.checkIn)}</p></div>
                  <StatusBadge status={member.today?.status ?? 'Not marked'} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <UpcomingCalendar variant="card" />
        <SchoolUpdatesCard limit={3} title="Recent updates" />
      </div>
    </div>
  )
}

function StaffAttendanceRow({ member }: { member: StaffMember }) {
  return (
    <tr>
      <td className="px-5 py-3.5 font-semibold text-slate-900">{member.name}</td>
      <td className="px-5 py-3.5 text-slate-600">{member.department || '—'}</td>
      <td className="px-5 py-3.5"><StatusBadge status={member.today?.status ?? 'Not marked'} /></td>
      <td className="px-5 py-3.5 font-mono text-slate-600">{formatTime(member.today?.checkIn)}</td>
    </tr>
  )
}
