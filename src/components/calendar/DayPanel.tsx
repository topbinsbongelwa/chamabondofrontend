import { CALENDAR_TYPE_META } from '../../constants/calendar'
import {
  calendarItemsForDate,
  formatCalendarCategory,
  formatCalendarDateHeading,
  formatCalendarTimeRange,
  type CalendarItem,
} from '../../lib/calendar'
import { CalendarIcon, MapPinIcon } from '../icons'
import { CalendarTypeBadge } from './CalendarBadges'

interface DayPanelProps {
  dateKey: string | null
  items: CalendarItem[]
  onSelectItem: (item: CalendarItem) => void
}

export function DayPanel({ dateKey, items, onSelectItem }: DayPanelProps) {
  const dayItems = dateKey ? calendarItemsForDate(items, dateKey) : []

  return (
    <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 bg-primary-50/60 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          Day plan
        </p>
        <h2 className="mt-0.5 text-sm font-bold text-slate-900">
          {dateKey ? formatCalendarDateHeading(dateKey) : 'Select a day'}
        </h2>
        {dateKey ? (
          <p className="mt-0.5 text-xs text-slate-500">
            {dayItems.length === 0
              ? 'No items scheduled'
              : `${dayItems.length} item${dayItems.length === 1 ? '' : 's'}`}
          </p>
        ) : null}
      </div>

      {!dateKey ? (
        <p className="px-4 py-6 text-sm text-slate-500">
          Tap a day in the calendar to see everything scheduled.
        </p>
      ) : dayItems.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            A clear day
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Nothing is scheduled for this date.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {dayItems.map((item) => {
            const meta = CALENDAR_TYPE_META[item.type]

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectItem(item)}
                className={`flex w-full items-start gap-3 border-l-4 px-4 py-3 text-left transition hover:bg-slate-50 ${meta.accent}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">
                      {item.title}
                    </span>
                    {item.pinned ? (
                      <span className="rounded-full bg-primary-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                        Pinned
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">
                      {formatCalendarTimeRange(item)}
                    </span>
                    <span>{formatCalendarCategory(item.category)}</span>
                    {item.venue ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        {item.venue}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    <CalendarTypeBadge type={item.type} />
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}
