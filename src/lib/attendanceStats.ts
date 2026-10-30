import {
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
} from '../constants/attendance'
import {
  normalizeRecords,
  statusKey,
  type AttendanceRecord,
} from './attendance'
import { parseDateValue } from './format'

export type StatusCounts = Record<AttendanceStatus, number>

export interface AttendanceBucket {
  key: string
  label: string
  start: string | null
  end: string | null
  counts: StatusCounts
}

export interface AttendanceRangeStats {
  from: string | null
  to: string | null
  workingDays: number
  attendedDays: number
  attendanceRate: number
  counts: StatusCounts
  weekly: AttendanceBucket[]
  monthly: AttendanceBucket[]
  records: AttendanceRecord[]
}

export interface TeacherAttendanceStat {
  id: string
  name: string
  department: string
  counts: StatusCounts
  duties: number
  workingDays: number
  attendedDays: number
  attendanceRate: number
}

export interface DepartmentAttendanceStat {
  department: string
  counts: StatusCounts
  workingDays: number
  attendedDays: number
  attendanceRate: number
}

export interface SchoolAttendanceStats {
  range: AttendanceRangeStats
  teachers: TeacherAttendanceStat[]
  departments: DepartmentAttendanceStat[]
}

export interface AttendanceRange {
  from?: string
  to?: string
}

export type BucketMode = 'weekly' | 'monthly'

const COUNT_KEY_ALIASES: Record<AttendanceStatus, string[]> = {
  present: [
    'present',
    'presentDays',
    'presentDay',
    'presentCount',
    'present_count',
    'daysPresent',
    'totalPresent',
  ],
  late: [
    'late',
    'lateDays',
    'lateDay',
    'lateCount',
    'late_count',
    'daysLate',
    'totalLate',
  ],
  'sick-leave': [
    'sickLeave',
    'sick_leave',
    'sickLeaveDays',
    'sick_leave_days',
    'sickLeaveCount',
    'sick_leave_count',
    'sickDays',
    'sick',
    'totalSickLeave',
  ],
  leave: [
    'leave',
    'leaveDays',
    'leaveDay',
    'leaveCount',
    'leave_count',
    'annualLeave',
    'daysLeave',
    'totalLeave',
  ],
  holiday: [
    'holiday',
    'holidays',
    'holidayDays',
    'holidayDay',
    'holidayCount',
    'publicHoliday',
    'publicHolidays',
    'totalHoliday',
  ],
  'school-duty': [
    'schoolDuty',
    'school_duty',
    'schoolDutyDays',
    'school_duty_days',
    'schoolDutyCount',
    'schoolDuties',
    'officialDuty',
    'official_duty',
    'officialDutyDays',
    'official_duty_days',
    'dutyDays',
    'duty_days',
    'totalSchoolDuty',
  ],
  'sports-duty': [
    'sportsDuty',
    'sports_duty',
    'sportsDutyDays',
    'sports_duty_days',
    'sportsActivitiesDuty',
    'sports_activities_duty',
    'sportsActivitiesDutyDays',
    'sportsActivitiesDays',
    'sportsDays',
    'activitiesDuty',
    'activitiesDutyDays',
    'cocurricularDays',
    'totalSportsDuty',
  ],
  absent: [
    'absent',
    'absentDays',
    'absentDay',
    'absentCount',
    'absent_count',
    'daysAbsent',
    'absenceDays',
    'totalAbsent',
  ],
}

const TEACHER_ARRAY_KEYS = [
  'teachers',
  'byTeacher',
  'teacherStats',
  'teacherBreakdown',
  'staffStats',
  'staff',
  'members',
  'rows',
]

const DEPARTMENT_ARRAY_KEYS = [
  'departments',
  'byDepartment',
  'departmentStats',
  'departmentBreakdown',
  'departmentsBreakdown',
]

const WEEKLY_ARRAY_KEYS = [
  'weekly',
  'byWeek',
  'weeks',
  'weeklyBreakdown',
  'weekBreakdown',
  'weeklyStats',
]

const MONTHLY_ARRAY_KEYS = [
  'monthly',
  'byMonth',
  'months',
  'monthlyBreakdown',
  'monthBreakdown',
  'monthlyStats',
]

const RECORD_ARRAY_KEYS = [
  'records',
  'attendanceRecords',
  'attendanceHistory',
  'attendance',
  'daily',
  'days',
  'entries',
]

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[%,\s]/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function firstString(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = asString(source[key])
    if (value) return value
  }
  return null
}

function hasNumberKey(
  source: Record<string, unknown>,
  keys: string[],
): boolean {
  return keys.some(
    (key) =>
      source[key] !== undefined &&
      source[key] !== null &&
      source[key] !== '' &&
      Number.isFinite(asNumber(source[key])),
  )
}

function firstNumber(
  source: Record<string, unknown>,
  keys: string[],
  fallback = 0,
): number {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return asNumber(source[key])
    }
  }
  return fallback
}

function collectRecords(value: unknown, depth = 0, output: Record<string, unknown>[] = []) {
  const record = asRecord(value)
  if (!record) return output

  output.push(record)
  if (depth >= 2) return output

  for (const key of [
    'data',
    'stats',
    'summary',
    'totals',
    'counts',
    'attendance',
    'result',
    'report',
    'overview',
    'range',
  ]) {
    const nested = asRecord(record[key])
    if (nested) collectRecords(nested, depth + 1, output)
  }

  return output
}

function mergeSources(value: unknown): Record<string, unknown> {
  return Object.assign({}, ...collectRecords(value))
}

function findFirstArray(
  source: Record<string, unknown>,
  keys: string[],
  depth = 0,
): unknown[] {
  for (const key of keys) {
    const candidate = source[key]
    if (Array.isArray(candidate)) return candidate

    const nested = asRecord(candidate)
    if (nested && depth < 3) {
      const found = findFirstArray(nested, keys, depth + 1)
      if (found.length > 0) return found
    }
  }

  if (depth >= 2) return []

  for (const key of [
    'data',
    'stats',
    'summary',
    'totals',
    'attendance',
    'result',
    'report',
    'overview',
    'range',
  ]) {
    const nested = asRecord(source[key])
    if (!nested) continue

    const found = findFirstArray(nested, keys, depth + 1)
    if (found.length > 0) return found
  }

  return []
}

export function emptyStatusCounts(): StatusCounts {
  return {
    present: 0,
    late: 0,
    'sick-leave': 0,
    leave: 0,
    holiday: 0,
    'school-duty': 0,
    'sports-duty': 0,
    absent: 0,
  }
}

export function sumStatusCounts(counts: StatusCounts): number {
  return ATTENDANCE_STATUSES.reduce((total, status) => total + counts[status], 0)
}

export function addStatusCounts(
  target: StatusCounts,
  source: StatusCounts,
): StatusCounts {
  for (const status of ATTENDANCE_STATUSES) {
    target[status] += source[status]
  }
  return target
}

export function dutyDays(counts: StatusCounts): number {
  return counts['school-duty'] + counts['sports-duty']
}

export function attendanceRate(attendedDays: number, workingDays: number): number {
  if (workingDays <= 0) return 0
  return Math.round((attendedDays / workingDays) * 1000) / 10
}

export function countsFrom(value: unknown): StatusCounts {
  const source = asRecord(value) ?? {}
  const countSource: Record<string, unknown> = {
    ...source,
    ...(asRecord(source.counts) ?? {}),
    ...(asRecord(source.statusCounts) ?? {}),
    ...(asRecord(source.status_counts) ?? {}),
    ...(asRecord(source.byStatus) ?? {}),
    ...(asRecord(source.by_status) ?? {}),
    ...(asRecord(source.breakdown) ?? {}),
  }

  const counts = emptyStatusCounts()

  for (const status of ATTENDANCE_STATUSES) {
    counts[status] = firstNumber(countSource, COUNT_KEY_ALIASES[status])
  }

  return counts
}

export function countsFromRecords(records: AttendanceRecord[]): StatusCounts {
  const counts = emptyStatusCounts()

  for (const record of records) {
    const key = statusKey(record.status)
    if (key !== 'unknown') counts[key] += 1
  }

  return counts
}

function uniqueRecordDates(records: AttendanceRecord[]): number {
  const dates = new Set<string>()

  for (const record of records) {
    const date = parseDateValue(record.date)
    if (!Number.isNaN(date.getTime())) {
      dates.add(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      )
    }
  }

  return dates.size
}

export function countWeekdays(from?: string | null, to?: string | null): number {
  if (!from || !to) return 0

  const start = parseDateValue(from)
  const end = parseDateValue(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  if (start > end) return 0

  let total = 0
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())

  while (cursor <= end) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) total += 1
    cursor.setDate(cursor.getDate() + 1)
  }

  return total
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - offset)
  return start
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function weeklyLabel(date: Date): string {
  return `Week of ${shortDate(date)}`
}

function monthlyLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

export function groupRecords(
  records: AttendanceRecord[],
  mode: BucketMode,
): AttendanceBucket[] {
  const buckets = new Map<string, AttendanceBucket>()

  for (const record of records) {
    const date = parseDateValue(record.date)
    if (Number.isNaN(date.getTime())) continue

    let key: string
    let label: string
    let start: string
    let end: string

    if (mode === 'weekly') {
      const weekStart = startOfWeek(date)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      key = `week-${isoDate(weekStart)}`
      label = weeklyLabel(weekStart)
      start = isoDate(weekStart)
      end = isoDate(weekEnd)
    } else {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      key = `month-${isoDate(monthStart).slice(0, 7)}`
      label = monthlyLabel(monthStart)
      start = isoDate(monthStart)
      end = isoDate(monthEnd)
    }

    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = {
        key,
        label,
        start,
        end,
        counts: emptyStatusCounts(),
      }
      buckets.set(key, bucket)
    }

    const status = statusKey(record.status)
    if (status !== 'unknown') bucket.counts[status] += 1
  }

  return [...buckets.values()].sort((a, b) =>
    (a.start ?? '').localeCompare(b.start ?? ''),
  )
}

function bucketLabel(
  source: Record<string, unknown>,
  mode: BucketMode,
  index: number,
): string {
  const value = firstString(source, [
    'label',
    'name',
    'period',
    'weekLabel',
    'week_label',
    'week',
    'month',
    'range',
    'date',
    'start',
  ])
  if (value) return value

  return mode === 'weekly' ? `Week ${index + 1}` : `Month ${index + 1}`
}

function normalizeBuckets(
  value: unknown,
  keys: string[],
  mode: BucketMode,
): AttendanceBucket[] {
  const source = mergeSources(value)
  const raw = findFirstArray(source, keys)

  return raw
    .map((item, index): AttendanceBucket | null => {
      const record = asRecord(item)
      if (!record) return null

      const start = firstString(record, [
        'start',
        'startDate',
        'start_date',
        'from',
        'weekStart',
        'week_start',
      ])
      const end = firstString(record, [
        'end',
        'endDate',
        'end_date',
        'to',
        'weekEnd',
        'week_end',
      ])

      return {
        key:
          firstString(record, ['key', 'id', 'week', 'month', 'start', 'date']) ??
          `${mode}-${index}`,
        label: bucketLabel(record, mode, index),
        start,
        end,
        counts: countsFrom(record),
      }
    })
    .filter((bucket): bucket is AttendanceBucket => bucket !== null)
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''))
}

function normalizeRate(
  source: Record<string, unknown>,
  attendedDays: number,
  workingDays: number,
): number {
  const hasRate = hasNumberKey(source, [
    'attendanceRate',
    'attendance_rate',
    'attendancePercentage',
    'attendance_percentage',
    'rate',
    'percentage',
    'percent',
  ])

  if (!hasRate) return attendanceRate(attendedDays, workingDays)

  const value = firstNumber(source, [
    'attendanceRate',
    'attendance_rate',
    'attendancePercentage',
    'attendance_percentage',
    'rate',
    'percentage',
    'percent',
  ])

  if (value > 0 && value <= 1 && attendedDays > 0) {
    return Math.round(value * 1000) / 10
  }

  return Math.round(value * 10) / 10
}

export function normalizeRangeStats(
  value: unknown,
  fallback: AttendanceRange = {},
): AttendanceRangeStats {
  const directRecords = Array.isArray(value)
  const source = directRecords ? {} : mergeSources(value)
  const recordArray = directRecords
    ? value
    : findFirstArray(source, RECORD_ARRAY_KEYS)
  const records = normalizeRecords(recordArray)

  let counts = countsFrom(source)
  if (sumStatusCounts(counts) === 0 && records.length > 0) {
    counts = countsFromRecords(records)
  }

  const from =
    firstString(source, ['from', 'startDate', 'start_date', 'fromDate']) ??
    fallback.from ??
    null
  const to =
    firstString(source, ['to', 'endDate', 'end_date', 'toDate']) ??
    fallback.to ??
    null

  const explicitWorkingDays = firstNumber(source, [
    'workingDays',
    'working_days',
    'totalWorkingDays',
    'total_working_days',
    'expectedDays',
    'schoolDays',
    'daysWorked',
  ])
  const recordDays = uniqueRecordDates(records)
  const fallbackWorkingDays =
    from && to
      ? countWeekdays(from, to)
      : countWeekdays(
          records[0]?.date,
          records[records.length - 1]?.date,
        )

  const attendedAliases = [
    'attendedDays',
    'attended_days',
    'daysAttended',
    'attendanceDays',
    'attendance_days',
    'totalAttended',
    'attended',
  ]
  const hasAttended = hasNumberKey(source, attendedAliases)
  const attendedDays = hasAttended
    ? firstNumber(source, attendedAliases)
    : counts.present + counts.late

  let workingDays = explicitWorkingDays
  if (workingDays <= 0) {
    workingDays =
      fallbackWorkingDays > 0
        ? fallbackWorkingDays
        : Math.max(recordDays, attendedDays, sumStatusCounts(counts))
  }
  workingDays = Math.max(workingDays, recordDays, attendedDays)

  const rate = normalizeRate(source, attendedDays, workingDays)

  let weekly = normalizeBuckets(value, WEEKLY_ARRAY_KEYS, 'weekly')
  let monthly = normalizeBuckets(value, MONTHLY_ARRAY_KEYS, 'monthly')

  if (weekly.length === 0 && records.length > 0) {
    weekly = groupRecords(records, 'weekly')
  }
  if (monthly.length === 0 && records.length > 0) {
    monthly = groupRecords(records, 'monthly')
  }

  return {
    from,
    to,
    workingDays,
    attendedDays,
    attendanceRate: rate,
    counts,
    weekly,
    monthly,
    records,
  }
}

function normalizeTeacher(
  value: unknown,
  fallbackWorkingDays: number,
): TeacherAttendanceStat | null {
  const record = asRecord(value)
  if (!record) return null

  const merged = mergeSources(value)
  const profile =
    asRecord(record.teacher) ??
    asRecord(record.user) ??
    asRecord(record.profile) ??
    record
  const source = { ...merged, ...profile }

  const firstName =
    firstString(source, ['firstName', 'first_name']) ?? ''
  const surname =
    firstString(source, ['surname', 'lastName', 'last_name']) ?? ''
  const name =
    [firstName, surname].filter(Boolean).join(' ') ||
    firstString(source, [
      'name',
      'fullName',
      'full_name',
      'displayName',
      'display_name',
    ]) ||
    firstString(source, ['email', 'ecNumber', 'ec_number']) ||
    'Unnamed teacher'

  const id =
    firstString(source, [
      'id',
      'teacherId',
      'teacher_id',
      'userId',
      'user_id',
      'ecNumber',
      'ec_number',
    ]) ?? name

  const counts = countsFrom(source)
  const workingDays =
    firstNumber(source, [
      'workingDays',
      'working_days',
      'totalWorkingDays',
      'total_working_days',
    ]) || fallbackWorkingDays
  const attendedAliases = [
    'attendedDays',
    'attended_days',
    'daysAttended',
    'attendanceDays',
    'attendance_days',
    'totalAttended',
    'attended',
  ]
  const attendedDays = hasNumberKey(source, attendedAliases)
    ? firstNumber(source, attendedAliases)
    : counts.present + counts.late

  const hasDuties = hasNumberKey(source, [
    'duties',
    'dutyDays',
    'duty_days',
    'dutyCount',
    'duty_count',
  ])
  const duties = hasDuties
    ? firstNumber(source, [
        'duties',
        'dutyDays',
        'duty_days',
        'dutyCount',
        'duty_count',
      ])
    : dutyDays(counts)

  const effectiveWorkingDays = Math.max(workingDays, attendedDays)

  return {
    id,
    name,
    department:
      firstString(source, [
        'department',
        'departmentName',
        'department_name',
        'section',
        'grade',
      ]) ?? 'Unassigned',
    counts,
    duties,
    workingDays: effectiveWorkingDays,
    attendedDays,
    attendanceRate: normalizeRate(
      source,
      attendedDays,
      effectiveWorkingDays,
    ),
  }
}

function normalizeDepartment(
  value: unknown,
  fallbackWorkingDays: number,
): DepartmentAttendanceStat | null {
  const record = asRecord(value)
  if (!record) return null

  const source = {
    ...mergeSources(value),
    ...(asRecord(record.departmentData) ??
      asRecord(record.departmentInfo) ??
      record),
  }

  const department =
    firstString(source, [
      'department',
      'departmentName',
      'department_name',
      'name',
      'label',
    ]) ?? 'Unassigned'

  const counts = countsFrom(source)
  const workingDays =
    firstNumber(source, [
      'workingDays',
      'working_days',
      'totalWorkingDays',
      'total_working_days',
    ]) || fallbackWorkingDays
  const attendedAliases = [
    'attendedDays',
    'attended_days',
    'daysAttended',
    'attendanceDays',
    'attendance_days',
    'totalAttended',
    'attended',
  ]
  const attendedDays = hasNumberKey(source, attendedAliases)
    ? firstNumber(source, attendedAliases)
    : counts.present + counts.late

  const effectiveWorkingDays = Math.max(workingDays, attendedDays)

  return {
    department,
    counts,
    workingDays: effectiveWorkingDays,
    attendedDays,
    attendanceRate: normalizeRate(
      source,
      attendedDays,
      effectiveWorkingDays,
    ),
  }
}

function departmentsFromTeachers(
  teachers: TeacherAttendanceStat[],
): DepartmentAttendanceStat[] {
  const grouped = new Map<string, DepartmentAttendanceStat>()

  for (const teacher of teachers) {
    const key = teacher.department || 'Unassigned'
    let group = grouped.get(key)

    if (!group) {
      group = {
        department: key,
        counts: emptyStatusCounts(),
        workingDays: 0,
        attendedDays: 0,
        attendanceRate: 0,
      }
      grouped.set(key, group)
    }

    addStatusCounts(group.counts, teacher.counts)
    group.workingDays += teacher.workingDays
    group.attendedDays += teacher.attendedDays
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      attendanceRate: attendanceRate(
        group.attendedDays,
        group.workingDays,
      ),
    }))
    .sort((a, b) => a.department.localeCompare(b.department))
}

export function normalizeSchoolStats(
  value: unknown,
  fallback: AttendanceRange = {},
): SchoolAttendanceStats {
  const source = mergeSources(value)
  let range = normalizeRangeStats(value, fallback)

  const teacherRows = findFirstArray(source, TEACHER_ARRAY_KEYS)
  const teachers = teacherRows
    .map((item) => normalizeTeacher(item, range.workingDays))
    .filter((item): item is TeacherAttendanceStat => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name))

  if (sumStatusCounts(range.counts) === 0 && teachers.length > 0) {
    const combined = teachers.reduce(
      (total, teacher) => addStatusCounts(total, teacher.counts),
      emptyStatusCounts(),
    )
    const workingDays = teachers.reduce(
      (total, teacher) => total + teacher.workingDays,
      0,
    )
    const attendedDays = teachers.reduce(
      (total, teacher) => total + teacher.attendedDays,
      0,
    )

    range = {
      ...range,
      counts: combined,
      workingDays,
      attendedDays,
      attendanceRate: attendanceRate(attendedDays, workingDays),
    }
  }

  const departmentRows = findFirstArray(source, DEPARTMENT_ARRAY_KEYS)
  const departments =
    departmentRows.length > 0
      ? departmentRows
          .map((item) => normalizeDepartment(item, range.workingDays))
          .filter(
            (item): item is DepartmentAttendanceStat => item !== null,
          )
          .sort((a, b) => a.department.localeCompare(b.department))
      : departmentsFromTeachers(teachers)

  return { range, teachers, departments }
}

