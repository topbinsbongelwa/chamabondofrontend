import {
  normalizeRecord,
  normalizeRecords,
  normalizeSummary,
  type AttendanceRecord,
  type AttendanceSummary,
} from './attendance'

export interface StaffMember {
  id: string | number | null
  firstName: string
  surname: string
  name: string
  ecNumber: string | null
  department: string | null
  role: string
  phone: string | null
  email: string | null
  approved: boolean | null
  today: AttendanceRecord | null
  summary: AttendanceSummary
  recent: AttendanceRecord[]
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

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', 'approved', 'active', 'verified'].includes(normalized)) {
      return true
    }
    if (['false', 'pending', 'inactive', 'rejected'].includes(normalized)) {
      return false
    }
  }
  return undefined
}

export function normalizeStaffMember(value: unknown): StaffMember | null {
  const source = asRecord(value)
  if (!source) return null

  const profile =
    asRecord(source.profile) ??
    asRecord(source.user) ??
    asRecord(source.teacher) ??
    source

  const firstName =
    asString(profile.firstName) ?? asString(profile.first_name) ?? ''
  const surname =
    asString(profile.surname) ??
    asString(profile.lastName) ??
    asString(profile.last_name) ??
    ''
  const name =
    [firstName, surname].filter(Boolean).join(' ') ||
    asString(profile.name) ||
    asString(profile.fullName) ||
    asString(profile.full_name) ||
    'Unnamed staff'

  if (!firstName && !surname && name === 'Unnamed staff' && !source.id) {
    return null
  }

  const todaySource =
    source.today ??
    source.todayAttendance ??
    source.attendanceToday ??
    source.attendance ??
    (source.status || source.checkIn || source.check_in ? source : null)

  const recentSource =
    source.recent ??
    source.recentAttendance ??
    source.attendanceHistory ??
    source.history ??
    source.records ??
    []

  return {
    id: (source.id as string | number | undefined) ?? null,
    firstName,
    surname,
    name,
    ecNumber:
      asString(profile.ecNumber) ??
      asString(profile.ec_number) ??
      asString(profile.employeeNumber) ??
      null,
    department: asString(profile.department) ?? asString(profile.grade) ?? null,
    role:
      asString(profile.role) ??
      asString(profile.userRole) ??
      asString(profile.user_role) ??
      asString(profile.position) ??
      asString(profile.title) ??
      'TEACHER',
    phone:
      asString(profile.phone) ??
      asString(profile.phoneNumber) ??
      asString(profile.phone_number) ??
      null,
    email: asString(profile.email) ?? null,
    approved:
      asBoolean(profile.approved) ??
      asBoolean(profile.isApproved) ??
      asBoolean(profile.is_approved) ??
      asBoolean(profile.active) ??
      asBoolean(profile.status) ??
      null,
    today: normalizeRecord(todaySource),
    summary: normalizeSummary(
      source.summary ??
        source.stats ??
        source.attendanceSummary ??
        source.monthlySummary ??
        {},
    ),
    recent: normalizeRecords(recentSource),
  }
}

function findStaffArray(value: unknown, depth = 0): unknown[] {
  if (Array.isArray(value)) return value
  if (depth > 4) return []

  const source = asRecord(value)
  if (!source) return []

  for (const key of [
    'staff',
    'users',
    'teachers',
    'members',
    'data',
    'results',
    'items',
  ]) {
    const candidate = source[key]
    if (Array.isArray(candidate)) return candidate
    if (asRecord(candidate)) {
      const nested = findStaffArray(candidate, depth + 1)
      if (nested.length > 0) return nested
    }
  }

  return []
}

export function normalizeStaffList(value: unknown): StaffMember[] {
  return findStaffArray(value)
    .map((item) => normalizeStaffMember(item))
    .filter((item): item is StaffMember => item !== null)
}
