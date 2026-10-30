import {
  CALENDAR_PRIORITY_LABELS,
  CALENDAR_TYPE_META,
  type CalendarItemType,
  type CalendarPriority,
} from '../../constants/calendar'
import { PinIcon } from '../icons'

interface CalendarTypeBadgeProps {
  type: CalendarItemType
  className?: string
}

export function CalendarTypeBadge({
  type,
  className = '',
}: CalendarTypeBadgeProps) {
  const meta = CALENDAR_TYPE_META[type]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${meta.badge} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  )
}

interface CalendarPriorityBadgeProps {
  priority: CalendarPriority
}

export function CalendarPriorityBadge({
  priority,
}: CalendarPriorityBadgeProps) {
  if (priority !== 'important') return null

  return (
    <span className="inline-flex items-center rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-700 ring-1 ring-inset ring-gold/30">
      {CALENDAR_PRIORITY_LABELS.important}
    </span>
  )
}

export function CalendarPinnedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary ring-1 ring-inset ring-primary/10">
      <PinIcon className="h-3 w-3" />
      Pinned
    </span>
  )
}

export function CalendarAssignedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
      You are assigned
    </span>
  )
}
