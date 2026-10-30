export type SchemeBookStatus = 'pending' | 'approved' | 'rejected'

export interface SchemeBook {
  id: string | number
  title: string
  subject: string
  grade: string
  term: string
  year: string
  weekFrom: number | null
  weekTo: number | null
  weeksCovered: string | null
  notes: string
  version: number
  status: SchemeBookStatus
  reviewerComment: string | null
  department: string | null
  teacherId: string | number | null
  teacherName: string | null
  documentId: string | null
  documentName: string | null
  documentType: string | null
  documentSize: number | null
  createdAt: string | null
  updatedAt: string | null
  reviewedAt: string | null
}

export interface SchemeBookInput {
  title: string
  subject: string
  grade: string
  term: string
  year: string
  weekFrom: string
  weekTo: string
  notes: string
}

export const SCHEME_BOOK_STATUSES: SchemeBookStatus[] = [
  'pending',
  'approved',
  'rejected',
]

export const SCHEME_BOOK_STATUS_LABELS: Record<SchemeBookStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const SCHEME_BOOK_STATUS_BADGES: Record<SchemeBookStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
}

export const SCHEME_BOOK_STATUS_DOTS: Record<SchemeBookStatus, string> = {
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
}

export const SCHEME_BOOK_MAX_FILE_SIZE = 10 * 1024 * 1024

export const SCHEME_BOOK_FILE_ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
].join(',')

const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
])

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

function pickNumber(
  source: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = asNumber(source[key])
    if (value !== null) return value
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
      asRecord(current.schemeBook) ??
      asRecord(current.scheme_book) ??
      asRecord(current.book) ??
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

  for (const key of [
    'schemeBooks',
    'scheme_books',
    'books',
    'data',
    'results',
    'items',
    'records',
    'entries',
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

function normalizeWeek(value: unknown): number | null {
  const parsed = asNumber(value)
  if (parsed === null || !Number.isInteger(parsed) || parsed < 1) return null
  return parsed
}

function normalizeVersion(value: unknown): number {
  const parsed = asNumber(value)
  if (parsed !== null && parsed >= 1) return Math.floor(parsed)

  const match = String(value ?? '').match(/\d+/)
  if (!match) return 1

  const version = Number(match[0])
  return Number.isFinite(version) && version >= 1 ? Math.floor(version) : 1
}

export function normalizeSchemeBookStatus(value: unknown): SchemeBookStatus {
  const key = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')

  if (key === 'approved' || key === 'approve' || key === 'accepted') {
    return 'approved'
  }
  if (key === 'rejected' || key === 'reject' || key === 'declined') {
    return 'rejected'
  }

  return 'pending'
}

export function normalizeSchemeBook(value: unknown): SchemeBook | null {
  const source = findObject(value)
  if (!source) return null

  const rawId =
    source.id ??
    source._id ??
    source.schemeBookId ??
    source.scheme_book_id ??
    source.bookId ??
    source.book_id
  const id = typeof rawId === 'number' ? rawId : asString(rawId)
  if (id === null) return null

  const teacher =
    asRecord(source.teacher) ??
    asRecord(source.user) ??
    asRecord(source.owner) ??
    asRecord(source.staff) ??
    asRecord(source.uploadedBy) ??
    asRecord(source.uploaded_by)

  const rawTeacherId =
    teacher?.id ??
    teacher?._id ??
    source.teacherId ??
    source.teacher_id ??
    source.userId ??
    source.user_id ??
    source.uploadedById ??
    source.uploaded_by_id

  const document =
    asRecord(source.document) ??
    asRecord(source.file) ??
    asRecord(source.attachment)

  const documentId =
    pickString(source, [
      'documentId',
      'document_id',
      'fileId',
      'file_id',
      'attachmentId',
      'attachment_id',
    ]) ?? (document ? pickString(document, ['id', '_id']) : null)

  const documentName =
    pickString(source, [
      'documentName',
      'document_name',
      'fileName',
      'file_name',
      'originalName',
      'original_name',
      'attachmentName',
      'attachment_name',
    ]) ??
    (document
      ? pickString(document, ['name', 'filename', 'originalName', 'original_name'])
      : null)

  return {
    id,
    title:
      pickString(source, [
        'title',
        'name',
        'schemeBookTitle',
        'scheme_book_title',
      ]) ?? 'Untitled scheme book',
    subject:
      pickString(source, [
        'subject',
        'subjectName',
        'subject_name',
        'learningArea',
        'learning_area',
      ]) ?? '',
    grade:
      pickString(source, [
        'grade',
        'gradeLevel',
        'grade_level',
        'className',
        'class_name',
        'class',
      ]) ?? '',
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
    weekFrom: normalizeWeek(
      pickNumber(source, [
        'weekFrom',
        'week_from',
        'fromWeek',
        'from_week',
        'startWeek',
        'start_week',
      ]),
    ),
    weekTo: normalizeWeek(
      pickNumber(source, [
        'weekTo',
        'week_to',
        'toWeek',
        'to_week',
        'endWeek',
        'end_week',
      ]),
    ),
    weeksCovered: pickString(source, [
      'weeksCovered',
      'weeks_covered',
      'coverage',
      'weeks',
    ]),
    notes:
      pickString(source, ['notes', 'description', 'details', 'summary']) ?? '',
    version: normalizeVersion(source.version ?? source.revision),
    status: normalizeSchemeBookStatus(
      source.status ??
        source.schemeBookStatus ??
        source.scheme_book_status ??
        source.state,
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
      pickString(source, ['department', 'section']) ??
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
    documentId,
    documentName,
    documentType:
      pickString(source, [
        'documentContentType',
        'document_content_type',
        'documentType',
        'document_type',
        'mimeType',
        'mime_type',
        'contentType',
        'content_type',
      ]) ??
      (document
        ? pickString(document, ['contentType', 'content_type', 'mimeType', 'mime_type'])
        : null),
    documentSize:
      pickNumber(source, ['documentSize', 'document_size', 'fileSize', 'file_size']) ??
      (document
        ? pickNumber(document, ['size', 'length', 'fileSize', 'file_size'])
        : null),
    createdAt: pickString(source, [
      'createdAt',
      'created_at',
      'submittedAt',
      'submitted_at',
    ]),
    updatedAt: pickString(source, ['updatedAt', 'updated_at']),
    reviewedAt: pickString(source, [
      'reviewedAt',
      'reviewed_at',
      'reviewDate',
      'review_date',
    ]),
  }
}

export function normalizeSchemeBookList(value: unknown): SchemeBook[] {
  const list = findArray(value)

  if (list.length > 0) {
    return list
      .map((item) => normalizeSchemeBook(item))
      .filter((item): item is SchemeBook => item !== null)
  }

  const single = normalizeSchemeBook(value)
  return single ? [single] : []
}

export function schemeBookStatusLabel(status: SchemeBookStatus): string {
  return SCHEME_BOOK_STATUS_LABELS[status]
}

export function formatWeeksCovered(book: SchemeBook): string {
  if (book.weekFrom !== null && book.weekTo !== null) {
    const weeks = Math.max(0, book.weekTo - book.weekFrom + 1)
    return `Weeks ${book.weekFrom}–${book.weekTo} (${weeks} week${
      weeks === 1 ? '' : 's'
    })`
  }

  if (book.weekFrom !== null) return `From week ${book.weekFrom}`
  if (book.weekTo !== null) return `Up to week ${book.weekTo}`
  if (book.weeksCovered) return book.weeksCovered

  return 'Not set'
}

export function formatFileSize(size: number | null): string {
  if (!size || size < 0) return ''

  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function schemeBookFileExtension(name?: string | null): string {
  if (!name) return ''
  const match = /\.([a-z0-9]+)$/i.exec(name.trim())
  return match ? match[1].toLowerCase() : ''
}

export type SchemeBookFileKind = 'image' | 'pdf' | 'word' | 'other'

export function schemeBookFileKind(
  name?: string | null,
  type?: string | null,
): SchemeBookFileKind {
  const extension = schemeBookFileExtension(name)
  const mime = (type ?? '').trim().toLowerCase()

  if (['jpg', 'jpeg', 'png'].includes(extension) || mime.startsWith('image/')) {
    return 'image'
  }
  if (extension === 'pdf' || mime === 'application/pdf') return 'pdf'
  if (['doc', 'docx'].includes(extension) || mime.includes('word')) {
    return 'word'
  }

  return 'other'
}

export function schemeBookMimeType(
  name?: string | null,
  type?: string | null,
): string {
  const mime = (type ?? '').trim().toLowerCase()
  if (mime && mime !== 'application/octet-stream') return mime

  switch (schemeBookFileExtension(name)) {
    case 'pdf':
      return 'application/pdf'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    default:
      return 'application/octet-stream'
  }
}

export function validateSchemeBookFile(file: File): string | null {
  if (file.size > SCHEME_BOOK_MAX_FILE_SIZE) {
    return 'The file must be 10 MB or smaller.'
  }

  const extension = schemeBookFileExtension(file.name)
  const mime = file.type.trim().toLowerCase()
  const allowed =
    ALLOWED_EXTENSIONS.has(extension) || ALLOWED_MIME_TYPES.has(mime)

  if (!allowed) {
    return 'Choose a PDF, DOC, DOCX, JPG or PNG file.'
  }

  return null
}
