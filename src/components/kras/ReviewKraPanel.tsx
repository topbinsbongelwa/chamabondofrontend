import { useEffect, useRef, useState } from 'react'
import { approveKra, rejectKra } from '../../lib/api'
import { formatTerm, type Kra } from '../../lib/kras'
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  SpinnerIcon,
} from '../icons'
import { KraStatusBadge } from './KraStatusBadge'

interface ReviewKraPanelProps {
  kra: Kra
  onClose: () => void
  onReviewed: (kra: Kra) => void
}

type ReviewAction = 'approve' | 'reject' | null

export function ReviewKraPanel({
  kra,
  onClose,
  onReviewed,
}: ReviewKraPanelProps) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<ReviewAction>(null)
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
  }, [kra.id])

  const handleApprove = async () => {
    if (pending) return

    setPending('approve')
    setError(null)

    try {
      const updated = await approveKra(kra.id)
      onReviewed(updated ?? { ...kra, status: 'approved' })
      onClose()
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Could not approve this KRA. Please try again.',
      )
    } finally {
      setPending(null)
    }
  }

  const handleReject = async () => {
    if (pending) return

    const trimmed = comment.trim()
    if (!trimmed) {
      setError('Add a comment explaining why this KRA is rejected.')
      return
    }

    setPending('reject')
    setError(null)

    try {
      const updated = await rejectKra(kra.id, trimmed)
      onReviewed(
        updated ?? {
          ...kra,
          status: 'rejected',
          reviewerComment: trimmed,
        },
      )
      onClose()
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Could not reject this KRA. Please try again.',
      )
    } finally {
      setPending(null)
    }
  }

  const busy = pending !== null
  const isPending = kra.status === 'pending'

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close review panel"
        onClick={busy ? () => undefined : onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-kra-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl motion-safe:animate-fade-in"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Review KRA
            </p>
            <h2
              id="review-kra-title"
              className="mt-1 text-lg font-bold leading-snug tracking-tight text-slate-900"
            >
              {kra.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <KraStatusBadge status={kra.status} />
              <span className="text-xs text-slate-400">
                {formatTerm(kra.term)} / {kra.year || '—'}
              </span>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close review panel"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Submitted by
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {kra.teacherName || 'Teacher'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {kra.department || 'No department'}
            </p>
          </div>

          <section className="mt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Description
            </h3>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {kra.description || 'No description provided.'}
            </p>
          </section>

          <section className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Indicator
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {kra.indicator || 'Not set'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Target
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {kra.target || 'Not set'}
              </p>
            </div>
          </section>

          <section className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Teacher progress
              </h3>
              <span className="font-mono text-xs font-bold tabular-nums text-primary">
                {kra.progress}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  kra.progress >= 100 ? 'bg-emerald-500' : 'bg-primary'
                }`}
                style={{ width: `${kra.progress}%` }}
              />
            </div>
          </section>

          {kra.reviewerComment ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Reviewer comment
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-amber-900">
                {kra.reviewerComment}
              </p>
            </div>
          ) : null}

          {isPending ? (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <label htmlFor="review-comment" className="label">
                Review comment
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                maxLength={1200}
                disabled={busy}
                placeholder="Required when rejecting. Explain what needs to change."
                className="input min-h-[104px] resize-y"
              />
              <p className="hint">
                Approving does not require a comment. Rejections always do.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-sm font-semibold text-slate-700">
                This KRA has already been reviewed.
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Its current status is {kra.status}.
              </p>
            </div>
          )}

          {error ? (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          ) : null}
        </div>

        {isPending ? (
          <div className="border-t border-slate-100 bg-slate-50/60 p-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={busy}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending === 'reject' ? (
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CloseIcon className="h-4 w-4" />
                )}
                Reject
              </button>

              <button
                type="button"
                onClick={() => void handleApprove()}
                disabled={busy}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending === 'approve' ? (
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                Approve
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
