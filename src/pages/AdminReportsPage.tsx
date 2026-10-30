import { useEffect, useMemo, useState } from 'react'
import { useSchoolAttendanceStats } from '../hooks/useSchoolAttendanceStats'
import { useStaffDirectory } from '../hooks/useStaffDirectory'
import { fetchReviewKras, fetchReviewSchemeBooks } from '../lib/api'
import { downloadCsv, type CsvValue } from '../lib/csv'
import { getDisplayName } from '../lib/auth'
import { currentMonthValue, formatIsoDate, monthBounds } from '../lib/dateRange'
import type { Kra } from '../lib/kras'
import { getDepartmentScope } from '../lib/roles'
import type { SchemeBook } from '../lib/schemeBooks'

type ReportType = 'attendance' | 'kras' | 'scheme-books' | 'staff'
type ReportRow = Record<string, string | number>

const REPORT_OPTIONS: Array<{ value: ReportType; label: string }> = [
  { value: 'attendance', label: 'Monthly attendance' },
  { value: 'kras', label: 'KRA status by department' },
  { value: 'scheme-books', label: 'Scheme book submission by term' },
  { value: 'staff', label: 'Staff summary' },
]

function isInDepartment(itemDepartment: string | null, scope: string | null) {
  return scope === null || Boolean(
    scope && itemDepartment?.trim().toLowerCase() === scope.toLowerCase(),
  )
}

export function AdminReportsPage() {
  const scope = getDepartmentScope()
  const defaultRange = monthBounds(currentMonthValue())
  const [report, setReport] = useState<ReportType>('attendance')
  const [from, setFrom] = useState(defaultRange?.from ?? '')
  const [to, setTo] = useState(formatIsoDate(new Date()))
  const [departmentFilter, setDepartmentFilter] = useState(() => getDepartmentScope() ?? '')
  const [kras, setKras] = useState<Kra[]>([])
  const [books, setBooks] = useState<SchemeBook[]>([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [recordsError, setRecordsError] = useState<string | null>(null)
  const attendance = useSchoolAttendanceStats({
    from: scope === '' ? '' : from,
    to,
    department: departmentFilter || undefined,
  })
  const { staff, loading: staffLoading, error: staffError, reload: reloadStaff } = useStaffDirectory()
  const name = getDisplayName()

  useEffect(() => {
    let active = true
    setRecordsLoading(true)
    setRecordsError(null)
    Promise.all([fetchReviewKras(), fetchReviewSchemeBooks()])
      .then(([kraItems, schemeBooks]) => {
        if (!active) return
        setKras(kraItems.filter((item) => isInDepartment(item.department, scope)))
        setBooks(schemeBooks.filter((item) => isInDepartment(item.department, scope)))
      })
      .catch((error: unknown) => {
        if (active) setRecordsError(error instanceof Error ? error.message : 'Could not load report data.')
      })
      .finally(() => {
        if (active) setRecordsLoading(false)
      })
    return () => {
      active = false
    }
  }, [scope])

  const departments = useMemo(() => {
    const values = new Set<string>()
    for (const teacher of attendance.data?.teachers ?? []) {
      if (teacher.department) values.add(teacher.department)
    }
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [attendance.data])

  const rows = useMemo<ReportRow[]>(() => {
    if (report === 'attendance') {
      return (attendance.data?.teachers ?? []).map((teacher) => ({
        Teacher: teacher.name,
        Department: teacher.department,
        'Attended days': teacher.attendedDays,
        'Sick leave': teacher.counts['sick-leave'],
        'School duty': teacher.counts['school-duty'],
        'Sports / activities duty': teacher.counts['sports-duty'],
        Absent: teacher.counts.absent,
        'Attendance rate (%)': teacher.attendanceRate,
      }))
    }
    if (report === 'kras') {
      const byDepartment = new Map<string, { pending: number; approved: number; rejected: number }>()
      for (const item of kras) {
        const key = item.department || 'Unassigned'
        if (departmentFilter && key.toLowerCase() !== departmentFilter.toLowerCase()) continue
        const counts = byDepartment.get(key) ?? { pending: 0, approved: 0, rejected: 0 }
        counts[item.status === 'draft' ? 'pending' : item.status] += 1
        byDepartment.set(key, counts)
      }
      return [...byDepartment.entries()].map(([department, counts]) => ({
        Department: department,
        Pending: counts.pending,
        Approved: counts.approved,
        Rejected: counts.rejected,
      }))
    }
    if (report === 'scheme-books') {
      return books
        .filter((item) => !departmentFilter || item.department?.toLowerCase() === departmentFilter.toLowerCase())
        .map((item) => ({
          Teacher: item.teacherName ?? 'Unknown teacher',
          Department: item.department ?? 'Unassigned',
          Term: item.term,
          Year: item.year,
          Scheme: item.title,
          Status: item.status,
        }))
    }
    return staff
      .filter((item) => isInDepartment(item.department, scope))
      .filter((item) => !departmentFilter || item.department?.toLowerCase() === departmentFilter.toLowerCase())
      .map((item) => ({
        Name: item.name,
        Role: item.role,
        Department: item.department ?? 'Unassigned',
        Account: item.approved === true ? 'Active' : item.approved === false ? 'Inactive' : 'Unknown',
      }))
  }, [attendance.data, books, departmentFilter, kras, report, scope, staff])

  const loading =
    (report === 'attendance' && attendance.loading) ||
    (report === 'kras' && recordsLoading) ||
    (report === 'scheme-books' && recordsLoading) ||
    (report === 'staff' && staffLoading)
  const error =
    report === 'attendance'
      ? attendance.error
      : report === 'staff'
        ? staffError
        : recordsError
  const printableDate = new Date().toLocaleDateString('en-GB')

  const exportCsv = () => {
    if (rows.length === 0) return
    const columns = Object.keys(rows[0])
    const csvRows: CsvValue[][] = [
      ['Chamabondo Primary School', REPORT_OPTIONS.find((item) => item.value === report)?.label ?? 'Report'],
      [`Date range: ${from} to ${to}`, `Generated by: ${name}`, `Generated on: ${printableDate}`],
      columns,
      ...rows.map((row) => columns.map((column) => row[column])),
    ]
    downloadCsv(`chamabondo-${report}-${from}-to-${to}.csv`, csvRows)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <header className="print:hidden">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Insights</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">{scope !== null ? `Report data is scoped to ${scope || 'an unassigned department'}.` : 'Preview and export school management reports.'}</p>
      </header>

      <section className="print:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="admin-report-type" className="label">Report</label>
            <select id="admin-report-type" className="input" value={report} onChange={(event) => setReport(event.target.value as ReportType)}>
              {REPORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="report-from" className="label">From</label>
            <input id="report-from" type="date" className="input" value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div>
            <label htmlFor="report-to" className="label">To</label>
            <input id="report-to" type="date" className="input" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          <div>
            <label htmlFor="report-department" className="label">Department</label>
            <select id="report-department" className="input" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} disabled={scope !== null}>
              <option value="">All departments</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
              {scope && !departments.includes(scope) ? <option value={scope}>{scope}</option> : null}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} disabled={loading || rows.length === 0} className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Export CSV</button>
          <button type="button" onClick={() => window.print()} disabled={loading || rows.length === 0} className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Print / Save PDF</button>
          {report === 'staff' && staffError ? <button type="button" onClick={reloadStaff} className="text-sm font-semibold text-primary underline">Retry staff</button> : null}
          {report === 'attendance' && attendance.error ? <button type="button" onClick={attendance.reload} className="text-sm font-semibold text-primary underline">Retry attendance</button> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-card print:border-0 print:shadow-none">
        <div className="hidden border-b border-slate-200 p-6 print:block">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Chamabondo Primary School</p>
          <h2 className="mt-2 text-2xl font-bold">{REPORT_OPTIONS.find((item) => item.value === report)?.label}</h2>
          <p className="mt-1 text-sm">Date range: {from} to {to}</p>
          <p className="text-sm">Generated by {name} on {printableDate}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5 print:hidden">
          <h2 className="text-lg font-bold text-slate-900">Report preview</h2>
          <span className="text-xs text-slate-500">{rows.length} rows</span>
        </div>
        {loading ? (
          <div className="animate-pulse space-y-3 p-5"><div className="h-8 rounded bg-slate-100" /><div className="h-8 rounded bg-slate-100" /></div>
        ) : error ? (
          <p role="alert" className="p-5 text-sm text-red-700">{error}</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No records match the selected report and filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 print:bg-white">
                <tr>{Object.keys(rows[0]).map((column) => <th key={column} className="whitespace-nowrap px-4 py-3">{column}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => (
                  <tr key={`${report}-${index}`}>
                    {Object.values(row).map((value, cell) => <td key={cell} className="whitespace-nowrap px-4 py-3 text-slate-700">{value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
