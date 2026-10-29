import { useEffect, useMemo, useState } from 'react'
import { fetchReviewSchemeBooks } from '../../lib/api'
import { formatTerm, kraTermKey } from '../../lib/kras'
import { getDepartmentScope } from '../../lib/roles'
import {
  SCHEME_BOOK_STATUSES,
  SCHEME_BOOK_STATUS_LABELS,
  type SchemeBook,
  type SchemeBookStatus,
} from '../../lib/schemeBooks'
import { AlertIcon, BookIcon, RefreshIcon } from '../icons'
import { ReviewSchemeBookPanel } from './ReviewSchemeBookPanel'
import { ReviewSchemeBookTable } from './ReviewSchemeBookTable'

interface ReviewSchemeBooksTabProps {
  onNotice: (message: string, tone?: 'success' | 'error') => void
}

function messageFromError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

export function ReviewSchemeBooksTab({ onNotice }: ReviewSchemeBooksTabProps) {
  const departmentScope = getDepartmentScope()
  const [items, setItems] = useState<SchemeBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const [status, setStatus] = useState<SchemeBookStatus | 'all'>('pending')
  const [department, setDepartment] = useState('all')
  const [term, setTerm] = useState('all')

  const [selectedId, setSelectedId] = useState<string | number | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchReviewSchemeBooks()
        const scopedData =
          departmentScope === null
            ? data
            : departmentScope
              ? data.filter(
                  (item) =>
                    item.department?.trim().toLowerCase() ===
                    departmentScope.toLowerCase(),
                )
              : []
        if (!cancelled) setItems(scopedData)
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
  }, [departmentScope, version])

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

  const handleReviewed = (updated: SchemeBook) => {
    setItems((current) =>
      current.map((item) =>
        String(item.id) === String(updated.id) ? updated : item,
      ),
    )
    onNotice(
      updated.status === 'approved'
        ? 'Scheme book approved.'
        : 'Scheme book rejected. The teacher will see your comment.',
      'success',
    )
    setSelectedId(null)
  }

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="review-scheme-books-heading"
        aria-busy={loading}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Reviewer workspace
            </p>
            <h2
              id="review-scheme-books-heading"
              className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
            >
              Review Scheme Books
            </h2>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
            <span
              className="h-1.5 w-1.5 rounded-full bg-amber-500"
              aria-hidden="true"
            />
            {pendingCount} pending
          </span>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="review-scheme-status" className="label">
                Status
              </label>
              <select
                id="review-scheme-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as SchemeBookStatus | 'all')
                }
                className="input"
              >
                <option value="all">All statuses</option>
                {SCHEME_BOOK_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {SCHEME_BOOK_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="review-scheme-department" className="label">
                Department
              </label>
              <select
                id="review-scheme-department"
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
              <label htmlFor="review-scheme-term" className="label">
                Term
              </label>
              <select
                id="review-scheme-term"
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
              Loading scheme books for review
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
              <BookIcon className="h-7 w-7" />
            </span>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Nothing to review yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Scheme books submitted by teachers in your department will appear
              here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center sm:p-10">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <BookIcon className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No scheme books match these filters
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
          <ReviewSchemeBookTable
            books={filtered}
            onSelect={(book) => setSelectedId(book.id)}
          />
        )}
      </section>

      {selected ? (
        <ReviewSchemeBookPanel
          book={selected}
          onClose={() => setSelectedId(null)}
          onReviewed={handleReviewed}
        />
      ) : null}
    </div>
  )
}
