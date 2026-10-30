import { CALENDAR_TYPE_META } from '../../constants/calendar'
import {
  addDays,
  calendarItemsForDate,
  dateKeyFromDateValue,
  formatCalendarTimeRange,
  startOfMonth,
  startOfWeekMonday,
  todayKey,
  type CalendarItem,
} from '../../lib/calendar'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS_IN_GRID = 42

interface MonthGridProps {
  month: Date
  items: CalendarItem[]
  selectedDate: string | null
  onSelectDate: (dateKey: string) => void
  onSelectItem: (item: CalendarItem) => void
}

export function MonthGrid({
  month,
  items,
  selectedDate,
  onSelectDate,
  onSelectItem,
}: MonthGridProps) {
  const gridStart = startOfWeekMonday(startOfMonth(month))
  const today = todayKey()
  const days = Array.from({ length: DAYS_IN_GRID }, (_, index) =>
    addDays(gridStart, index),
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:px-2 sm:text-[11px]"
          >
            <span className="sm:hidden">{day.charAt(0)}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dateKey = dateKeyFromDateValue(day)
          const dayItems = calendarItemsForDate(items, dateKey)
          const visibleItems = dayItems.slice(0, 3)
          const isCurrentMonth = day.getMonth() === month.getMonth()
          const isToday = dateKey === today
          const isSelected = dateKey === selectedDate

          return (
            <div
              key={dateKey}
              role="group"
              aria-label={`Items for ${day.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}`}
              onClick={() => onSelectDate(dateKey)}
              className={`min-h-[76px] cursor-pointer border-b border-r border-slate-100 p-1 text-left align-top transition sm:min-h-[108px] sm:p-1.5 ${
                index % 7 === 6 ? 'border-r-0' : ''
              } ${
                isSelected
                  ? 'bg-primary-50/80 ring-2 ring-inset ring-primary/30'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelectDate(dateKey)
                  }}
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={`Show items for ${day.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}`}
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-bold tabular-nums transition focus-visible:z-10 sm:h-7 sm:min-w-7 sm:text-sm ${
                    isToday
                      ? 'bg-primary text-white'
                      : isCurrentMonth
                        ? 'text-slate-800 hover:bg-white'
                        : 'text-slate-300 hover:bg-white'
                  }`}
                >
                  {day.getDate()}
                </button>
                {dayItems.length > 0 ? (
                  <span className="hidden text-[9px] font-semibold text-slate-400 sm:inline">
                    {dayItems.length}
                  </span>
                ) : null}
              </div>

              <div className="mt-1 space-y-0.5 overflow-hidden">
                {visibleItems.map((item, itemIndex) => {
                  const meta = CALENDAR_TYPE_META[item.type]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={`${item.title} · ${formatCalendarTimeRange(item)}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onSelectItem(item)
                      }}
                      className={`flex w-full items-center gap-1 truncate rounded border px-1 py-0.5 text-left text-[9px] font-semibold leading-tight transition hover:brightness-95 sm:px-1.5 sm:text-[10px] ${meta.chip} ${
                        itemIndex === 2 ? 'hidden sm:flex' : ''
                      }`}
                    >
                      <span
                        className={`h-1 w-1 shrink-0 rounded-full ${meta.dot}`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.title}</span>
                    </button>
                  )
                })}

                {dayItems.length > visibleItems.length ? (
                  <p className="px-1 text-[9px] font-semibold text-slate-400 sm:text-[10px]">
                    +{dayItems.length - visibleItems.length} more
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
