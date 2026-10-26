import type { ComponentType, SVGProps } from 'react'
import type { AttendanceSummary } from '../../lib/attendance'
import { formatMonthYear } from '../../lib/format'
import {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  RefreshIcon,
  SpinnerIcon,
} from '../icons'

interface SummaryCard {
  key: keyof AttendanceSummary
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  iconClass: string
  valueClass: string
}

const CARDS: SummaryCard[] = [
  {
    key: 'present',
    label: 'Present',
    icon: CheckIcon,
    iconClass: 'bg-emerald-50 text-emerald-600',
    valueClass: 'text-emerald-700',
  },
  {
    key: 'late',
    label: 'Late',
    icon: ClockIcon,
    iconClass: 'bg-amber-50 text-amber-600',
    valueClass: 'text-amber-700',
  },
  {
    key: 'sickLeave',
    label: 'Sick Leave',
    icon: AlertIcon,
    iconClass: 'bg-blue-50 text-blue-600',
    valueClass: 'text-blue-700',
  },
  {
    key: 'leave',
    label: 'Leave',
    icon: CalendarIcon,
    iconClass: 'bg-purple-50 text-purple-600',
    valueClass: 'text-purple-700',
  },
  {
    key: 'absent',
    label: 'Absent',
    icon: CloseIcon,
    iconClass: 'bg-red-50 text-red-600',
    valueClass: 'text-red-700',
  },
]

interface MonthlySummaryProps {
  summary: AttendanceSummary
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function MonthlySummary({
  summary,
  loading,
  error,
  onRetry,
}: MonthlySummaryProps) {
  return (
    <section
      aria-labelledby="monthly-summary-heading"
      aria-busy={loading}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Monthly summary
          </p>
          <h2
            id="monthly-summary-heading"
            className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            {formatMonthYear(new Date())}
          </h2>
        </div>

        {loading ? (
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
            <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
            Updating
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="flex items-start gap-2 text-sm font-medium text-red-700">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.key}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              {loading ? (
                <div className="mt-2 h-8 w-12 animate-pulse rounded-md bg-slate-200/70" />
              ) : (
                <p
                  className={`mt-1.5 text-2xl font-bold tabular-nums ${card.valueClass}`}
                >
                  {summary[card.key]}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="flex min-h-[170px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-center">
          <div
            className="h-14 w-14 rounded-full border-[9px] border-slate-200 border-t-primary/40"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Pie chart
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Monthly attendance breakdown will appear here
          </p>
        </div>

        <div className="flex min-h-[170px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-center">
          <div className="flex h-14 items-end gap-1.5" aria-hidden="true">
            <span className="w-2.5 rounded-t-sm bg-primary/20" style={{ height: '38%' }} />
            <span className="w-2.5 rounded-t-sm bg-primary/30" style={{ height: '62%' }} />
            <span className="w-2.5 rounded-t-sm bg-primary/20" style={{ height: '48%' }} />
            <span className="w-2.5 rounded-t-sm bg-gold/40" style={{ height: '80%' }} />
            <span className="w-2.5 rounded-t-sm bg-primary/25" style={{ height: '56%' }} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-500">Bar graph</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Week-by-week attendance will appear here
          </p>
        </div>
      </div>
    </section>
  )
}
