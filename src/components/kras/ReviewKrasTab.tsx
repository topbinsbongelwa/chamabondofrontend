import { useEffect, useMemo, useState } from 'react'
import { fetchReviewKras } from '../../lib/api'
import {
  KRA_STATUSES,
  KRA_STATUS_LABELS,
  formatTerm,
  kraTermKey,
  type Kra,
  type KraStatus,
} from '../../lib/kras'
import {
  AlertIcon,
  RefreshIcon,
  TargetIcon,
} from '../icons'
import { ReviewKraPanel } from './ReviewKraPanel'
import { ReviewKraTable } from './ReviewKraTable'

interface ReviewKrasTabProps {
  onNotice: (message: string, tone?: 'success' | 'error') => void
}

function messageFromError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

export function ReviewKrasTab({ onNotice }: ReviewKrasTabProps) {
  const [items, setItems] = useState<Kra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const [status, setStatus] = useState<KraStatus | 'all'>('pending')
  const [department, setDepartment] = useState('all')
  const [term, setTerm] = useState('all')

  const [selectedId, setSelectedId] = useState<string | number | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchReviewKras()
        if (!cancelled) setItems(data)
      } catch (loadError) {
        if (!cancelled) setError(messageFromError(loadError))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [version])

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => item.department?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [items],
  )

  const terms = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.term).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, undefined, { numeric: true }),
      ),
    [items],
  )

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (status !== 'all' && item.status !== status) return false
        if (
          department !== 'all' &&
          item.department?.toLowerCase() !== department.toLowerCase()
        ) {
          return false
        }
        if (term !== 'all' && kraTermKey(item.term) !== kraTermKey(term)) {
          return false
        }
        return true
      }),
    [items, status, department, term],
  )

  const selected =
    items.find((item) => String(item.id) === String(selectedId)) ?? null

  const pendingCount = items.filter((item) => item.status === 'pending').length
  const filtersActive =
    status !== 'pending' || department !== 'all' || term !== 'all'

  const clearFilters = () => {
    setStatus('pending')
    setDepartment('all')
    setTerm('all')
  }

  const handleReviewed = (updated: Kra) => {
    setItems((current) =>
      current.map((item) =>
        String(item.id) === String(updated.id) ? updated : item,
      ),
    )
    onNotice(
      updated.status === 'approved'
        ? 'KRA approved.'
        : 'KRA rejected. The teacher will see your comment.',
      'success',
    )
    setSelectedId(null)
  }

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="review-kras-heading"
        aria-busy={loading}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Reviewer workspace
            </p>
            <h2
              id="review-kras-heading"
              className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
            >
              Review KRAs
            </h2>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            {pendingCount} pending
          </span>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="review-status" className="label">
                Status
              </label>
              <select
                id="review-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as KraStatus | 'all')
                }
                className="input"
              >
                <option value="all">All statuses</option>
                {KRA_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {KRA_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="review-department" className="label">
                Department
              </label>
              <select
                id="review-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="input"
              >
                <option value="all">All departments</option>
                {departments.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="review-term" className="label">
                Term
              </label>
              <select
                id="review-term"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                className="input"
              >
                <option value="all">All terms</option>
                {terms.map((value) => (
                  <option key={value} value={value}>
                    {formatTerm(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex min-h-[34px] items-center rounded-lg px-2 text-xs font-semibold text-primary transition hover:bg-primary-50"
            >
              Reset to pending
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-3 p-4 sm:p-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex animate-pulse gap-4">
                <div className="h-5 w-32 rounded bg-slate-100" />
                <div className="h-5 flex-1 rounded bg-slate-100" />
                <div className="h-6 w-20 rounded-full bg-slate-100" />
              </div>
            ))}
            <p className="sr-only" role="status">
              Loading KRAs for review
            </p>
          </div>
        ) : error ? (
          <div role="alert" className="p-4 sm:p-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="flex items-start gap-2 text-sm font-medium text-red-700">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </p>
              <button
                type="button"
                onClick={() => setVersion((current) => current + 1)}
                className="mt-3 inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <RefreshIcon className="h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center sm:p-10">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary">
              <TargetIcon className="h-7 w-7" />
            </span>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Nothing to review yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              KRAs submitted by teachers in your department will appear here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center sm:p-10">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <TargetIcon className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No KRAs match these filters
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try another status, department or term.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex min-h-[38px] items-center rounded-lg px-3 text-sm font-semibold text-primary transition hover:bg-primary-50"
            >
              Reset to pending
            </button>
          </div>
        ) : (
          <ReviewKraTable kras={filtered} onSelect={(kra) => setSelectedId(kra.id)} />
        )}
      </section>

      {selected ? (
        <ReviewKraPanel
          kra={selected}
          onClose={() => setSelectedId(null)}
          onReviewed={handleReviewed}
        />
      ) : null}
    </div>
  )
}
