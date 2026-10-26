import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ATTENDANCE_STATUS_META,
  STATUS_ORDER,
  type AttendanceStatus,
} from '../../constants/attendance'
import type { StatusCounts } from '../../lib/attendanceStats'

export interface StatusStackedRow {
  key: string
  label: string
  counts: StatusCounts
}

interface StatusStackedBarChartProps {
  rows: StatusStackedRow[]
  loading?: boolean
  ariaLabel: string
  height?: number
}

interface TooltipEntry {
  dataKey?: string | number
  value?: number | string
  color?: string
}

interface BarTooltipProps {
  active?: boolean
  label?: string | number
  payload?: TooltipEntry[]
}

function isStatus(value: unknown): value is AttendanceStatus {
  return STATUS_ORDER.includes(value as AttendanceStatus)
}

function BarTooltip({ active, label, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null

  const entries = payload.filter((entry) => Number(entry.value) > 0)
  if (entries.length === 0) return null

  const total = entries.reduce(
    (sum, entry) => sum + Number(entry.value ?? 0),
    0,
  )

  return (
    <div className="max-w-[240px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-slate-900">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {entries.map((entry) => {
          const key = entry.dataKey
          const meta = isStatus(key) ? ATTENDANCE_STATUS_META[key] : null

          return (
            <li
              key={String(key)}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                <span className="truncate">{meta?.label ?? String(key)}</span>
              </span>
              <span className="font-semibold tabular-nums text-slate-900">
                {Number(entry.value)}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-[11px] font-semibold text-slate-500">
        Total: <span className="tabular-nums text-slate-800">{total}</span>{' '}
        recorded {total === 1 ? 'day' : 'days'}
      </p>
    </div>
  )
}

export function StatusStackedBarChart({
  rows,
  loading = false,
  ariaLabel,
  height = 320,
}: StatusStackedBarChartProps) {
  const visibleStatuses = STATUS_ORDER.filter((status) =>
    rows.some((row) => row.counts[status] > 0),
  )
  const hasData = rows.length > 0 && visibleStatuses.length > 0
  const data = rows.map((row) => ({
    label: row.label,
    ...row.counts,
  }))

  if (loading && rows.length === 0) {
    return (
      <div className="animate-pulse" aria-hidden="true">
        <div className="flex h-[280px] items-end gap-3 rounded-xl bg-slate-50 p-5">
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              className="flex-1 rounded-t bg-slate-100"
              style={{ height: `${35 + ((index * 17) % 55)}%` }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="h-4 w-20 rounded bg-slate-100" />
          ))}
        </div>
        <p className="sr-only" role="status">
          Loading attendance chart
        </p>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">
          No attendance records for this period
        </p>
        <p className="mt-1 text-sm text-slate-500">
          The chart will appear once attendance is recorded.
        </p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
          barCategoryGap="22%"
        >
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <Tooltip content={<BarTooltip />} cursor={{ fill: '#F8FAFC' }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          {visibleStatuses.map((status) => (
            <Bar
              key={status}
              dataKey={status}
              name={ATTENDANCE_STATUS_META[status].label}
              stackId="attendance"
              fill={ATTENDANCE_STATUS_META[status].color}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
