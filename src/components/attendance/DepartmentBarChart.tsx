import type { DepartmentAttendanceStat } from '../../lib/attendanceStats'
import {
  StatusStackedBarChart,
  type StatusStackedRow,
} from './StatusStackedBarChart'

interface DepartmentBarChartProps {
  departments: DepartmentAttendanceStat[]
  loading?: boolean
}

export function DepartmentBarChart({
  departments,
  loading = false,
}: DepartmentBarChartProps) {
  const rows: StatusStackedRow[] = departments.map((department) => ({
    key: department.department,
    label: department.department,
    counts: department.counts,
  }))

  return (
    <section
      aria-labelledby="department-bar-heading"
      aria-busy={loading}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Departments
        </p>
        <h2
          id="department-bar-heading"
          className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
        >
          Attendance by department
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Stacked status totals for each department in the selected period.
        </p>
      </div>

      <div className="mt-4">
        <StatusStackedBarChart
          rows={rows}
          loading={loading}
          ariaLabel="Attendance by department chart"
        />
      </div>
    </section>
  )
}
