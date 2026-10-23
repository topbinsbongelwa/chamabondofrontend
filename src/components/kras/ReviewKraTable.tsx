import { formatTerm, type Kra } from '../../lib/kras'
import { ChevronRightIcon } from '../icons'
import { KraStatusBadge } from './KraStatusBadge'

interface ReviewKraTableProps {
  kras: Kra[]
  onSelect: (kra: Kra) => void
}

export function ReviewKraTable({ kras, onSelect }: ReviewKraTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-5 py-3">
                  Teacher
                </th>
                <th scope="col" className="px-4 py-3">
                  KRA
                </th>
                <th scope="col" className="px-4 py-3">
                  Term
                </th>
                <th scope="col" className="px-4 py-3">
                  Progress
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  <span className="sr-only">Review</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kras.map((kra) => (
                <tr key={kra.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-slate-800">
                      {kra.teacherName || 'Teacher'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {kra.department || 'No department'}
                    </p>
                  </td>
                  <td className="max-w-[260px] px-4 py-3.5">
                    <p
                      className="truncate text-sm font-semibold text-slate-800"
                      title={kra.title}
                    >
                      {kra.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {kra.indicator || 'No indicator'}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">
                    {formatTerm(kra.term)}
                    <span className="text-slate-400"> / {kra.year || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${kra.progress}%` }}
                        />
                      </span>
                      <span className="font-mono text-xs font-semibold tabular-nums text-slate-500">
                        {kra.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <KraStatusBadge status={kra.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(kra)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-sm font-semibold text-primary transition hover:bg-primary-50"
                    >
                      Review
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {kras.map((kra) => (
          <article key={kra.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug text-slate-900">
                  {kra.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {kra.teacherName || 'Teacher'}
                  {kra.department ? ` · ${kra.department}` : ''}
                </p>
              </div>
              <KraStatusBadge status={kra.status} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Term
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700">
                  {formatTerm(kra.term)} / {kra.year || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Progress
                </p>
                <p className="mt-0.5 font-mono text-xs font-bold tabular-nums text-primary">
                  {kra.progress}%
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelect(kra)}
              className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-1 rounded-xl border border-primary/20 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-100"
            >
              Review KRA
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>
    </>
  )
}
