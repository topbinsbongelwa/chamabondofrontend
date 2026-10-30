import {
  CALENDAR_TYPE_META,
  CALENDAR_TYPES,
} from '../../constants/calendar'

export function CalendarLegend() {
  return (
    <div
      aria-label="Calendar colour legend"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-slate-500"
    >
      {CALENDAR_TYPES.map((type) => (
        <span key={type} className="inline-flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${CALENDAR_TYPE_META[type].dot}`}
            aria-hidden="true"
          />
          {CALENDAR_TYPE_META[type].label}
        </span>
      ))}
    </div>
  )
}
