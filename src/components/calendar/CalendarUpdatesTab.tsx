import { useMemo, useState } from 'react'
import {
  formatCalendarCategory,
  isCalendarItemExpired,
  type CalendarItem,
} from '../../lib/calendar'
import { formatDate } from '../../lib/format'
import {
  CalendarIcon,
  MegaphoneIcon,
  PencilIcon,
  PinIcon,
  SpinnerIcon,
  TrashIcon,
} from '../icons'
import {
  CalendarPinnedBadge,
  CalendarPriorityBadge,
} from './CalendarBadges'

interface CalendarUpdatesTabProps {
  items: CalendarItem[]
  loading: boolean
  canManageItem: (item: CalendarItem) => boolean
  canPin: boolean
  pinBusyId: string | null
  onSelectItem: (item: CalendarItem) => void
  onEdit: (item: CalendarItem) => void
  onDelete: (item: CalendarItem) => void
  onTogglePin: (item: CalendarItem) => void
}

function postedTimestamp(item: CalendarItem): number {
  const raw = item.createdAt ?? item.startDate
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function CalendarUpdatesTab({
  items,
  loading,
  canManageItem,
  canPin,
  pinBusyId,
  onSelectItem,
  onEdit,
  onDelete,
  onTogglePin,
}: CalendarUpdatesTabProps) {
  const [importantOnly, setImportantOnly] = useState(false)
  const [limit, setLimit] = useState(8)

  const updates = useMemo(() => {
    return items
      .filter((item) => item.type === 'update')
      .filter((item) => !isCalendarItemExpired(item))
      .filter((item) => (importantOnly ? item.priority === 'important' : true))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return postedTimestamp(b) - postedTimestamp(a)
      })
  }, [items, importantOnly])

  const visible = updates.slice(0, limit)

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
        <p className="sr-only" role="status">
          Loading updates
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card">
        <div>
          <h2 className="text-base font-bold text-slate-900">School updates</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {updates.length} active update{updates.length === 1 ? '' : 's'}
          </p>
        </div>

        <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          <input
            type="checkbox"
            checked={importantOnly}
            onChange={(event) => {
              setImportantOnly(event.target.checked)
              setLimit(8)
            }}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          Important only
        </label>
      </div>

      {updates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <MegaphoneIcon className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {importantOnly ? 'No important updates' : 'No updates yet'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {importantOnly
              ? 'Try turning off the Important only filter.'
              : 'Announcements from school leadership will appear here.'}
          </p>
        </div>
      ) : (
        <>
          {visible.map((item) => {
            const important = item.priority === 'important'
            const pinBusy = pinBusyId === item.id
            const canManage = canManageItem(item)

            return (
              <article
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-card transition hover:shadow-lg ${
                  important
                    ? 'border-gold/40 border-l-4 border-l-gold'
                    : 'border-slate-200'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.pinned ? <CalendarPinnedBadge /> : null}
                    <CalendarPriorityBadge priority={item.priority} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {formatCalendarCategory(item.category)}
                    </span>
                    {item.expiresAt ? (
                      <span className="text-[11px] font-medium text-slate-400">
                        Expires {formatDate(item.expiresAt)}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="mt-2 block w-full text-left"
                  >
                    <h3 className="text-base font-bold text-slate-900 transition hover:text-primary sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </button>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-medium text-slate-400">
                      Posted by {item.createdBy ?? 'School leadership'}
                      {item.createdAt
                        ? ` · ${formatDate(item.createdAt)}`
                        : ` · ${formatDate(item.startDate)}`}
                    </p>

                    {canManage || canPin ? (
                      <div className="flex flex-wrap gap-2">
                        {canPin ? (
                          <button
                            type="button"
                            onClick={() => onTogglePin(item)}
                            disabled={pinBusy}
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                          >
                            {pinBusy ? (
                              <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <PinIcon className="h-3.5 w-3.5" />
                            )}
                            {item.pinned ? 'Unpin' : 'Pin'}
                          </button>
                        ) : null}

                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}

          {visible.length < updates.length ? (
            <button
              type="button"
              onClick={() => setLimit((current) => current + 8)}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:bg-primary-50"
            >
              <CalendarIcon className="h-4 w-4" />
              Load more updates
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
