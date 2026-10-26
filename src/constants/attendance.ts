export const ATTENDANCE_STATUSES = [
  'present',
  'late',
  'sick-leave',
  'leave',
  'holiday',
  'school-duty',
  'sports-duty',
  'absent',
] as const

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]
export type AttendanceStatusKey = AttendanceStatus | 'unknown'

export const STATUS_LABELS: Record<AttendanceStatusKey, string> = {
  present: 'Present',
  late: 'Late',
  'sick-leave': 'Sick Leave',
  leave: 'Leave',
  holiday: 'Holiday',
  'school-duty': 'School Duty',
  'sports-duty': 'Sports/Activities Duty',
  absent: 'Absent',
  unknown: 'Not marked',
}

export const STATUS_SHORT_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  'sick-leave': 'Sick',
  leave: 'Leave',
  holiday: 'Holiday',
  'school-duty': 'School duty',
  'sports-duty': 'Sports',
  absent: 'Absent',
}

export interface AttendanceStatusMeta {
  label: string
  color: string
  iconClass: string
  textClass: string
  badgeClass: string
  dotClass: string
}

export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatusKey,
  AttendanceStatusMeta
> = {
  present: {
    label: 'Present',
    color: '#059669',
    iconClass: 'bg-emerald-50 text-emerald-600',
    textClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dotClass: 'bg-emerald-500',
  },
  late: {
    label: 'Late',
    color: '#D97706',
    iconClass: 'bg-amber-50 text-amber-600',
    textClass: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    dotClass: 'bg-amber-500',
  },
  'sick-leave': {
    label: 'Sick Leave',
    color: '#2563EB',
    iconClass: 'bg-blue-50 text-blue-600',
    textClass: 'text-blue-700',
    badgeClass: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    dotClass: 'bg-blue-500',
  },
  leave: {
    label: 'Leave',
    color: '#7C3AED',
    iconClass: 'bg-purple-50 text-purple-600',
    textClass: 'text-purple-700',
    badgeClass: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    dotClass: 'bg-purple-500',
  },
  holiday: {
    label: 'Holiday',
    color: '#64748B',
    iconClass: 'bg-slate-100 text-slate-500',
    textClass: 'text-slate-600',
    badgeClass: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    dotClass: 'bg-slate-400',
  },
  'school-duty': {
    label: 'School Duty',
    color: '#0D9488',
    iconClass: 'bg-teal-50 text-teal-600',
    textClass: 'text-teal-700',
    badgeClass: 'bg-teal-50 text-teal-700 ring-teal-600/20',
    dotClass: 'bg-teal-500',
  },
  'sports-duty': {
    label: 'Sports/Activities Duty',
    color: '#D4AF37',
    iconClass: 'bg-gold/10 text-gold-700',
    textClass: 'text-gold-700',
    badgeClass: 'bg-gold/10 text-gold-700 ring-gold-600/30',
    dotClass: 'bg-gold',
  },
  absent: {
    label: 'Absent',
    color: '#DC2626',
    iconClass: 'bg-red-50 text-red-600',
    textClass: 'text-red-700',
    badgeClass: 'bg-red-50 text-red-700 ring-red-600/20',
    dotClass: 'bg-red-500',
  },
  unknown: {
    label: 'Not marked',
    color: '#94A3B8',
    iconClass: 'bg-slate-100 text-slate-500',
    textClass: 'text-slate-600',
    badgeClass: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    dotClass: 'bg-slate-400',
  },
}

export const STATUS_ORDER: AttendanceStatus[] = [...ATTENDANCE_STATUSES]

export const MARK_OPTIONS = [
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'leave', label: 'Leave' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'school_duty', label: 'School Duty' },
  { value: 'sports_activities_duty', label: 'Sports/Activities Duty' },
] as const

export const ATTENDANCE_STATUS_ALIASES: Record<string, AttendanceStatusKey> = {
  present: 'present',
  presentday: 'present',
  presentdays: 'present',
  attended: 'present',
  attendedday: 'present',
  attendeddays: 'present',
  checkedin: 'present',
  checked: 'present',
  onsite: 'present',
  late: 'late',
  latearrival: 'late',
  latecheckin: 'late',
  tardy: 'late',
  sick: 'sick-leave',
  sickleave: 'sick-leave',
  sickday: 'sick-leave',
  sickdays: 'sick-leave',
  medicalleave: 'sick-leave',
  leave: 'leave',
  annualleave: 'leave',
  paidleave: 'leave',
  casualleave: 'leave',
  dayleave: 'leave',
  holiday: 'holiday',
  publicholiday: 'holiday',
  schoolholiday: 'holiday',
  schoolduty: 'school-duty',
  officialduty: 'school-duty',
  officialdutyday: 'school-duty',
  duty: 'school-duty',
  schoolduties: 'school-duty',
  sportsduty: 'sports-duty',
  sportsactivitiesduty: 'sports-duty',
  sportsactivity: 'sports-duty',
  sportsactivities: 'sports-duty',
  activitiesduty: 'sports-duty',
  activityduty: 'sports-duty',
  cocurricular: 'sports-duty',
  cocurricularduty: 'sports-duty',
  absent: 'absent',
  absence: 'absent',
  unexcused: 'absent',
  unexcusedabsence: 'absent',
  notmarked: 'unknown',
  unknown: 'unknown',
}

export function attendanceStatusKey(value?: string | null): AttendanceStatusKey {
  if (!value) return 'unknown'

  const key = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
  return ATTENDANCE_STATUS_ALIASES[key] ?? 'unknown'
}
