import { formatTerm } from '../../lib/kras'
import {
  formatWeeksCovered,
  type SchemeBook,
} from '../../lib/schemeBooks'
import { RefreshIcon, TrashIcon } from '../icons'
import { SchemeBookFileActions } from './SchemeBookFileActions'
import { SchemeBookStatusBadge } from './SchemeBookStatusBadge'

interface SchemeBookCardProps {
  book: SchemeBook
  onResubmit: (book: SchemeBook) => void
  onDelete: (book: SchemeBook) => void
}

export function SchemeBookCard({
  book,
  onResubmit,
  onDelete,
}: SchemeBookCardProps) {
  const canResubmit = book.status === 'rejected'
  const canDelete = book.status === 'pending' || book.status === 'rejected'

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-base font-bold leading-snug text-slate-900 sm:text-lg">
              {book.title}
            </h3>
            <SchemeBookStatusBadge status={book.status} />
          </div>

          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {book.subject || 'No subject'} &middot; {book.grade || 'No grade'}
          </p>
        </div>

        {canResubmit || canDelete ? (
          <div className="flex shrink-0 items-center gap-2">
            {canResubmit ? (
              <button
                type="button"
                onClick={() => onResubmit(book)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
              >
                <RefreshIcon className="h-4 w-4" />
                Resubmit
              </button>
            ) : null}

            {canDelete ? (
              <button
                type="button"
                onClick={() => onDelete(book)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Term
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-700">
            {formatTerm(book.term) || 'Not set'} / {book.year || '—'}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Weeks covered
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-700">
            {formatWeeksCovered(book)}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Version
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-700">
            Version {book.version}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Subject / grade
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-700">
            {book.subject || 'No subject'} · {book.grade || 'No grade'}
          </dd>
        </div>
      </dl>

      {book.notes ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {book.notes}
        </p>
      ) : null}

      <SchemeBookFileActions book={book} />

      {book.reviewerComment ? (
        <div
          className={`mt-3 rounded-xl border p-3 ${
            book.status === 'rejected'
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-wide ${
              book.status === 'rejected' ? 'text-red-700' : 'text-amber-700'
            }`}
          >
            Reviewer comment
          </p>
          <p
            className={`mt-1 whitespace-pre-line text-sm leading-relaxed ${
              book.status === 'rejected' ? 'text-red-900' : 'text-amber-900'
            }`}
          >
            {book.reviewerComment}
          </p>
        </div>
      ) : null}
    </article>
  )
}
