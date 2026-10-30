export const CALENDAR_TYPES = [
  'event',
  'activity',
  'update',
  'holiday',
  'deadline',
] as const

export type CalendarItemType = (typeof CALENDAR_TYPES)[number]

export type CalendarPriority = 'normal' | 'important'
export type CalendarAudience = 'all' | 'department'

export interface CalendarTypeMeta {
  label: string
  plural: string
  dot: string
  chip: string
  badge: string
  accent: string
  soft: string
  text: string
}

export const CALENDAR_TYPE_META: Record<CalendarItemType, CalendarTypeMeta> = {
  event: {
    label: 'Event',
    plural: 'Events',
    dot: 'bg-emerald-500',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    accent: 'border-l-emerald-500',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  activity: {
    label: 'Activity',
    plural: 'Activities',
    dot: 'bg-gold',
    chip: 'border-amber-200 bg-amber-50 text-amber-900',
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    accent: 'border-l-gold',
    soft: 'bg-amber-50',
    text: 'text-amber-800',
  },
  update: {
    label: 'Update',
    plural: 'Updates',
    dot: 'bg-sky-500',
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    accent: 'border-l-sky-500',
    soft: 'bg-sky-50',
    text: 'text-sky-700',
  },
  holiday: {
    label: 'Holiday',
    plural: 'Holidays',
    dot: 'bg-red-500',
    chip: 'border-red-200 bg-red-50 text-red-800',
    badge: 'bg-red-50 text-red-700 ring-red-600/20',
    accent: 'border-l-red-500',
    soft: 'bg-red-50',
    text: 'text-red-700',
  },
  deadline: {
    label: 'Deadline',
    plural: 'Deadlines',
    dot: 'bg-purple-500',
    chip: 'border-purple-200 bg-purple-50 text-purple-800',
    badge: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    accent: 'border-l-purple-500',
    soft: 'bg-purple-50',
    text: 'text-purple-700',
  },
}

export const CALENDAR_TYPE_OPTIONS = CALENDAR_TYPES.map((value) => ({
  value,
  label: CALENDAR_TYPE_META[value].label,
}))

export interface CalendarCategoryOption {
  value: string
  label: string
}

export const CALENDAR_CATEGORIES: CalendarCategoryOption[] = [
  { value: 'general', label: 'General' },
  { value: 'academic', label: 'Academic' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'sports', label: 'Sports' },
  { value: 'culture', label: 'Culture' },
  { value: 'department', label: 'Department' },
  { value: 'exam', label: 'Exams' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'other', label: 'Other' },
]

export const CALENDAR_AUDIENCE_LABELS: Record<CalendarAudience, string> = {
  all: 'All staff',
  department: 'Department only',
}

export const CALENDAR_PRIORITY_LABELS: Record<CalendarPriority, string> = {
  normal: 'Normal',
  important: 'Important',
}
