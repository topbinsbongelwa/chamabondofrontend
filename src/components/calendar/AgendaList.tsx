import { CALENDAR_TYPE_META } from '../../constants/calendar'
import {
  calendarItemsForMonth,
  formatCalendarDateHeading,
  formatCalendarTimeRange,
  formatCalendarCategory,
  monthDateKeys,
  todayKey,
  type CalendarItem,
} from '../../lib/calendar'
import { CalendarIcon, MapPinIcon } from '../icons'
import { CalendarTypeBadge } from './CalendarBadges'

interface AgendaListProps {
  month: Date
  items: CalendarItem[]
  onSelectItem: (item: CalendarItem) => void
}

export function AgendaList({ month, items, onSelectItem }: AgendaListProps) {
  const monthItems = calendarItemsForMonth(items, month)
  const { from } = monthDateKeys(month)
  const today = todayKey()

  if (monthItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
          <CalendarIcon className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          Nothing scheduled this month
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Events, activities and deadlines for this month will appear here.
        </p>
      </div>
    )
  }

  const grouped = new Map<string, CalendarItem[]>()

  for (const item of monthItems) {
    const dateKey = item.startDate < from ? from : item.startDate
    const group = grouped.get(dateKey) ?? []
    group.push(item)
    grouped.set(dateKey, group)
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([dateKey, dayItems]) => (
        <section
          key={dateKey}
          aria-label={formatCalendarDateHeading(dateKey)}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
        >
          <div
            className={`flex items-center gap-2 border-b px-4 py-2.5 ${
              dateKey === today
                ? 'border-primary/20 bg-primary-50'
                : 'border-slate-100 bg-slate-50/70'
            }`}
          >
            <span
              className={`text-sm font-bold ${
                dateKey === today ? 'text-primary' : 'text-slate-700'
              }`}
            >
              {formatCalendarDateHeading(dateKey)}
            </span>
            {dateKey === today ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                Today
              </span>
            ) : null}
          </div>

          <div className="divide-y divide-slate-100">
            {dayItems.map((item) => {
              const meta = CALENDAR_TYPE_META[item.type]

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {item.title}
                      </span>
                      <CalendarTypeBadge type={item.type} />
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-600">
                        {formatCalendarTimeRange(item)}
                      </span>
                      <span>{formatCalendarCategory(item.category)}</span>
                      {item.venue ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="h-3.5 w-3.5" />
                          {item.venue}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
