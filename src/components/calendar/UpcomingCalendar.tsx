import { Link } from 'react-router-dom'
import { CALENDAR_TYPE_META } from '../../constants/calendar'
import { useUpcomingCalendar } from '../../hooks/useUpcomingCalendar'
import {
  formatCalendarTimeRange,
  type CalendarItem,
} from '../../lib/calendar'
import { formatDate } from '../../lib/format'
import { isAdmin } from '../../lib/roles'
import {
  AlertIcon,
  CalendarIcon,
  MapPinIcon,
  RefreshIcon,
} from '../icons'
import { CalendarTypeBadge } from './CalendarBadges'

interface UpcomingCalendarProps {
  variant?: 'strip' | 'card'
  refreshKey?: number
  onSelectItem?: (item: CalendarItem) => void
}

interface UpcomingRowProps {
  item: CalendarItem
  onSelectItem?: (item: CalendarItem) => void
  compact?: boolean
}

function UpcomingRow({ item, onSelectItem, compact = false }: UpcomingRowProps) {
  const meta = CALENDAR_TYPE_META[item.type]

  const content = (
    <>
      <span
        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500">
            {formatDate(item.startDate)}
          </span>
          {!compact ? <CalendarTypeBadge type={item.type} /> : null}
        </span>
        <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
          {item.title}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
          <span>{formatCalendarTimeRange(item)}</span>
          {item.venue ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPinIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.venue}</span>
            </span>
          ) : null}
        </span>
      </span>
    </>
  )

  if (onSelectItem) {
    return (
      <button
        type="button"
        onClick={() => onSelectItem(item)}
        className="flex w-full items-start gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:border-primary/20 hover:bg-primary-50/50"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex w-full items-start gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      {content}
    </div>
  )
}

export function UpcomingCalendar({
  variant = 'strip',
  refreshKey = 0,
  onSelectItem,
}: UpcomingCalendarProps) {
  const { items, loading, error, usingSavedData, reload } = useUpcomingCalendar(
    5,
    refreshKey,
  )
  const visible = items.slice(0, 5)
  const calendarPath = isAdmin() ? '/admin/calendar' : '/calendar'

  const body = loading && items.length === 0 ? (
    <div className="grid gap-2 sm:grid-cols-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  ) : error && items.length === 0 ? (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
    >
      <p className="flex items-start gap-2 text-xs font-medium text-red-700">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </p>
      <button
        type="button"
        onClick={reload}
        className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
      >
        <RefreshIcon className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  ) : visible.length === 0 ? (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
      <CalendarIcon className="mx-auto h-6 w-6 text-slate-300" />
      <p className="mt-1.5 text-sm font-semibold text-slate-600">
        Nothing coming up
      </p>
      <p className="mt-0.5 text-xs text-slate-400">
        New events and activities will appear here.
      </p>
    </div>
  ) : variant === 'strip' ? (
    <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
      {visible.map((item) => {
        const meta = CALENDAR_TYPE_META[item.type]
        const row = (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                <span className="text-slate-500">{meta.label}</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {formatDate(item.startDate)}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-900">
              {item.title}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              {formatCalendarTimeRange(item)}
            </p>
            {item.venue ? (
              <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-400">
                <MapPinIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{item.venue}</span>
              </p>
            ) : null}
          </>
        )

        return onSelectItem ? (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectItem(item)}
            className={`w-[220px] shrink-0 snap-start rounded-xl border bg-white p-3 text-left shadow-sm transition hover:shadow-md ${meta.chip}`}
          >
            {row}
          </button>
        ) : (
          <div
            key={item.id}
            className={`w-[220px] shrink-0 snap-start rounded-xl border bg-white p-3 shadow-sm ${meta.chip}`}
          >
            {row}
          </div>
        )
      })}
    </div>
  ) : (
    <div className="space-y-2">
      {visible.map((item) => (
        <UpcomingRow
          key={item.id}
          item={item}
          onSelectItem={onSelectItem}
          compact
        />
      ))}
    </div>
  )

  if (variant === 'card') {
    return (
      <section
        aria-labelledby="upcoming-calendar-heading"
        aria-busy={loading}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              School calendar
            </p>
            <h2
              id="upcoming-calendar-heading"
              className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
            >
              Coming up
            </h2>
          </div>
          <Link
            to={calendarPath}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-lg px-2.5 text-sm font-semibold text-primary transition hover:bg-primary-50"
          >
            View calendar
          </Link>
        </div>
        <div className="p-4 sm:p-5">
          {body}
          {usingSavedData ? (
            <p className="mt-2 text-[10px] font-medium text-amber-700">
              Offline, showing saved calendar data.
            </p>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="coming-up-strip-heading"
      aria-busy={loading}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Next 5 items
          </p>
          <h2
            id="coming-up-strip-heading"
            className="mt-0.5 text-base font-bold text-slate-900"
          >
            Coming up
          </h2>
        </div>
        {usingSavedData ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
            Saved data
          </span>
        ) : null}
      </div>
      {body}
    </section>
  )
}
