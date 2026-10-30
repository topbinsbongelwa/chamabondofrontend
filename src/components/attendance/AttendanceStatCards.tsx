import type { ComponentType, SVGProps } from 'react'
import { ATTENDANCE_STATUS_META } from '../../constants/attendance'
import type { AttendanceRangeStats } from '../../lib/attendanceStats'
import {
  AlertIcon,
  BookIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  TargetIcon,
} from '../icons'

interface StatCard {
  key: string
  label: string
  value: number
  suffix?: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  iconClass: string
  textClass: string
}

interface AttendanceStatCardsProps {
  stats: AttendanceRangeStats | null
  loading?: boolean
  periodLabel?: string
}

function percentage(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`
}

function buildCards(stats: AttendanceRangeStats | null): StatCard[] {
  const present = ATTENDANCE_STATUS_META.present
  const late = ATTENDANCE_STATUS_META.late
  const sick = ATTENDANCE_STATUS_META['sick-leave']
  const schoolDuty = ATTENDANCE_STATUS_META['school-duty']
  const sportsDuty = ATTENDANCE_STATUS_META['sports-duty']
  const absent = ATTENDANCE_STATUS_META.absent

  return [
    {
      key: 'working',
      label: 'Working Days',
      value: stats?.workingDays ?? 0,
      suffix: 'days',
      icon: CalendarIcon,
      iconClass: 'bg-primary-50 text-primary',
      textClass: 'text-slate-900',
    },
    {
      key: 'attended',
      label: 'Attended Days',
      value: stats?.attendedDays ?? 0,
      suffix: 'days',
      icon: CheckIcon,
      iconClass: present.iconClass,
      textClass: present.textClass,
    },
    {
      key: 'rate',
      label: 'Attendance Rate',
      value: stats?.attendanceRate ?? 0,
      suffix: '%',
      icon: ChartBarIcon,
      iconClass: 'bg-gold/10 text-gold-700',
      textClass: 'text-gold-700',
    },
    {
      key: 'sick',
      label: 'Sick Leave',
      value: stats?.counts['sick-leave'] ?? 0,
      suffix: 'days',
      icon: AlertIcon,
      iconClass: sick.iconClass,
      textClass: sick.textClass,
    },
    {
      key: 'school-duty',
      label: 'School Duty',
      value: stats?.counts['school-duty'] ?? 0,
      suffix: 'days',
      icon: BookIcon,
      iconClass: schoolDuty.iconClass,
      textClass: schoolDuty.textClass,
    },
    {
      key: 'sports-duty',
      label: 'Sports/Activities Duty',
      value: stats?.counts['sports-duty'] ?? 0,
      suffix: 'days',
      icon: TargetIcon,
      iconClass: sportsDuty.iconClass,
      textClass: sportsDuty.textClass,
    },
    {
      key: 'late',
      label: 'Late Days',
      value: stats?.counts.late ?? 0,
      suffix: 'days',
      icon: ClockIcon,
      iconClass: late.iconClass,
      textClass: late.textClass,
    },
    {
      key: 'absent',
      label: 'Absent Days',
      value: stats?.counts.absent ?? 0,
      suffix: 'days',
      icon: CloseIcon,
      iconClass: absent.iconClass,
      textClass: absent.textClass,
    },
  ]
}

export function AttendanceStatCards({
  stats,
  loading = false,
  periodLabel,
}: AttendanceStatCardsProps) {
  const cards = buildCards(stats)

  return (
    <section
      aria-labelledby="attendance-stats-heading"
      aria-busy={loading}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Attendance summary
          </p>
          <h2
            id="attendance-stats-heading"
            className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            Your period at a glance
          </h2>
          {periodLabel ? (
            <p className="mt-1 text-sm text-slate-500">{periodLabel}</p>
          ) : null}
        </div>

        {loading ? (
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
            Updating…
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.key}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase leading-snug tracking-wide text-slate-500">
                  {card.label}
                </p>
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              {loading && !stats ? (
                <div className="mt-2 h-8 w-16 animate-pulse rounded-md bg-slate-200/70" />
              ) : (
                <p
                  className={`mt-1.5 text-2xl font-bold tabular-nums ${card.textClass}`}
                >
                  {card.key === 'rate' ? percentage(card.value) : card.value}
                  {card.key !== 'rate' && card.suffix ? (
                    <span className="ml-1 text-xs font-semibold text-slate-400">
                      {card.suffix}
                    </span>
                  ) : null}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
