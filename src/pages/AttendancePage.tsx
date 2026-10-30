import { useState } from 'react'
import { MyAttendanceTab } from '../components/attendance/MyAttendanceTab'
import { SchoolOverviewTab } from '../components/attendance/SchoolOverviewTab'
import { CheckIcon, UsersIcon } from '../components/icons'
import { getRole, isAdminRole } from '../lib/roles'

type AttendanceTab = 'mine' | 'school'

interface AttendancePageProps {
  defaultTab?: AttendanceTab
}

export function AttendancePage({ defaultTab = 'mine' }: AttendancePageProps) {
  const role = getRole()
  const canViewSchool = isAdminRole(role)
  const [tab, setTab] = useState<AttendanceTab>(
    canViewSchool ? defaultTab : 'mine',
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Attendance
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <CheckIcon className="h-5 w-5" />
            </span>
            Attendance
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {canViewSchool
              ? 'Check in, review your own attendance and monitor attendance across the school.'
              : 'Check in, review your attendance and follow your attendance trend over time.'}
          </p>
        </div>

        <div className="hidden h-px w-24 bg-gold/50 sm:block" />
      </div>

      {canViewSchool ? (
        <div
          role="tablist"
          aria-label="Attendance views"
          className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex"
        >
          <button
            id="attendance-mine-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'mine'}
            aria-controls="attendance-mine-panel"
            onClick={() => setTab('mine')}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
              tab === 'mine'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CheckIcon className="h-4 w-4" />
            My Attendance
          </button>

          <button
            id="attendance-school-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'school'}
            aria-controls="attendance-school-panel"
            onClick={() => setTab('school')}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
              tab === 'school'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            School Overview
          </button>
        </div>
      ) : null}

      <div
        id="attendance-mine-panel"
        role="tabpanel"
        aria-labelledby="attendance-mine-tab"
        hidden={canViewSchool && tab !== 'mine'}
      >
        <MyAttendanceTab />
      </div>

      {canViewSchool ? (
        <div
          id="attendance-school-panel"
          role="tabpanel"
          aria-labelledby="attendance-school-tab"
          hidden={tab !== 'school'}
        >
          {tab === 'school' ? <SchoolOverviewTab /> : null}
        </div>
      ) : null}
    </div>
  )
}
