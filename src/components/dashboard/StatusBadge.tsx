import { statusKey, statusLabel, type AttendanceStatusKey } from '../../lib/attendance'

const BADGE_STYLES: Record<AttendanceStatusKey, string> = {
  present: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  late: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  'sick-leave': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  leave: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  holiday: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'official-duty': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  absent: 'bg-red-50 text-red-700 ring-red-600/20',
  unknown: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const DOT_STYLES: Record<AttendanceStatusKey, string> = {
  present: 'bg-emerald-500',
  late: 'bg-amber-500',
  'sick-leave': 'bg-blue-500',
  leave: 'bg-blue-500',
  holiday: 'bg-blue-500',
  'official-duty': 'bg-blue-500',
  absent: 'bg-red-500',
  unknown: 'bg-slate-400',
}

interface StatusBadgeProps {
  status?: string | null
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = statusKey(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${BADGE_STYLES[key]}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_STYLES[key]}`}
        aria-hidden="true"
      />
      {statusLabel(status)}
    </span>
  )
}
