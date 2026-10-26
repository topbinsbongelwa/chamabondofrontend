import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  ATTENDANCE_STATUS_META,
  STATUS_ORDER,
  type AttendanceStatus,
} from '../../constants/attendance'
import type { StatusCounts } from '../../lib/attendanceStats'

interface PieDatum {
  key: AttendanceStatus
  name: string
  value: number
  color: string
  percent: number
}

interface AttendancePieChartProps {
  counts: StatusCounts
  loading?: boolean
}

interface PieTooltipProps {
  active?: boolean
  payload?: Array<{ payload?: PieDatum }>
}

function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  const item = payload?.[0]?.payload
  if (!active || !item) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="flex items-center gap-2 text-xs font-bold text-slate-900">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: item.color }}
          aria-hidden="true"
        />
        {item.name}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">{item.value}</span>{' '}
        {item.value === 1 ? 'day' : 'days'} ·{' '}
        <span className="font-semibold text-slate-900">
          {formatPercent(item.percent)}
        </span>
      </p>
    </div>
  )
}

export function AttendancePieChart({
  counts,
  loading = false,
}: AttendancePieChartProps) {
  const total = STATUS_ORDER.reduce((sum, status) => sum + counts[status], 0)
  const data: PieDatum[] = STATUS_ORDER.filter(
    (status) => counts[status] > 0,
  ).map((status) => ({
    key: status,
    name: ATTENDANCE_STATUS_META[status].label,
    value: counts[status],
    color: ATTENDANCE_STATUS_META[status].color,
    percent: total > 0 ? (counts[status] / total) * 100 : 0,
  }))

  return (
    <section
      aria-labelledby="attendance-pie-heading"
      aria-busy={loading}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Status share
        </p>
        <h2
          id="attendance-pie-heading"
          className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
        >
          Attendance breakdown
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Share of each recorded status in this period.
        </p>
      </div>

      {loading && total === 0 ? (
        <div className="mt-5 animate-pulse" aria-hidden="true">
          <div className="mx-auto h-52 w-52 rounded-full bg-slate-100" />
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-5 rounded bg-slate-100" />
            ))}
          </div>
          <p className="sr-only" role="status">
            Loading attendance breakdown
          </p>
        </div>
      ) : data.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No attendance records for this period
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Status shares will appear once attendance is recorded.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
          <div className="relative h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="86%"
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {data.map((item) => (
                    <Cell key={item.key} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tabular-nums text-slate-900">
                {total}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Recorded days
              </span>
            </div>
          </div>

          <ul className="space-y-2">
            {data.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-semibold text-slate-700">
                    {item.name}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm">
                  <span className="font-bold tabular-nums text-slate-900">
                    {formatPercent(item.percent)}
                  </span>
                  <span className="ml-1.5 text-xs tabular-nums text-slate-500">
                    ({item.value})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
