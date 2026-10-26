import { getCurrentUser } from './auth'

export type UserRole = 'teacher' | 'head' | 'deputy' | 'teacher-in-charge' | 'admin'

const ROLE_LABELS: Record<UserRole, string> = {
  teacher: 'Teacher',
  head: 'Head',
  deputy: 'Deputy Head',
  'teacher-in-charge': 'Teacher in Charge',
  admin: 'Administrator',
}

const ADMIN_ROLES: UserRole[] = ['admin', 'head', 'deputy', 'teacher-in-charge']

const HEAD_ROLES = [
  'head',
  'headmaster',
  'headmistress',
  'headteacher',
  'principal',
  'schoolhead',
]

const DEPUTY_ROLES = [
  'deputy',
  'deputyhead',
  'deputyheadmaster',
  'deputyheadmistress',
  'deputyprincipal',
  'vicehead',
  'viceprincipal',
]

const TEACHER_IN_CHARGE_ROLES = [
  'teacherincharge',
  'headteacherincharge',
  'seniorteacher',
  'tic',
]

const ADMIN_ROLE_VALUES = ['admin', 'administrator', 'superadmin', 'schooladmin']

function compact(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z]/g, '')
}

export function normalizeRole(value?: string | null): UserRole {
  const role = value ? compact(value) : ''
  if (!role) return 'teacher'

  if (HEAD_ROLES.includes(role)) return 'head'
  if (DEPUTY_ROLES.includes(role) || role.startsWith('deputy')) return 'deputy'
  if (TEACHER_IN_CHARGE_ROLES.includes(role) || role.includes('incharge')) {
    return 'teacher-in-charge'
  }
  if (ADMIN_ROLE_VALUES.includes(role)) return 'admin'

  return 'teacher'
}

function rawRole(value?: string | null): string | undefined {
  const role = value?.trim()
  return role || undefined
}

export function getRole(): UserRole {
  const user = getCurrentUser()
  if (user?.isAdmin) return 'admin'

  return normalizeRole(
    user?.role ?? user?.userRole ?? user?.position ?? user?.title,
  )
}

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}

export function isReviewerRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}

export function isAdmin(): boolean {
  return isAdminRole(getRole())
}

export function isReviewer(): boolean {
  return isReviewerRole(getRole())
}

export function isTeacherInCharge(role: UserRole = getRole()): boolean {
  return role === 'teacher-in-charge'
}

export function canManageCalendarItems(role: UserRole = getRole()): boolean {
  return ADMIN_ROLES.includes(role)
}

export function canPinCalendarItems(role: UserRole = getRole()): boolean {
  return role === 'head' || role === 'deputy' || role === 'admin'
}

export function getRoleLabel(role: UserRole = getRole()): string {
  return ROLE_LABELS[role]
}

export function formatRoleLabel(value?: string | null): string {
  const raw = rawRole(value)
  const role = normalizeRole(raw)

  if (!raw) return ROLE_LABELS.teacher
  if (role !== 'teacher') return ROLE_LABELS[role]

  const key = compact(raw)
  if (['teacher', 'staff', 'educator', 'facilitator'].includes(key)) {
    return ROLE_LABELS.teacher
  }

  return raw
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function getHomePath(): string {
  return isAdmin() ? '/admin' : '/'
}
