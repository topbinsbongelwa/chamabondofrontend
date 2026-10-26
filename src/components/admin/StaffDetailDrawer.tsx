import { useEffect, useRef } from 'react'
import { statusKey, type AttendanceStatusKey } from '../../lib/attendance'
import { formatDate, formatTime } from '../../lib/format'
import { formatRoleLabel } from '../../lib/roles'
import { getInitials } from '../../lib/auth'
import type { StaffMember } from '../../lib/staff'
import { CalendarIcon, CloseIcon } from '../icons'
import { StatusBadge } from '../dashboard/StatusBadge'

const SUMMARY_ITEMS: {
  key: keyof StaffMember['summary']
  label: string
  valueClass: string
}[] = [
  { key: 'present', label: 'Present', valueClass: 'text-emerald-700' },
  { key: 'late', label: 'Late', valueClass: 'text-amber-700' },
  { key: 'sickLeave', label: 'Sick Leave', valueClass: 'text-blue-700' },
  { key: 'leave', label: 'Leave', valueClass: 'text-purple-700' },
  { key: 'absent', label: 'Absent', valueClass: 'text-red-700' },
]

const AWAY_STATUSES: AttendanceStatusKey[] = [
  'sick-leave',
  'leave',
  'holiday',
  'school-duty',
  'sports-duty',
  'absent',
]

interface StaffDetailDrawerProps {
  member: StaffMember
  onClose: () => void
}

export function StaffDetailDrawer({ member, onClose }: StaffDetailDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const todayStatus = member.today?.status ?? 'Not marked'
  const todayKey = statusKey(todayStatus)
  const isAway = AWAY_STATUSES.includes(todayKey)

  const approval =
    member.approved === true
      ? {
          label: 'Approved',
          className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        }
      : member.approved === false
        ? {
            label: 'Pending approval',
            className: 'bg-amber-50 text-amber-800 ring-amber-600/20',
          }
        : {
            label: 'Approval unknown',
            className: 'bg-slate-100 text-slate-600 ring-slate-500/20',
          }

  const details = [
    { label: 'EC number', value: member.ecNumber },
    { label: 'Department', value: member.department },
    { label: 'Phone', value: member.phone },
    { label: 'Email', value: member.email },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close staff details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-detail-heading"
        className="animate-fade-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="relative shrink-0 bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-5 pt-4">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative flex items-start gap-4">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-gold/70 bg-white/10 text-lg font-bold text-white">
              {getInitials(member.name)}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-100">
                Staff profile
              </p>
              <h2
                id="staff-detail-heading"
                className="mt-0.5 truncate text-xl font-bold text-white"
              >
                {member.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-primary-100">
                {formatRoleLabel(member.role)}
                {member.department ? ` · ${member.department}` : ''}
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close staff details"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${approval.className}`}
            >
              {approval.label}
            </span>
            <StatusBadge status={todayStatus} />
          </div>

          {details.length > 0 ? (
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {details.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          <section className="mt-6">
            <h3 className="text-sm font-bold text-slate-900">Today</h3>
            <div className="mt-2.5 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Check-in
                </p>
                <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-slate-800">
                  {formatTime(member.today?.checkIn)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Check-out
                </p>
                <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-slate-800">
                  {formatTime(member.today?.checkOut)}
                </p>
              </div>
            </div>
            {isAway ? (
              <p className="mt-2 text-xs text-slate-500">
                This staff member is marked away from school today.
              </p>
            ) : null}
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold text-slate-900">
              This month&apos;s attendance
            </h3>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {SUMMARY_ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2.5 text-center"
                >
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p
                    className={`mt-0.5 text-lg font-bold tabular-nums ${item.valueClass}`}
                  >
                    {member.summary[item.key]}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold text-slate-900">Recent records</h3>
            {member.recent.length === 0 ? (
              <div className="mt-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <CalendarIcon className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-1.5 text-xs text-slate-500">
                  No recent attendance records available.
                </p>
              </div>
            ) : (
              <ul className="mt-2.5 divide-y divide-slate-100 rounded-xl border border-slate-100">
                {member.recent.slice(0, 6).map((record, index) => (
                  <li
                    key={`${record.id ?? record.date}-${index}`}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {formatDate(record.date)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatTime(record.checkIn)} – {formatTime(record.checkOut)}
                      </p>
                    </div>
                    <StatusBadge status={record.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="shrink-0 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
