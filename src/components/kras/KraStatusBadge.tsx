import {
  KRA_STATUS_BADGES,
  KRA_STATUS_DOTS,
  kraStatusLabel,
  type KraStatus,
} from '../../lib/kras'

interface KraStatusBadgeProps {
  status: KraStatus
}

export function KraStatusBadge({ status }: KraStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${KRA_STATUS_BADGES[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${KRA_STATUS_DOTS[status]}`}
        aria-hidden="true"
      />
      {kraStatusLabel(status)}
    </span>
  )
}
