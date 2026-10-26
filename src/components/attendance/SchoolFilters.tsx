import { RefreshIcon, SpinnerIcon } from '../icons'

interface SchoolFiltersProps {
  month: string
  from: string
  to: string
  department: string
  teacherId: string
  departments: string[]
  teachers: Array<{ id: string; name: string; department: string }>
  onMonthChange: (value: string) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onTeacherChange: (value: string) => void
  onRefresh: () => void
  loading?: boolean
  invalidRange?: boolean
}

export function SchoolFilters({
  month,
  from,
  to,
  department,
  teacherId,
  departments,
  teachers,
  onMonthChange,
  onFromChange,
  onToChange,
  onDepartmentChange,
  onTeacherChange,
  onRefresh,
  loading = false,
  invalidRange = false,
}: SchoolFiltersProps) {
  const visibleTeachers = department
    ? teachers.filter((teacher) => teacher.department === department)
    : teachers

  return (
    <section
      aria-label="School attendance filters"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <label htmlFor="school-month" className="label">
            Month
          </label>
          <input
            id="school-month"
            type="month"
            value={month}
            onChange={(event) => onMonthChange(event.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="school-from" className="label">
            From
          </label>
          <input
            id="school-from"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="school-to" className="label">
            To
          </label>
          <input
            id="school-to"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="school-department" className="label">
            Department
          </label>
          <select
            id="school-department"
            value={department}
            onChange={(event) => {
              onDepartmentChange(event.target.value)
              onTeacherChange('')
            }}
            className="input"
          >
            <option value="">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="school-teacher" className="label">
            Teacher
          </label>
          <select
            id="school-teacher"
            value={teacherId}
            onChange={(event) => onTeacherChange(event.target.value)}
            className="input"
          >
            <option value="">All teachers</option>
            {visibleTeachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || invalidRange || !from || !to}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshIcon className="h-4 w-4" />
            )}
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {invalidRange ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          The start date must be on or before the end date.
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Filters apply to the whole-school summary, charts and teacher
          breakdown when you refresh.
        </p>
      )}
    </section>
  )
}
