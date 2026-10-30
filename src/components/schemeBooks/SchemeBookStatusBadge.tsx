import {
  SCHEME_BOOK_STATUS_BADGES,
  SCHEME_BOOK_STATUS_DOTS,
  schemeBookStatusLabel,
  type SchemeBookStatus,
} from '../../lib/schemeBooks'

interface SchemeBookStatusBadgeProps {
  status: SchemeBookStatus
}

export function SchemeBookStatusBadge({
  status,
}: SchemeBookStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${SCHEME_BOOK_STATUS_BADGES[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCHEME_BOOK_STATUS_DOTS[status]}`}
        aria-hidden="true"
      />
      {schemeBookStatusLabel(status)}
    </span>
  )
}
