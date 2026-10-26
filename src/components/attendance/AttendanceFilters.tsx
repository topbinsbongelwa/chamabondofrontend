import { RefreshIcon, SpinnerIcon } from '../icons'

interface AttendanceFiltersProps {
  month: string
  from: string
  to: string
  onMonthChange: (value: string) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onRefresh: () => void
  loading?: boolean
  invalidRange?: boolean
}

export function AttendanceFilters({
  month,
  from,
  to,
  onMonthChange,
  onFromChange,
  onToChange,
  onRefresh,
  loading = false,
  invalidRange = false,
}: AttendanceFiltersProps) {
  return (
    <section
      aria-label="Attendance filters"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,170px)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
        <div>
          <label htmlFor="attendance-month" className="label">
            Month
          </label>
          <input
            id="attendance-month"
            type="month"
            value={month}
            onChange={(event) => onMonthChange(event.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="attendance-from" className="label">
            From
          </label>
          <input
            id="attendance-from"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="attendance-to" className="label">
            To
          </label>
          <input
            id="attendance-to"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="input"
          />
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || invalidRange || !from || !to}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <SpinnerIcon className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshIcon className="h-4 w-4" />
          )}
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {invalidRange ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          The start date must be on or before the end date.
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Choose a month to fill the range, or set a custom from and to date,
          then refresh.
        </p>
      )}
    </section>
  )
}
