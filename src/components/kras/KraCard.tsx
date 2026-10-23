import { formatTerm, type Kra } from '../../lib/kras'
import { PencilIcon, TrashIcon } from '../icons'
import { KraStatusBadge } from './KraStatusBadge'
import { ProgressSlider } from './ProgressSlider'

interface KraCardProps {
  kra: Kra
  onEdit: (kra: Kra) => void
  onDelete: (kra: Kra) => void
  onProgress: (kra: Kra, progress: number) => Promise<void> | void
}

export function KraCard({ kra, onEdit, onDelete, onProgress }: KraCardProps) {
  const canEdit = kra.status === 'draft' || kra.status === 'rejected'
  const canDelete = kra.status === 'draft'

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-base font-bold leading-snug text-slate-900 sm:text-lg">
              {kra.title}
            </h3>
            <KraStatusBadge status={kra.status} />
          </div>

          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {formatTerm(kra.term)} &middot; {kra.year || 'No year'}
          </p>
        </div>

        {canEdit || canDelete ? (
          <div className="flex shrink-0 items-center gap-2">
            {canEdit ? (
              <button
                type="button"
                onClick={() => onEdit(kra)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/30 hover:bg-primary-50 hover:text-primary"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
            ) : null}

            {canDelete ? (
              <button
                type="button"
                onClick={() => onDelete(kra)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {kra.description ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {kra.description}
        </p>
      ) : null}

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Indicator
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-700">
            {kra.indicator || 'Not set'}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Target
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-700">
            {kra.target || 'Not set'}
          </dd>
        </div>
      </dl>

      {kra.reviewerComment ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
            Reviewer comment
          </p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-amber-900">
            {kra.reviewerComment}
          </p>
        </div>
      ) : null}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <ProgressSlider
          value={kra.progress}
          label={kra.title}
          onCommit={(progress) => onProgress(kra, progress)}
        />
      </div>
    </article>
  )
}
