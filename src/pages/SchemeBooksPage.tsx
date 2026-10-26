import { useEffect, useState } from 'react'
import { MySchemeBooksTab } from '../components/schemeBooks/MySchemeBooksTab'
import { ReviewSchemeBooksTab } from '../components/schemeBooks/ReviewSchemeBooksTab'
import {
  AlertIcon,
  BookIcon,
  CheckIcon,
  CloseIcon,
} from '../components/icons'
import { getRole, isReviewerRole } from '../lib/roles'

type Tab = 'mine' | 'review'
type NoticeTone = 'success' | 'error'

interface Notice {
  message: string
  tone: NoticeTone
}

export function SchemeBooksPage() {
  const canReview = isReviewerRole(getRole())
  const [tab, setTab] = useState<Tab>('mine')
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    if (!notice) return

    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const handleNotice = (message: string, tone: NoticeTone = 'success') => {
    setNotice({ message, tone })
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Teaching documents
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <BookIcon className="h-5 w-5" />
            </span>
            Scheme Books
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {canReview
              ? 'Upload and track your own scheme books, and review submissions from the teachers you oversee.'
              : 'Upload and track the scheme books you submit for each term.'}
          </p>
        </div>

        <div className="hidden h-px w-24 bg-gold/50 sm:block" />
      </div>

      {canReview ? (
        <div
          role="tablist"
          aria-label="Scheme book views"
          className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex"
        >
          <button
            id="scheme-books-mine-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'mine'}
            aria-controls="scheme-books-mine-panel"
            onClick={() => setTab('mine')}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
              tab === 'mine'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <BookIcon className="h-4 w-4" />
            My Scheme Books
          </button>

          <button
            id="scheme-books-review-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'review'}
            aria-controls="scheme-books-review-panel"
            onClick={() => setTab('review')}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
              tab === 'review'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CheckIcon className="h-4 w-4" />
            Review Scheme Books
          </button>
        </div>
      ) : null}

      {notice ? (
        <div
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
            notice.tone === 'error'
              ? 'border border-red-200 bg-red-50 text-red-700'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          <p className="flex items-start gap-2">
            {notice.tone === 'error' ? (
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{notice.message}</span>
          </p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-black/5"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div
        id="scheme-books-mine-panel"
        role="tabpanel"
        aria-labelledby="scheme-books-mine-tab"
        hidden={canReview && tab !== 'mine'}
      >
        <MySchemeBooksTab onNotice={handleNotice} />
      </div>

      {canReview ? (
        <div
          id="scheme-books-review-panel"
          role="tabpanel"
          aria-labelledby="scheme-books-review-tab"
          hidden={tab !== 'review'}
        >
          {tab === 'review' ? (
            <ReviewSchemeBooksTab onNotice={handleNotice} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
