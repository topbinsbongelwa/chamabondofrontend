export interface AttendanceRecord {
  id: string | number | null
  date: string
  status: string
  checkIn: string | null
  checkOut: string | null
  note: string | null
}

export interface AttendanceSummary {
  present: number
  late: number
  sickLeave: number
  leave: number
  absent: number
}

export const MARK_OPTIONS = [
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'leave', label: 'Leave' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'official_duty', label: 'Official Duty' },
] as const

export type AttendanceStatusKey =
  | 'present'
  | 'late'
  | 'sick-leave'
  | 'leave'
  | 'holiday'
  | 'official-duty'
  | 'absent'
  | 'unknown'

export const STATUS_LABELS: Record<AttendanceStatusKey, string> = {
  present: 'Present',
  late: 'Late',
  'sick-leave': 'Sick Leave',
  leave: 'Leave',
  holiday: 'Holiday',
  'official-duty': 'Official Duty',
  absent: 'Absent',
  unknown: 'Not marked',
}

const STATUS_ALIASES: Record<string, AttendanceStatusKey> = {
  present: 'present',
  checkedin: 'present',
  checked: 'present',
  late: 'late',
  absent: 'absent',
  sick: 'sick-leave',
  sickleave: 'sick-leave',
  leave: 'leave',
  annualleave: 'leave',
  paidleave: 'leave',
  holiday: 'holiday',
  publicholiday: 'holiday',
  officialduty: 'official-duty',
  duty: 'official-duty',
}

export function statusKey(value?: string | null): AttendanceStatusKey {
  if (!value) return 'unknown'

  const key = value.trim().toLowerCase().replace(/[\s_-]+/g, '')
  return STATUS_ALIASES[key] ?? 'unknown'
}

export function statusLabel(value?: string | null): string {
  const key = statusKey(value)
  if (key !== 'unknown') return STATUS_LABELS[key]
  return value?.trim() || STATUS_LABELS.unknown
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number') return String(value)
  return null
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function unwrapObject(value: unknown): Record<string, unknown> {
  let current = asRecord(value)

  for (let depth = 0; depth < 4 && current; depth += 1) {
    const nested =
      asRecord(current.data) ??
      asRecord(current.attendance) ??
      asRecord(current.today) ??
      asRecord(current.summary) ??
      asRecord(current.counts) ??
      asRecord(current.stats) ??
      asRecord(current.totals) ??
      asRecord(current.record)

    if (!nested) break
    current = nested
  }

  return current ?? {}
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(source[key])
    if (value) return value
  }
  return null
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    if (source[key] !== undefined) return asNumber(source[key])
  }
  return 0
}

export function normalizeRecord(value: unknown): AttendanceRecord | null {
  const source = unwrapObject(value)
  if (Object.keys(source).length === 0) return null

  const date = pickString(source, [
    'date',
    'attendanceDate',
    'attendance_date',
    'day',
    'createdAt',
    'created_at',
  ])

  const status = pickString(source, [
    'status',
    'attendanceStatus',
    'attendance_status',
    'type',
  ])

  const checkIn = pickString(source, [
    'checkIn',
    'check_in',
    'checkInTime',
    'check_in_time',
    'clockIn',
    'clock_in',
  ])

  const checkOut = pickString(source, [
    'checkOut',
    'check_out',
    'checkOutTime',
    'check_out_time',
    'clockOut',
    'clock_out',
  ])

  const note = pickString(source, ['note', 'notes', 'comment', 'reason'])

  if (!date && !status && !checkIn && !checkOut) return null

  return {
    id: (source.id as string | number | undefined) ?? null,
    date: date ?? new Date().toISOString(),
    status: status ?? (checkIn ? 'present' : 'unknown'),
    checkIn,
    checkOut,
    note,
  }
}

function findRecordArray(value: unknown, depth = 0): unknown[] {
  if (Array.isArray(value)) return value
  if (depth > 4) return []

  const source = asRecord(value)
  if (!source) return []

  for (const key of [
    'data',
    'attendance',
    'attendances',
    'records',
    'results',
    'items',
    'history',
  ]) {
    const candidate = source[key]
    if (Array.isArray(candidate)) return candidate
    if (asRecord(candidate)) {
      const nested = findRecordArray(candidate, depth + 1)
      if (nested.length > 0) return nested
    }
  }

  return []
}

export function normalizeRecords(value: unknown): AttendanceRecord[] {
  return findRecordArray(value)
    .map((item) => normalizeRecord(item))
    .filter((item): item is AttendanceRecord => item !== null)
}

export function normalizeSummary(value: unknown): AttendanceSummary {
  const source = unwrapObject(value)

  return {
    present: pickNumber(source, [
      'present',
      'presentCount',
      'present_count',
      'daysPresent',
      'presentDays',
      'totalPresent',
    ]),
    late: pickNumber(source, [
      'late',
      'lateCount',
      'late_count',
      'daysLate',
      'lateDays',
      'totalLate',
    ]),
    sickLeave: pickNumber(source, [
      'sickLeave',
      'sick_leave',
      'sickLeaveCount',
      'sick_leave_count',
      'sickLeaveDays',
      'sickDays',
      'sick',
    ]),
    leave: pickNumber(source, [
      'leave',
      'leaveCount',
      'leave_count',
      'leaveDays',
      'annualLeave',
      'totalLeave',
    ]),
    absent: pickNumber(source, [
      'absent',
      'absentCount',
      'absent_count',
      'daysAbsent',
      'absentDays',
      'totalAbsent',
    ]),
  }
}
