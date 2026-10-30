import { useEffect, useRef } from 'react'
import {
  CALENDAR_AUDIENCE_LABELS,
  CALENDAR_PRIORITY_LABELS,
} from '../../constants/calendar'
import {
  formatCalendarCategory,
  formatCalendarDateRange,
  formatCalendarTimeRange,
  type CalendarItem,
} from '../../lib/calendar'
import { formatDate } from '../../lib/format'
import {
  CalendarIcon,
  ClockIcon,
  CloseIcon,
  MapPinIcon,
  PencilIcon,
  PinIcon,
  SpinnerIcon,
  TrashIcon,
  UsersIcon,
} from '../icons'
import {
  CalendarPinnedBadge,
  CalendarPriorityBadge,
  CalendarTypeBadge,
} from './CalendarBadges'

interface CalendarItemDrawerProps {
  item: CalendarItem
  canManage: boolean
  canPin: boolean
  pinBusy: boolean
  onClose: () => void
  onEdit: (item: CalendarItem) => void
  onDelete: (item: CalendarItem) => void
  onTogglePin: (item: CalendarItem) => void
}

export function CalendarItemDrawer({
  item,
  canManage,
  canPin,
  pinBusy,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
}: CalendarItemDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement as HTMLElement | null

    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[58] flex justify-end">
      <button
        type="button"
        aria-label="Close item details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-item-title"
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl motion-safe:animate-fade-in"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <CalendarTypeBadge type={item.type} />
              {item.pinned ? <CalendarPinnedBadge /> : null}
              <CalendarPriorityBadge priority={item.priority} />
            </div>
            <h2
              id="calendar-item-title"
              className="mt-2 text-xl font-bold tracking-tight text-slate-900"
            >
              {item.title}
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {formatCalendarCategory(item.category)}
            </p>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close item details"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <dl className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start gap-2.5">
              <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Date
                </dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {formatCalendarDateRange(item)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Time
                </dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {formatCalendarTimeRange(item)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Venue
                </dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {item.venue ?? 'Not specified'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <UsersIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Audience
                </dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {CALENDAR_AUDIENCE_LABELS[item.audience]}
                  {item.audience === 'department' && item.department
                    ? ` · ${item.department}`
                    : ''}
                </dd>
              </div>
            </div>
          </dl>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Description
            </h3>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {item.description || 'No description was provided.'}
            </p>
          </section>

          {item.type === 'activity' ? (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Assigned teachers
              </h3>
              {item.assignedTeachers.length === 0 ? (
                <p className="mt-1.5 text-sm text-slate-500">
                  No teachers assigned yet.
                </p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {item.assignedTeachers.map((teacher) => (
                    <li
                      key={`${teacher.id ?? teacher.name}`}
                      className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/10"
                    >
                      {teacher.name}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {item.type === 'update' ? (
            <section className="space-y-1.5 rounded-xl border border-slate-100 bg-white p-3">
              <p className="text-xs text-slate-500">
                Priority:{' '}
                <span className="font-semibold text-slate-700">
                  {CALENDAR_PRIORITY_LABELS[item.priority]}
                </span>
              </p>
              {item.expiresAt ? (
                <p className="text-xs text-slate-500">
                  Expires:{' '}
                  <span className="font-semibold text-slate-700">
                    {formatDate(item.expiresAt)}
                  </span>
                </p>
              ) : null}
            </section>
          ) : null}

          <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">
            <p>Created by {item.createdBy ?? 'School leadership'}</p>
            {item.createdAt ? (
              <p className="mt-0.5">Posted {formatDate(item.createdAt)}</p>
            ) : null}
          </div>
        </div>

        {canManage || canPin ? (
          <div className="border-t border-slate-100 bg-slate-50/70 p-4">
            <div className="flex flex-wrap gap-2">
              {canManage ? (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white transition hover:bg-primary-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </>
              ) : null}

              {canPin ? (
                <button
                  type="button"
                  onClick={() => onTogglePin(item)}
                  disabled={pinBusy}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {pinBusy ? (
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <PinIcon className="h-4 w-4" />
                  )}
                  {item.pinned ? 'Unpin' : 'Pin'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
