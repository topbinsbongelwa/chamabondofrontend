import {
  CALENDAR_CATEGORIES,
  CALENDAR_TYPES,
  type CalendarAudience,
  type CalendarCategoryOption,
  type CalendarItemType,
  type CalendarPriority,
} from '../constants/calendar'
import type { StoredUser } from './auth'
import { formatDate, formatFullDate, formatTime, parseDateValue } from './format'

export interface CalendarTeacher {
  id: string | null
  name: string
  ecNumber: string | null
  department: string | null
}

export interface CalendarItem {
  id: string
  type: CalendarItemType
  title: string
  description: string
  startDate: string
  endDate: string | null
  allDay: boolean
  startTime: string | null
  endTime: string | null
  venue: string | null
  category: string
  audience: CalendarAudience
  department: string | null
  assignedTeachers: CalendarTeacher[]
  priority: CalendarPriority
  pinned: boolean
  expiresAt: string | null
  createdBy: string | null
  createdById: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface CalendarItemInput {
  type: CalendarItemType
  title: string
  description: string
  startDate: string
  endDate: string
  allDay: boolean
  startTime: string
  endTime: string
  venue: string
  category: string
  audience: CalendarAudience
  department: string
  assignedTeacherIds: Array<string | number>
  priority: CalendarPriority
  pinned: boolean
  expiresAt: string
}

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

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
  }
  if (typeof value === 'number') return value !== 0
  return undefined
}

function pickString(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = asString(source[key])
    if (value) return value
  }
  return null
}

function findObject(value: unknown, depth = 0): Record<string, unknown> | null {
  const record = asRecord(value)
  if (!record || depth > 4) return record

  for (const key of ['data', 'event', 'item', 'record', 'calendarItem']) {
    const nested = asRecord(record[key])
    if (nested) return findObject(nested, depth + 1)
  }

  return record
}

function findArray(value: unknown, depth = 0): unknown[] {
  if (Array.isArray(value)) return value
  if (depth > 4) return []

  const source = asRecord(value)
  if (!source) return []

  for (const key of [
    'items',
    'events',
    'activities',
    'calendar',
    'entries',
    'results',
    'records',
    'upcoming',
    'data',
  ]) {
    const candidate = source[key]
    if (Array.isArray(candidate)) return candidate
    if (asRecord(candidate)) {
      const nested = findArray(candidate, depth + 1)
      if (nested.length > 0) return nested
    }
  }

  return []
}

function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toDateKey(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null

  const datePart = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  if (datePart) {
    return `${datePart[1]}-${datePart[2]}-${datePart[3]}`
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return dateKeyFromDate(date)
}

export function dateKeyFromDateValue(value: Date): string {
  return dateKeyFromDate(value)
}

export function todayKey(): string {
  return dateKeyFromDate(new Date())
}

function timeKeyFromParts(hour: number, minute: number): string | null {
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function toTimeKey(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null

  const timeOnly = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i.exec(
    raw.trim(),
  )
  if (timeOnly) {
    let hour = Number(timeOnly[1])
    const minute = Number(timeOnly[2])
    const meridiem = timeOnly[3]?.toLowerCase()

    if (meridiem === 'pm' && hour < 12) hour += 12
    if (meridiem === 'am' && hour === 12) hour = 0

    return timeKeyFromParts(hour, minute)
  }

  const isoTime = /T(\d{2}):(\d{2})/.exec(raw)
  if (isoTime) {
    return timeKeyFromParts(Number(isoTime[1]), Number(isoTime[2]))
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return timeKeyFromParts(date.getHours(), date.getMinutes())
}

function timeFromDateValue(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  return toTimeKey(raw)
}

function normalizeType(value: unknown): CalendarItemType {
  const key = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')

  if (key.startsWith('activity')) return 'activity'
  if (key.startsWith('update') || key.startsWith('announcement')) return 'update'
  if (key.startsWith('notice')) return 'update'
  if (key.startsWith('holiday') || key.startsWith('public')) return 'holiday'
  if (key.startsWith('deadline') || key.startsWith('due')) return 'deadline'

  return 'event'
}

function normalizeCategory(value: unknown): string {
  const raw = asString(value)
  if (!raw) return 'general'

  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  return normalized || 'general'
}

function normalizeAudience(value: unknown): CalendarAudience {
  const key = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')

  if (
    key.includes('department') ||
    key.includes('dept') ||
    key.includes('section')
  ) {
    return 'department'
  }

  return 'all'
}

function normalizePriority(value: unknown): CalendarPriority {
  const key = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')

  if (
    key === 'important' ||
    key === 'high' ||
    key === 'urgent' ||
    key === 'critical'
  ) {
    return 'important'
  }

  return 'normal'
}

function teacherName(source: Record<string, unknown>): string | null {
  const first = pickString(source, ['firstName', 'first_name'])
  const last = pickString(source, ['surname', 'lastName', 'last_name'])
  const combined = [first, last].filter(Boolean).join(' ')

  return (
    combined ||
    pickString(source, [
      'name',
      'fullName',
      'full_name',
      'displayName',
      'display_name',
      'email',
      'ecNumber',
      'ec_number',
    ])
  )
}

function normalizeTeacher(value: unknown): CalendarTeacher | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const id = asString(value)
    if (!id) return null
    return { id, name: id, ecNumber: null, department: null }
  }

  const source = asRecord(value)
  if (!source) return null

  const nested =
    asRecord(source.teacher) ??
    asRecord(source.user) ??
    asRecord(source.staff) ??
    source
  const rawId =
    nested.id ??
    nested._id ??
    source.teacherId ??
    source.teacher_id ??
    source.userId ??
    source.user_id ??
    source.staffId ??
    source.staff_id
  const id = asString(rawId)
  const name = teacherName(nested)

  if (!id && !name) return null

  return {
    id,
    name: name ?? `Teacher ${id}`,
    ecNumber:
      pickString(nested, ['ecNumber', 'ec_number', 'employeeNumber']) ??
      pickString(source, ['ecNumber', 'ec_number', 'employeeNumber']),
    department:
      pickString(nested, ['department', 'section']) ??
      pickString(source, ['department', 'section']),
  }
}

function normalizeTeachers(value: unknown): CalendarTeacher[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const teachers: CalendarTeacher[] = []

  for (const item of value) {
    const teacher = normalizeTeacher(item)
    if (!teacher) continue

    const key = teacher.id
      ? `id:${teacher.id.toLowerCase()}`
      : `name:${teacher.name.toLowerCase()}`
    if (seen.has(key)) continue

    seen.add(key)
    teachers.push(teacher)
  }

  return teachers
}

export function normalizeCalendarItem(value: unknown): CalendarItem | null {
  const source = findObject(value)
  if (!source) return null

  const rawId =
    source.id ??
    source._id ??
    source.eventId ??
    source.event_id ??
    source.calendarId ??
    source.calendar_id
  const id = asString(rawId)
  if (!id) return null

  const startValue =
    source.startDate ??
    source.start_date ??
    source.start ??
    source.date ??
    source.eventDate ??
    source.event_date
  const startDate = toDateKey(startValue)
  if (!startDate) return null

  const startTimeFromValue =
    source.startTime ??
    source.start_time ??
    source.time ??
    source.timeFrom ??
    source.time_from
  const endValue =
    source.endDate ??
    source.end_date ??
    source.end ??
    source.endTime ??
    source.end_time ??
    source.eventEnd ??
    source.event_end
  const explicitEndDate = toDateKey(endValue)
  const endDate = explicitEndDate ?? null

  const startTime =
    toTimeKey(startTimeFromValue) ?? timeFromDateValue(startValue)
  const endTime =
    toTimeKey(
      source.endTime ??
        source.end_time ??
        source.timeTo ??
        source.time_to,
    ) ?? (explicitEndDate ? timeFromDateValue(endValue) : null)

  const allDay =
    asBoolean(
      source.allDay ?? source.all_day ?? source.isAllDay ?? source.is_all_day,
    ) ?? (!startTime && !endTime)

  const assignedTeachers = normalizeTeachers(
    source.assignedTeachers ??
      source.assigned_teachers ??
      source.teachers ??
      source.staff ??
      source.assignedTeacherIds ??
      source.assigned_teacher_ids ??
      source.teacherIds ??
      source.teacher_ids,
  )

  const createdBySource =
    asRecord(source.createdBy) ??
    asRecord(source.created_by) ??
    asRecord(source.creator) ??
    asRecord(source.author)

  const createdById = asString(
    createdBySource?.id ??
      createdBySource?._id ??
      source.createdById ??
      source.created_by_id,
  )

  return {
    id,
    type: normalizeType(source.type ?? source.itemType ?? source.item_type),
    title:
      pickString(source, ['title', 'name', 'summary', 'subject']) ??
      'Untitled item',
    description:
      pickString(source, ['description', 'body', 'details', 'text', 'notes']) ??
      '',
    startDate,
    endDate,
    allDay,
    startTime: allDay ? null : startTime,
    endTime: allDay ? null : endTime,
    venue:
      pickString(source, ['venue', 'location', 'place', 'room']) ?? null,
    category: normalizeCategory(
      source.category ?? source.eventCategory ?? source.event_category,
    ),
    audience: normalizeAudience(
      source.audience ?? source.audienceType ?? source.audience_type,
    ),
    department:
      pickString(source, ['department', 'targetDepartment', 'target_department']) ??
      null,
    assignedTeachers,
    priority: normalizePriority(
      source.priority ?? source.importance ?? source.level,
    ),
    pinned:
      asBoolean(
        source.pinned ??
          source.isPinned ??
          source.is_pinned ??
          source.pinToTop ??
          source.pin_to_top,
      ) ?? false,
    expiresAt:
      toDateKey(
        source.expiresAt ??
          source.expires_at ??
          source.expiryDate ??
          source.expiry_date ??
          source.expiry,
      ) ?? null,
    createdBy:
      (createdBySource ? teacherName(createdBySource) : null) ??
      pickString(source, [
        'createdBy',
        'created_by',
        'authorName',
        'author_name',
        'creatorName',
        'creator_name',
      ]),
    createdById,
    createdAt: pickString(source, [
      'createdAt',
      'created_at',
      'postedAt',
      'posted_at',
      'publishedAt',
      'published_at',
    ]),
    updatedAt: pickString(source, ['updatedAt', 'updated_at', 'modifiedAt']),
  }
}

export function normalizeCalendarList(value: unknown): CalendarItem[] {
  const list = findArray(value)

  if (list.length > 0) {
    return list
      .map((item) => normalizeCalendarItem(item))
      .filter((item): item is CalendarItem => item !== null)
  }

  const single = normalizeCalendarItem(value)
  return single ? [single] : []
}

export function formatCalendarCategory(value: string): string {
  const match = CALENDAR_CATEGORIES.find(
    (category) => category.value === value,
  )
  if (match) return match.label
  if (!value.trim()) return 'General'

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function categoryOptionsFor(
  items: CalendarItem[],
): CalendarCategoryOption[] {
  const options = new Map(
    CALENDAR_CATEGORIES.map((category) => [category.value, category]),
  )

  for (const item of items) {
    if (!item.category || options.has(item.category)) continue
    options.set(item.category, {
      value: item.category,
      label: formatCalendarCategory(item.category),
    })
  }

  return Array.from(options.values())
}

export function parseCalendarDate(value: string): Date {
  return parseDateValue(value)
}

export function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

export function addMonths(value: Date, amount: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1)
}

export function addDays(value: Date, amount: number): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate() + amount)
}

export function startOfWeekMonday(value: Date): Date {
  const day = value.getDay()
  const offset = day === 0 ? -6 : 1 - day
  return addDays(value, offset)
}

export function monthDateKeys(month: Date): { from: string; to: string } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

  return { from: dateKeyFromDate(start), to: dateKeyFromDate(end) }
}

export function occursOnDate(item: CalendarItem, dateKey: string): boolean {
  const end = item.endDate ?? item.startDate
  return item.startDate <= dateKey && end >= dateKey
}

export function sortCalendarItems(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => {
    const aKey = `${a.startDate}T${a.allDay ? '00:00' : (a.startTime ?? '23:59')}`
    const bKey = `${b.startDate}T${b.allDay ? '00:00' : (b.startTime ?? '23:59')}`
    if (aKey !== bKey) return aKey.localeCompare(bKey)
    return a.title.localeCompare(b.title)
  })
}

export function calendarItemsForDate(
  items: CalendarItem[],
  dateKey: string,
): CalendarItem[] {
  return sortCalendarItems(
    items.filter((item) => occursOnDate(item, dateKey)),
  )
}

export function calendarItemsForMonth(
  items: CalendarItem[],
  month: Date,
): CalendarItem[] {
  const { from, to } = monthDateKeys(month)

  return sortCalendarItems(
    items.filter((item) => {
      const end = item.endDate ?? item.startDate
      return item.startDate <= to && end >= from
    }),
  )
}

export function isCalendarItemUpcoming(
  item: CalendarItem,
  reference = todayKey(),
): boolean {
  return (item.endDate ?? item.startDate) >= reference
}

export function isCalendarItemExpired(
  item: CalendarItem,
  reference = todayKey(),
): boolean {
  return Boolean(item.expiresAt && item.expiresAt < reference)
}

export function formatCalendarDateRange(item: CalendarItem): string {
  const start = formatDate(item.startDate)
  if (!item.endDate || item.endDate === item.startDate) return start

  return `${start} – ${formatDate(item.endDate)}`
}

export function formatCalendarTimeRange(item: CalendarItem): string {
  if (item.allDay) return 'All day'
  if (item.startTime && item.endTime) {
    return `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`
  }
  if (item.startTime) return formatTime(item.startTime)
  return 'Time to be confirmed'
}

export function formatCalendarDateHeading(dateKey: string): string {
  return formatFullDate(parseDateValue(dateKey))
}

function normalizedName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isCalendarItemCreatedByMe(
  item: CalendarItem,
  user: StoredUser | null,
): boolean {
  if (!user) return false

  if (
    item.createdById &&
    user.id !== undefined &&
    user.id !== null &&
    String(user.id).toLowerCase() === item.createdById.toLowerCase()
  ) {
    return true
  }

  if (!item.createdBy) return false

  const creator = normalizedName(item.createdBy)
  const candidates = new Set<string>()

  const fullName = [user.firstName, user.surname].filter(Boolean).join(' ')
  if (fullName) candidates.add(normalizedName(fullName))
  if (user.name) candidates.add(normalizedName(user.name))
  if (user.fullName) candidates.add(normalizedName(user.fullName))
  if (user.ecNumber) candidates.add(normalizedName(user.ecNumber))
  if (user.email) candidates.add(normalizedName(user.email))

  return candidates.has(creator)
}

export function isCalendarItemAssignedToMe(
  item: CalendarItem,
  user: StoredUser | null,
): boolean {
  if (!user) return false

  const ids = new Set<string>()
  const ecNumbers = new Set<string>()
  const names = new Set<string>()

  if (user.id !== undefined && user.id !== null) {
    ids.add(String(user.id).toLowerCase())
  }
  if (user.ecNumber) ecNumbers.add(normalizedName(user.ecNumber))
  if (user.email) ecNumbers.add(normalizedName(user.email))

  const fullName = [user.firstName, user.surname].filter(Boolean).join(' ')
  if (fullName) names.add(normalizedName(fullName))
  if (user.name) names.add(normalizedName(user.name))
  if (user.fullName) names.add(normalizedName(user.fullName))

  return item.assignedTeachers.some((teacher) => {
    if (teacher.id && ids.has(teacher.id.toLowerCase())) return true
    if (teacher.ecNumber && ecNumbers.has(normalizedName(teacher.ecNumber))) {
      return true
    }
    if (teacher.name && names.has(normalizedName(teacher.name))) return true
    return false
  })
}

export function calendarTypeCounts(
  items: CalendarItem[],
): Record<CalendarItemType, number> {
  const counts = Object.fromEntries(
    CALENDAR_TYPES.map((type) => [type, 0]),
  ) as Record<CalendarItemType, number>

  for (const item of items) counts[item.type] += 1
  return counts
}

