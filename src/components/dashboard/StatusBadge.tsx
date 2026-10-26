import { ATTENDANCE_STATUS_META } from '../../constants/attendance'
import { statusKey, statusLabel } from '../../lib/attendance'

interface StatusBadgeProps {
  status?: string | null
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const key = statusKey(status)
  const meta = ATTENDANCE_STATUS_META[key]

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badgeClass}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass}`}
        aria-hidden="true"
      />
      {label ?? statusLabel(status)}
    </span>
  )
}
