import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAnnouncements } from '../../lib/api'
import type { Announcement } from '../../lib/announcements'
import { formatDate } from '../../lib/format'
import { getRole, isAdminRole } from '../../lib/roles'
import { AlertIcon, CalendarIcon, RefreshIcon } from '../icons'

interface SchoolUpdatesCardProps {
  limit?: number
  title?: string
}

function categoryLabel(category: Announcement['category']): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function SchoolUpdatesCard({
  limit,
  title = 'School updates',
}: SchoolUpdatesCardProps) {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const isPublisher = isAdminRole(getRole())
  const visibleItems = limit ? items.slice(0, limit) : items

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchAnnouncements())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load school updates.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, reloadKey])

  return (
    <section
      aria-labelledby="school-updates-heading"
      aria-busy={loading}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Chamabondo Primary
          </p>
          <h2
            id="school-updates-heading"
            className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            {title}
          </h2>
        </div>
        {isPublisher ? (
          <Link
            to="/admin/announcements"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-primary/20 bg-primary-50 px-3.5 py-2 text-sm font-semibold text-primary transition hover:bg-primary-100"
          >
            Manage updates
          </Link>
        ) : null}
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="flex items-start gap-2 text-sm font-medium text-red-700">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : !error && items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            There are no school updates yet.
          </p>
        ) : (
          visibleItems.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {categoryLabel(item.category)}
                </span>
                {item.eventDate ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {formatDate(item.eventDate)}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {item.body}
              </p>
              <p className="mt-3 text-[11px] font-medium text-slate-400">
                Shared by {item.authorName}
              </p>
            </article>
          ))
        )}
        {!loading && !error && limit && items.length > limit ? (
          <Link
            to="/calendar?tab=updates"
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-primary transition hover:bg-primary-50"
          >
            View all {items.length} updates
          </Link>
        ) : null}
      </div>
    </section>
  )
}
