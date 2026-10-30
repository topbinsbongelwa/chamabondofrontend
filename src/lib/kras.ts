export type KraStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface Kra {
  id: string | number
  title: string
  description: string
  indicator: string
  target: string
  term: string
  year: string
  progress: number
  status: KraStatus
  reviewerComment: string | null
  department: string | null
  teacherId: string | number | null
  teacherName: string | null
  documentId: string | null
  documentName: string | null
  documentSize: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface KraInput {
  title: string
  description: string
  indicator: string
  target: string
  term: string
  year: string
}

export const KRA_STATUSES: KraStatus[] = [
  'draft',
  'pending',
  'approved',
  'rejected',
]

export const KRA_STATUS_LABELS: Record<KraStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const KRA_STATUS_BADGES: Record<KraStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  pending: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
}

export const KRA_STATUS_DOTS: Record<KraStatus, string> = {
  draft: 'bg-slate-400',
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
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

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
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

function findObject(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value)
  if (!record) return null

  let current = record

  for (let depth = 0; depth < 4; depth += 1) {
    const nested =
      asRecord(current.data) ??
      asRecord(current.kra) ??
      asRecord(current.record) ??
      asRecord(current.item)

    if (!nested) break
    current = nested
  }

  return current
}

function findArray(value: unknown, depth = 0): unknown[] {
  if (Array.isArray(value)) return value
  if (depth > 4) return []

  const source = asRecord(value)
  if (!source) return []

  for (const key of ['kras', 'data', 'results', 'items', 'records', 'entries']) {
    const candidate = source[key]
    if (Array.isArray(candidate)) return candidate

    if (asRecord(candidate)) {
      const nested = findArray(candidate, depth + 1)
      if (nested.length > 0) return nested
    }
  }

  return []
}

function nameFrom(value: unknown): string | null {
  const source = asRecord(value)
  if (!source) return null

  const first = pickString(source, ['firstName', 'first_name'])
  const last = pickString(source, ['surname', 'lastName', 'last_name'])
  const combined = [first, last].filter(Boolean).join(' ')

  return (
    combined ||
    pickString(source, ['name', 'fullName', 'full_name', 'displayName'])
  )
}

export function normalizeKraStatus(value: unknown): KraStatus {
  const key = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')

  if (key === 'draft' || key === 'saved') return 'draft'
  if (key === 'approved' || key === 'approve' || key === 'accepted') {
    return 'approved'
  }
  if (key === 'rejected' || key === 'reject' || key === 'declined') {
    return 'rejected'
  }

  return 'pending'
}

export function normalizeProgress(value: unknown): number {
  const parsed = asNumber(value)
  if (parsed === null) return 0

  const percent = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed
  return Math.min(100, Math.max(0, Math.round(percent)))
}

export function normalizeKra(value: unknown): Kra | null {
  const source = findObject(value)
  if (!source) return null

  const rawId = source.id ?? source._id ?? source.kraId ?? source.kra_id
  const id = typeof rawId === 'number' ? rawId : asString(rawId)
  if (id === null) return null

  const teacher =
    asRecord(source.teacher) ??
    asRecord(source.user) ??
    asRecord(source.owner) ??
    asRecord(source.staff)

  const rawTeacherId =
    teacher?.id ??
    teacher?._id ??
    source.teacherId ??
    source.teacher_id ??
    source.userId ??
    source.user_id

  return {
    id,
    title:
      pickString(source, ['title', 'name', 'kraTitle', 'kra_title']) ??
      'Untitled KRA',
    description: pickString(source, ['description', 'details', 'summary']) ?? '',
    indicator:
      pickString(source, [
        'indicator',
        'keyIndicator',
        'key_indicator',
        'kpi',
        'measure',
      ]) ?? '',
    target:
      pickString(source, ['target', 'goal', 'targetValue', 'target_value']) ?? '',
    term:
      pickString(source, [
        'term',
        'termName',
        'term_name',
        'academicTerm',
        'academic_term',
      ]) ?? '',
    year:
      pickString(source, [
        'year',
        'academicYear',
        'academic_year',
        'termYear',
        'term_year',
      ]) ?? '',
    progress: normalizeProgress(
      source.progress ??
        source.percentage ??
        source.completion ??
        source.percent ??
        source.progressPercent,
    ),
    status: normalizeKraStatus(
      source.status ?? source.kraStatus ?? source.kra_status ?? source.state,
    ),
    reviewerComment: pickString(source, [
      'reviewerComment',
      'reviewer_comment',
      'reviewComment',
      'review_comment',
      'comment',
      'feedback',
      'remarks',
      'rejectionReason',
      'rejection_reason',
    ]),
    department:
      pickString(source, ['department', 'section', 'subject']) ??
      (teacher ? pickString(teacher, ['department', 'section']) : null),
    teacherId:
      typeof rawTeacherId === 'number'
        ? rawTeacherId
        : asString(rawTeacherId),
    teacherName:
      nameFrom(teacher) ??
      pickString(source, [
        'teacherName',
        'teacher_name',
        'staffName',
        'staff_name',
        'ownerName',
        'owner_name',
      ]),
    documentId: pickString(source, ['documentId', 'document_id']),
    documentName: pickString(source, ['documentName', 'document_name']),
    documentSize: asNumber(source.documentSize ?? source.document_size),
    createdAt: pickString(source, ['createdAt', 'created_at', 'submittedAt']),
    updatedAt: pickString(source, ['updatedAt', 'updated_at', 'reviewedAt']),
  }
}

export function normalizeKraList(value: unknown): Kra[] {
  const list = findArray(value)

  if (list.length > 0) {
    return list
      .map((item) => normalizeKra(item))
      .filter((item): item is Kra => item !== null)
  }

  const single = normalizeKra(value)
  return single ? [single] : []
}

export function kraStatusLabel(status: KraStatus): string {
  return KRA_STATUS_LABELS[status]
}

export function formatTerm(term: string): string {
  const trimmed = term.trim()
  if (!trimmed) return 'No term'

  const normalized = trimmed.replace(/[_-]+/g, ' ')
  if (/^\d+$/.test(normalized)) return `Term ${normalized}`
  if (/^term\s*\d+$/i.test(normalized)) {
    return normalized.replace(/^term/i, 'Term')
  }

  return normalized
}

export function kraTermKey(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^term/, '')
}
