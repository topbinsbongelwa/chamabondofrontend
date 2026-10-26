import { useEffect, useMemo, useState } from 'react'
import { deleteSchemeBook, fetchSchemeBooks } from '../../lib/api'
import { formatTerm, kraTermKey } from '../../lib/kras'
import {
  SCHEME_BOOK_STATUSES,
  SCHEME_BOOK_STATUS_LABELS,
  type SchemeBook,
  type SchemeBookStatus,
} from '../../lib/schemeBooks'
import {
  AlertIcon,
  BookIcon,
  PlusIcon,
  RefreshIcon,
} from '../icons'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { SchemeBookCard } from './SchemeBookCard'
import { SchemeBookFormModal } from './SchemeBookFormModal'

interface MySchemeBooksTabProps {
  onNotice: (message: string, tone?: 'success' | 'error') => void
}

function messageFromError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

export function MySchemeBooksTab({ onNotice }: MySchemeBooksTabProps) {
  const [items, setItems] = useState<SchemeBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const [term, setTerm] = useState('all')
  const [year, setYear] = useState('all')
  const [status, setStatus] = useState<SchemeBookStatus | 'all'>('all')
  const [subject, setSubject] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SchemeBook | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<SchemeBook | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchSchemeBooks()
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

  const terms = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.term).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, undefined, { numeric: true }),
      ),
    [items],
  )

  const years = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.year).filter(Boolean))).sort(
        (a, b) => Number(b) - Number(a) || b.localeCompare(a),
      ),
    [items],
  )

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.subject.trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [items],
  )

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (term !== 'all' && kraTermKey(item.term) !== kraTermKey(term)) {
          return false
        }
        if (year !== 'all' && item.year !== year) return false
        if (status !== 'all' && item.status !== status) return false
        if (
          subject !== 'all' &&
          item.subject.toLowerCase() !== subject.toLowerCase()
        ) {
          return false
        }
        return true
      }),
    [items, term, year, status, subject],
  )

  const filtersActive =
    term !== 'all' ||
    year !== 'all' ||
    status !== 'all' ||
    subject !== 'all'

  const clearFilters = () => {
    setTerm('all')
    setYear('all')
    setStatus('all')
    setSubject('all')
  }

  const openUpload = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openResubmit = (book: SchemeBook) => {
    setEditing(book)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleSaved = (message: string) => {
    onNotice(message, 'success')
    setVersion((current) => current + 1)
  }

  const requestDelete = (book: SchemeBook) => {
    setDeleteTarget(book)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await deleteSchemeBook(deleteTarget.id)
      setDeleteTarget(null)
      onNotice('Scheme book deleted.', 'success')
      setVersion((current) => current + 1)
    } catch (deleteFailure) {
      setDeleteError(messageFromError(deleteFailure))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="my-scheme-books-heading"
        aria-busy={loading}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Teaching documents
            </p>
            <h2
              id="my-scheme-books-heading"
              className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
            >
              My Scheme Books
            </h2>
          </div>

          <button
            type="button"
            onClick={openUpload}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            <PlusIcon className="h-4 w-4" />
            Upload Scheme Book
          </button>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="my-scheme-term" className="label">
                Term
              </label>
              <select
                id="my-scheme-term"
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

            <div>
              <label htmlFor="my-scheme-year" className="label">
                Year
              </label>
              <select
                id="my-scheme-year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="input"
              >
                <option value="all">All years</option>
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="my-scheme-status" className="label">
                Status
              </label>
              <select
                id="my-scheme-status"
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
              <label htmlFor="my-scheme-subject" className="label">
                Subject
              </label>
              <select
                id="my-scheme-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="input"
              >
                <option value="all">All subjects</option>
                {subjects.map((value) => (
                  <option key={value} value={value}>
                    {value}
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
              Clear filters
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-3 p-4 sm:p-5">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-slate-100 p-4"
              >
                <div className="h-5 w-2/3 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-40 rounded bg-slate-100" />
                <div className="mt-4 h-20 rounded-xl bg-slate-100" />
              </div>
            ))}
            <p className="sr-only" role="status">
              Loading your scheme books
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
              No scheme books yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Upload your first scheme book from your phone. You can take a
              photo or choose a document from your gallery.
            </p>
            <button
              type="button"
              onClick={openUpload}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
            >
              <PlusIcon className="h-4 w-4" />
              Upload Scheme Book
            </button>
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
              Try a different term, year, status or subject.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex min-h-[38px] items-center rounded-lg px-3 text-sm font-semibold text-primary transition hover:bg-primary-50"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3 bg-slate-50/40 p-4 sm:p-5">
            {filtered.map((book) => (
              <SchemeBookCard
                key={book.id}
                book={book}
                onResubmit={openResubmit}
                onDelete={requestDelete}
              />
            ))}
          </div>
        )}
      </section>

      <SchemeBookFormModal
        open={formOpen}
        book={editing}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this scheme book?"
        message={`"${deleteTarget?.title ?? 'This scheme book'}" will be permanently deleted. This cannot be undone.`}
        busy={deleting}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
