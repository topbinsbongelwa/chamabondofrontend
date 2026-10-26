import type { ComponentType, SVGProps } from 'react'
import { statusKey } from '../../lib/attendance'
import type { StaffMember } from '../../lib/staff'
import { AlertIcon, CalendarIcon, CheckIcon, ClockIcon, UsersIcon } from '../icons'

const AWAY_STATUSES = [
  'sick-leave',
  'leave',
  'holiday',
  'school-duty',
  'sports-duty',
  'absent',
]

interface StaffStatsProps {
  staff: StaffMember[]
  loading: boolean
  error: string | null
}

interface StatCard {
  label: string
  hint: string
  value: number
  icon: ComponentType<SVGProps<SVGSVGElement>>
  iconClass: string
  valueClass: string
}

export function StaffStats({ staff, loading, error }: StaffStatsProps) {
  const keys = staff.map((member) => statusKey(member.today?.status))
  const present = keys.filter((key) => key === 'present').length
  const late = keys.filter((key) => key === 'late').length
  const away = keys.filter((key) => AWAY_STATUSES.includes(key)).length
  const notMarked = Math.max(staff.length - present - late - away, 0)

  const cards: StatCard[] = [
    {
      label: 'Total staff',
      hint: `${notMarked} not marked today`,
      value: staff.length,
      icon: UsersIcon,
      iconClass: 'bg-primary-50 text-primary',
      valueClass: 'text-slate-900',
    },
    {
      label: 'Present',
      hint: 'Checked in today',
      value: present,
      icon: CheckIcon,
      iconClass: 'bg-emerald-50 text-emerald-600',
      valueClass: 'text-emerald-700',
    },
    {
      label: 'Late',
      hint: 'Arrived late today',
      value: late,
      icon: ClockIcon,
      iconClass: 'bg-amber-50 text-amber-600',
      valueClass: 'text-amber-700',
    },
    {
      label: 'Away',
      hint: 'Leave or absent',
      value: away,
      icon: away > 0 ? AlertIcon : CalendarIcon,
      iconClass: 'bg-blue-50 text-blue-600',
      valueClass: 'text-blue-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>

            {loading ? (
              <div className="mt-2 h-9 w-14 animate-pulse rounded-lg bg-slate-100" />
            ) : error ? (
              <p className="mt-1 text-3xl font-bold text-slate-300">—</p>
            ) : (
              <p className={`mt-1 text-3xl font-bold tabular-nums ${card.valueClass}`}>
                {card.value}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
          </div>
        )
      })}
    </div>
  )
}
