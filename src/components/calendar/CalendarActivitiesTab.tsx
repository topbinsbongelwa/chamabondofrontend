import { useMemo } from 'react'
import { CALENDAR_TYPE_META } from '../../constants/calendar'
import type { StoredUser } from '../../lib/auth'
import {
  formatCalendarCategory,
  formatCalendarTimeRange,
  isCalendarItemAssignedToMe,
  isCalendarItemUpcoming,
  sortCalendarItems,
  type CalendarItem,
} from '../../lib/calendar'
import { formatDate } from '../../lib/format'
import {
  CalendarAssignedBadge,
  CalendarTypeBadge,
} from './CalendarBadges'
import { UpcomingCalendar } from './UpcomingCalendar'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
} from '../icons'

interface CalendarActivitiesTabProps {
  items: CalendarItem[]
  loading: boolean
  currentUser: StoredUser | null
  refreshKey: number
  onSelectItem: (item: CalendarItem) => void
}

export function CalendarActivitiesTab({
  items,
  loading,
  currentUser,
  refreshKey,
  onSelectItem,
}: CalendarActivitiesTabProps) {
  const upcoming = useMemo(
    () =>
      sortCalendarItems(
        items.filter(
          (item) =>
            (item.type === 'activity' || item.type === 'event') &&
            isCalendarItemUpcoming(item),
        ),
      ),
    [items],
  )

  return (
    <div className="space-y-5">
      <UpcomingCalendar
        variant="strip"
        refreshKey={refreshKey}
        onSelectItem={onSelectItem}
      />

      <section aria-labelledby="activities-list-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Plan ahead
            </p>
            <h2
              id="activities-list-heading"
              className="mt-0.5 text-lg font-bold text-slate-900"
            >
              Upcoming activities &amp; events
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Activities and events that are still ahead.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {upcoming.length} item{upcoming.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
            <p className="sr-only" role="status">
              Loading activities
            </p>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <CalendarIcon className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No upcoming activities
            </p>
            <p className="mt-1 text-sm text-slate-500">
              New activities and events will appear here as they are scheduled.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((item) => {
              const meta = CALENDAR_TYPE_META[item.type]
              const assignedToMe = isCalendarItemAssignedToMe(item, currentUser)
              const teachers = item.assignedTeachers

              return (
                <article
                  key={item.id}
                  className={`overflow-hidden rounded-2xl border border-slate-200 border-l-4 bg-white shadow-card ${meta.accent}`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="block w-full p-4 text-left transition hover:bg-slate-50/70 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <CalendarTypeBadge type={item.type} />
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        {formatCalendarCategory(item.category)}
                      </span>
                      {assignedToMe ? <CalendarAssignedBadge /> : null}
                    </div>

                    <h3 className="mt-2 text-base font-bold text-slate-900 sm:text-lg">
                      {item.title}
                    </h3>

                    <dl className="mt-2 grid gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
                        <dt className="sr-only">Date</dt>
                        <dd className="font-semibold text-slate-600">
                          {formatDate(item.startDate)}
                          {item.endDate && item.endDate !== item.startDate
                            ? ` – ${formatDate(item.endDate)}`
                            : ''}
                        </dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
                        <dt className="sr-only">Time</dt>
                        <dd className="font-semibold text-slate-600">
                          {formatCalendarTimeRange(item)}
                        </dd>
                      </div>
                      {item.venue ? (
                        <div className="flex items-center gap-1.5">
                          <MapPinIcon className="h-4 w-4 shrink-0 text-slate-400" />
                          <dt className="sr-only">Venue</dt>
                          <dd className="truncate">{item.venue}</dd>
                        </div>
                      ) : null}
                      <div className="flex items-start gap-1.5">
                        <UsersIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <dt className="sr-only">Assigned teachers</dt>
                        <dd className="min-w-0">
                          {teachers.length > 0
                            ? teachers.map((teacher) => teacher.name).join(', ')
                            : 'No teachers assigned'}
                        </dd>
                      </div>
                    </dl>
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
