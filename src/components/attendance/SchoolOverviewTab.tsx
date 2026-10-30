import { useEffect, useMemo, useState } from 'react'
import { useSchoolAttendanceStats } from '../../hooks/useSchoolAttendanceStats'
import { emptyStatusCounts } from '../../lib/attendanceStats'
import {
  currentMonthValue,
  formatRangeLabel,
  isRangeValid,
  monthBounds,
  monthFromDate,
  rangeLengthInDays,
} from '../../lib/dateRange'
import { getRole } from '../../lib/roles'
import { AttendanceBarChart } from './AttendanceBarChart'
import { AttendanceNotice } from './AttendanceNotice'
import { AttendancePieChart } from './AttendancePieChart'
import { AttendanceStatCards } from './AttendanceStatCards'
import { DepartmentBarChart } from './DepartmentBarChart'
import { SchoolFilters } from './SchoolFilters'
import { TeacherBreakdownTable } from './TeacherBreakdownTable'

interface AppliedSchoolRange {
  from: string
  to: string
  month: string
  department: string
  teacherId: string
}

interface TeacherOption {
  id: string
  name: string
  department: string
}

function initialRange(): AppliedSchoolRange {
  const month = currentMonthValue()
  const bounds = monthBounds(month)

  return {
    from: bounds?.from ?? '',
    to: bounds?.to ?? '',
    month,
    department: '',
    teacherId: '',
  }
}

const EMPTY_COUNTS = emptyStatusCounts()

export function SchoolOverviewTab() {
  const initial = useMemo(initialRange, [])
  const [draftMonth, setDraftMonth] = useState(initial.month)
  const [draftFrom, setDraftFrom] = useState(initial.from)
  const [draftTo, setDraftTo] = useState(initial.to)
  const [draftDepartment, setDraftDepartment] = useState('')
  const [draftTeacherId, setDraftTeacherId] = useState('')
  const [applied, setApplied] = useState<AppliedSchoolRange>(initial)
  const [refreshToken, setRefreshToken] = useState(0)
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])

  const { data, loading, error, usingCache, cachedAt, reload } =
    useSchoolAttendanceStats(
      {
        from: applied.from,
        to: applied.to,
        department: applied.department || undefined,
        teacherId: applied.teacherId || undefined,
      },
      refreshToken,
    )

  const role = getRole()
  const canViewDepartmentChart =
    role === 'head' || role === 'deputy' || role === 'admin'
  const invalidRange = !isRangeValid(draftFrom, draftTo)
  const range = data?.range
  const periodLabel = formatRangeLabel(applied.from, applied.to)
  const defaultMode =
    rangeLengthInDays(applied.from, applied.to) > 62 ? 'monthly' : 'weekly'

  useEffect(() => {
    if (!data) return

    setTeacherOptions((current) => {
      const merged = new Map(current.map((teacher) => [teacher.id, teacher]))

      for (const teacher of data.teachers) {
        merged.set(teacher.id, {
          id: teacher.id,
          name: teacher.name,
          department: teacher.department,
        })
      }

      return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name))
    })

    setDepartmentOptions((current) => {
      const merged = new Set(current)

      for (const department of data.departments) {
        if (department.department) merged.add(department.department)
      }
      for (const teacher of data.teachers) {
        if (teacher.department) merged.add(teacher.department)
      }

      return [...merged].sort((a, b) => a.localeCompare(b))
    })
  }, [data])

  const handleMonthChange = (value: string) => {
    setDraftMonth(value)
    const bounds = monthBounds(value)
    if (bounds) {
      setDraftFrom(bounds.from)
      setDraftTo(bounds.to)
    }
  }

  const handleRefresh = () => {
    if (invalidRange) return

    setApplied({
      from: draftFrom,
      to: draftTo,
      month: monthFromDate(draftFrom) || draftMonth || currentMonthValue(),
      department: draftDepartment,
      teacherId: draftTeacherId,
    })
    setRefreshToken((token) => token + 1)
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <SchoolFilters
        month={draftMonth}
        from={draftFrom}
        to={draftTo}
        department={draftDepartment}
        teacherId={draftTeacherId}
        departments={departmentOptions}
        teachers={teacherOptions}
        onMonthChange={handleMonthChange}
        onFromChange={setDraftFrom}
        onToChange={setDraftTo}
        onDepartmentChange={setDraftDepartment}
        onTeacherChange={setDraftTeacherId}
        onRefresh={handleRefresh}
        loading={loading}
        invalidRange={invalidRange}
      />

      {error ? (
        <AttendanceNotice
          error={error}
          usingCache={usingCache}
          cachedAt={cachedAt}
          onRetry={reload}
        />
      ) : null}

      <AttendanceStatCards
        stats={range ?? null}
        loading={loading}
        periodLabel={`School-wide · ${periodLabel}`}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <AttendancePieChart
          counts={range?.counts ?? EMPTY_COUNTS}
          loading={loading}
        />
        <AttendanceBarChart
          weekly={range?.weekly ?? []}
          monthly={range?.monthly ?? []}
          loading={loading}
          initialMode={defaultMode}
        />
      </div>

      {canViewDepartmentChart ? (
        <DepartmentBarChart
          departments={data?.departments ?? []}
          loading={loading}
        />
      ) : null}

      <TeacherBreakdownTable
        teachers={data?.teachers ?? []}
        loading={loading}
        from={applied.from}
        to={applied.to}
      />
    </div>
  )
}
