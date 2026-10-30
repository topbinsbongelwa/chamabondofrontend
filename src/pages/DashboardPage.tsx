import { useState } from 'react'
import { UpcomingCalendar } from '../components/calendar/UpcomingCalendar'
import { MonthlySummary } from '../components/dashboard/MonthlySummary'
import { RecentAttendanceTable } from '../components/dashboard/RecentAttendanceTable'
import { SchoolUpdatesCard } from '../components/dashboard/SchoolUpdatesCard'
import { TodayAttendanceCard } from '../components/dashboard/TodayAttendanceCard'
import { useAttendanceSummary } from '../hooks/useAttendanceSummary'
import { getDisplayName } from '../lib/auth'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const [refreshToken, setRefreshToken] = useState(0)
  const { summary, loading, error, reload } = useAttendanceSummary(refreshToken)
  const firstName = getDisplayName().split(/\s+/)[0]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here is your attendance at a glance.
          </p>
        </div>

        <div className="hidden h-px w-24 bg-gold/50 sm:block" />
      </div>

      <SchoolUpdatesCard limit={3} title="Recent updates" />

      <UpcomingCalendar variant="card" />

      <TodayAttendanceCard
        onChanged={() => setRefreshToken((token) => token + 1)}
      />

      <MonthlySummary
        summary={summary}
        loading={loading}
        error={error}
        onRetry={reload}
      />

      <RecentAttendanceTable refreshToken={refreshToken} />
    </div>
  )
}
