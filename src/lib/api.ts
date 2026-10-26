import {
  normalizeRecord,
  normalizeRecords,
  normalizeSummary,
  type AttendanceRecord,
  type AttendanceSummary,
} from './attendance'
import { getToken, logout, setToken, setUser, type StoredUser } from './auth'
import {
  normalizeAnnouncement,
  normalizeAnnouncementList,
  type Announcement,
  type AnnouncementInput,
} from './announcements'
import {
  normalizeKra,
  normalizeKraList,
  type Kra,
  type KraInput,
} from './kras'
import {
  normalizeSchemeBook,
  normalizeSchemeBookList,
  type SchemeBook,
  type SchemeBookInput,
} from './schemeBooks'
import { normalizeStaffList, type StaffMember } from './staff'
import { normalizeEcNumber, normalizePhone, type SignupValues } from './validation'

const CONFIGURED_API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')
const API_URL = CONFIGURED_API_URL || 'http://localhost:5000'

export const isApiConfigured = CONFIGURED_API_URL.length > 0

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return undefined
}

function errorMessage(body: unknown): string | undefined {
  const record = asRecord(body)
  const nestedError = asRecord(record?.error)
  const firstError = Array.isArray(record?.errors) ? asRecord(record.errors[0]) : null

  return (
    asString(record?.message) ??
    asString(nestedError?.message) ??
    asString(record?.error) ??
    asString(firstError?.message)
  )
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options
  const headers = new Headers({ Accept: 'application/json' })
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
    )
  }

  if (response.status === 401 && auth) {
    logout()
    throw new ApiError('Your session has expired. Please log in again.', 401)
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new ApiError(
      errorMessage(errorBody) ?? `The request failed (${response.status}).`,
      response.status,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) return undefined as T

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

interface UploadOptions {
  method?: 'POST' | 'PATCH'
  onProgress?: (percent: number) => void
}

function upload<T>(
  path: string,
  body: FormData,
  options: UploadOptions = {},
): Promise<T> {
  const { method = 'POST', onProgress } = options

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, `${API_URL}${path}`)
    xhr.setRequestHeader('Accept', 'application/json')

    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      const percent = Math.round((event.loaded / event.total) * 100)
      onProgress(Math.min(100, Math.max(0, percent)))
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        logout()
        reject(
          new ApiError('Your session has expired. Please log in again.', 401),
        )
        return
      }

      const text = xhr.responseText
      let payload: unknown = undefined

      if (text) {
        try {
          payload = JSON.parse(text) as unknown
        } catch {
          payload = text
        }
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new ApiError(
            errorMessage(payload) ?? `The upload failed (${xhr.status}).`,
            xhr.status,
          ),
        )
        return
      }

      onProgress?.(100)

      if (xhr.status === 204 || !text) {
        resolve(undefined as T)
        return
      }

      resolve(payload as T)
    }

    xhr.onerror = () => {
      reject(
        new ApiError(
          'Could not reach the server. Check your connection and try again.',
        ),
      )
    }

    xhr.onabort = () => {
      reject(new ApiError('The upload was cancelled.'))
    }

    xhr.send(body)
  })
}

function authPayload(body: unknown): {
  root: Record<string, unknown>
  data: Record<string, unknown>
} {
  const root = asRecord(body) ?? {}
  const data = asRecord(root.data) ?? root
  return { root, data }
}

function extractToken(body: unknown): string | null {
  const { root, data } = authPayload(body)

  return (
    asString(data.token) ??
    asString(data.accessToken) ??
    asString(data.access_token) ??
    asString(data.authToken) ??
    asString(data.jwt) ??
    asString(root.token) ??
    null
  )
}

function extractUser(body: unknown): StoredUser | null {
  const { root, data } = authPayload(body)
  const candidate =
    asRecord(data.user) ??
    asRecord(data.teacher) ??
    asRecord(data.profile) ??
    asRecord(root.user) ??
    asRecord(root.teacher) ??
    data

  if (!candidate || Object.keys(candidate).length === 0) return null

  return {
    id: asString(candidate.id) ?? asString(candidate.sub),
    firstName:
      asString(candidate.firstName) ?? asString(candidate.first_name),
    surname:
      asString(candidate.surname) ??
      asString(candidate.lastName) ??
      asString(candidate.last_name),
    name: asString(candidate.name),
    fullName: asString(candidate.fullName) ?? asString(candidate.full_name),
    ecNumber: asString(candidate.ecNumber) ?? asString(candidate.ec_number),
    email: asString(candidate.email),
    phone:
      asString(candidate.phone) ??
      asString(candidate.phoneNumber) ??
      asString(candidate.phone_number),
    department: asString(candidate.department),
    role: asString(candidate.role),
    userRole: asString(candidate.userRole) ?? asString(candidate.user_role),
    position: asString(candidate.position),
    title: asString(candidate.title),
    isAdmin: asBoolean(candidate.isAdmin) ?? asBoolean(candidate.is_admin),
    approved:
      asBoolean(candidate.approved) ??
      asBoolean(candidate.isApproved) ??
      asBoolean(candidate.is_approved),
  }
}

export interface LoginCredentials {
  ecNumber: string
  password: string
}

export interface LoginResult {
  token: string
  user: StoredUser | null
}

export interface ProfileUpdates {
  email: string
  phone: string
}

export async function updateMyProfile(
  updates: ProfileUpdates,
): Promise<StoredUser> {
  const payload = await request<unknown>('/api/auth/me', {
    method: 'PATCH',
    body: updates,
  })
  const record = asRecord(payload)
  const user = extractUser(record?.user)

  if (!user) throw new ApiError('The server returned an invalid profile.')
  setUser(user)
  return user
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const payload = await request<unknown>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: {
      ecNumber: credentials.ecNumber.trim(),
      password: credentials.password,
    },
  })

  const token = extractToken(payload)
  if (!token) {
    throw new ApiError('The server did not return a login token.')
  }

  const user = extractUser(payload)
  setToken(token)
  setUser(user)

  return { token, user }
}

export interface SignupPayload {
  firstName: string
  surname: string
  ecNumber: string
  phone: string
  department?: string
  password: string
}

export interface SignupResult {
  message?: string
  mocked?: boolean
  token?: string
  user?: StoredUser | null
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function toPayload(values: SignupValues): SignupPayload {
  const department = values.department?.trim()

  return {
    firstName: values.firstName.trim(),
    surname: values.surname.trim(),
    ecNumber: normalizeEcNumber(values.ecNumber),
    phone: normalizePhone(values.phone),
    department: department ? department : undefined,
    password: values.password,
  }
}

export async function signup(values: SignupValues): Promise<SignupResult> {
  const payload = toPayload(values)

  if (import.meta.env.MODE === 'test') {
    await delay(900)
    return { mocked: true }
  }

  let response: Response

  try {
    response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
    )
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    throw new ApiError(
      errorMessage(body) ??
        'We could not create your account. Please try again.',
      response.status,
    )
  }

  const body: unknown = await response.json().catch(() => ({}))
  const record = asRecord(body)
  const token = extractToken(body)
  const user = token ? extractUser(body) : null

  if (token) {
    setToken(token)
    setUser(user)
  }

  return {
    message: asString(record?.message),
    token: token ?? undefined,
    user,
  }
}

export async function fetchTodayAttendance(): Promise<AttendanceRecord | null> {
  try {
    const payload = await request<unknown>('/api/attendance/today')
    return normalizeRecord(payload)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function checkIn(): Promise<AttendanceRecord | null> {
  const payload = await request<unknown>('/api/attendance/check-in', {
    method: 'POST',
  })
  return normalizeRecord(payload)
}

export async function checkOut(): Promise<AttendanceRecord | null> {
  const payload = await request<unknown>('/api/attendance/check-out', {
    method: 'PATCH',
  })
  return normalizeRecord(payload)
}

export async function markAttendance(
  status: string,
  note?: string,
): Promise<AttendanceRecord | null> {
  const trimmedNote = note?.trim()

  const payload = await request<unknown>('/api/attendance/mark', {
    method: 'POST',
    body: {
      status,
      ...(trimmedNote ? { note: trimmedNote } : {}),
    },
  })
  return normalizeRecord(payload)
}

export async function fetchAttendanceSummary(): Promise<AttendanceSummary> {
  const payload = await request<unknown>('/api/attendance/summary')
  return normalizeSummary(payload)
}

export async function fetchMyAttendance(): Promise<AttendanceRecord[]> {
  const payload = await request<unknown>('/api/attendance/me')
  return normalizeRecords(payload)
}

export async function fetchStaffDirectory(): Promise<StaffMember[]> {
  try {
    const payload = await request<unknown>('/api/staff')
    return normalizeStaffList(payload)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(
        'The staff directory is not available yet. The backend needs a GET /api/staff endpoint.',
        404,
      )
    }
    throw error
  }
}

function kraPath(id: string | number, suffix = ''): string {
  return `/api/kras/${encodeURIComponent(String(id))}${suffix}`
}

export async function fetchKras(): Promise<Kra[]> {
  const payload = await request<unknown>('/api/kras')
  return normalizeKraList(payload)
}

export async function fetchReviewKras(): Promise<Kra[]> {
  const payload = await request<unknown>('/api/kras/review')
  return normalizeKraList(payload)
}

export async function createKra(
  input: KraInput,
  submit: boolean,
  file?: File | null,
): Promise<Kra | null> {
  const body = new FormData()
  Object.entries(input).forEach(([key, value]) => body.append(key, value))
  body.append('status', submit ? 'pending' : 'draft')
  if (file) body.append('document', file)

  const payload = await request<unknown>('/api/kras', {
    method: 'POST',
    body,
  })

  return normalizeKra(payload)
}

export async function updateKra(
  id: string | number,
  input: KraInput,
  submit: boolean,
  file?: File | null,
): Promise<Kra | null> {
  const body = new FormData()
  Object.entries(input).forEach(([key, value]) => body.append(key, value))
  body.append('status', submit ? 'pending' : 'draft')
  if (file) body.append('document', file)

  const payload = await request<unknown>(kraPath(id), {
    method: 'PATCH',
    body,
  })

  return normalizeKra(payload)
}

export async function fetchKraDocument(
  id: string | number,
): Promise<{ blob: Blob; filename: string }> {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${kraPath(id, '/document')}`, { headers })
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
    )
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new ApiError(
      errorMessage(errorBody) ?? `The request failed (${response.status}).`,
      response.status,
    )
  }

  const disposition = response.headers.get('Content-Disposition') ?? ''
  const filename =
    disposition.match(/filename="([^"]+)"/i)?.[1] ?? 'kra-document'
  return { blob: await response.blob(), filename }
}

export async function getKraDocumentUrl(
  id: string | number,
): Promise<string> {
  const payload = await request<unknown>(kraPath(id, '/document-link'))
  const url = asString(asRecord(payload)?.url)
  if (!url) throw new ApiError('The server did not return a document link.')
  return new URL(url, API_URL).toString()
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const payload = await request<unknown>('/api/announcements')
  return normalizeAnnouncementList(payload)
}

export async function createAnnouncement(
  input: AnnouncementInput,
): Promise<Announcement> {
  const payload = await request<unknown>('/api/announcements', {
    method: 'POST',
    body: input,
  })
  const announcement = normalizeAnnouncement(asRecord(payload)?.announcement)
  if (!announcement) {
    throw new ApiError('The server returned an invalid school update.')
  }
  return announcement
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput,
): Promise<Announcement> {
  const payload = await request<unknown>(
    `/api/announcements/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: input,
    },
  )
  const announcement = normalizeAnnouncement(asRecord(payload)?.announcement)
  if (!announcement) {
    throw new ApiError('The server returned an invalid school update.')
  }
  return announcement
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await request<void>(`/api/announcements/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function deleteKra(id: string | number): Promise<void> {
  await request<void>(kraPath(id), { method: 'DELETE' })
}

export async function updateKraProgress(
  id: string | number,
  progress: number,
): Promise<Kra | null> {
  const payload = await request<unknown>(kraPath(id, '/progress'), {
    method: 'PATCH',
    body: { progress },
  })

  return normalizeKra(payload)
}

export async function approveKra(id: string | number): Promise<Kra | null> {
  const payload = await request<unknown>(kraPath(id, '/approve'), {
    method: 'PATCH',
  })

  return normalizeKra(payload)
}

export async function rejectKra(
  id: string | number,
  comment: string,
): Promise<Kra | null> {
  const payload = await request<unknown>(kraPath(id, '/reject'), {
    method: 'PATCH',
    body: { comment },
  })

  return normalizeKra(payload)
}

function schemeBookPath(id: string | number, suffix = ''): string {
  return `/api/scheme-books/${encodeURIComponent(String(id))}${suffix}`
}

function appendSchemeBookInput(body: FormData, input: SchemeBookInput): void {
  body.append('title', input.title)
  body.append('subject', input.subject)
  body.append('grade', input.grade)
  body.append('term', input.term)
  body.append('year', input.year)
  body.append('weekFrom', input.weekFrom)
  body.append('weekTo', input.weekTo)
  body.append('notes', input.notes)
}

export async function fetchSchemeBooks(): Promise<SchemeBook[]> {
  const payload = await request<unknown>('/api/scheme-books')
  return normalizeSchemeBookList(payload)
}

export async function fetchReviewSchemeBooks(): Promise<SchemeBook[]> {
  const payload = await request<unknown>('/api/scheme-books/review')
  return normalizeSchemeBookList(payload)
}

export async function createSchemeBook(
  input: SchemeBookInput,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<SchemeBook | null> {
  const body = new FormData()
  appendSchemeBookInput(body, input)
  body.append('status', 'pending')
  body.append('document', file)

  const payload = await upload<unknown>('/api/scheme-books', body, {
    method: 'POST',
    onProgress,
  })

  return normalizeSchemeBook(payload)
}

export async function resubmitSchemeBook(
  id: string | number,
  input: SchemeBookInput,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<SchemeBook | null> {
  const body = new FormData()
  appendSchemeBookInput(body, input)
  body.append('status', 'pending')
  body.append('document', file)

  const payload = await upload<unknown>(schemeBookPath(id), body, {
    method: 'PATCH',
    onProgress,
  })

  return normalizeSchemeBook(payload)
}

export async function deleteSchemeBook(id: string | number): Promise<void> {
  await request<void>(schemeBookPath(id), { method: 'DELETE' })
}

export async function fetchSchemeBookDocument(
  id: string | number,
): Promise<{ blob: Blob; filename: string; contentType: string | null }> {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${schemeBookPath(id, '/document')}`, {
      headers,
    })
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
    )
  }

  if (response.status === 401) {
    logout()
    throw new ApiError('Your session has expired. Please log in again.', 401)
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new ApiError(
      errorMessage(errorBody) ?? `The request failed (${response.status}).`,
      response.status,
    )
  }

  const disposition = response.headers.get('Content-Disposition') ?? ''
  const filename =
    disposition.match(/filename="([^"]+)"/i)?.[1] ?? 'scheme-book-file'

  return {
    blob: await response.blob(),
    filename,
    contentType: response.headers.get('Content-Type'),
  }
}

export async function getSchemeBookDocumentUrl(
  id: string | number,
): Promise<string> {
  const payload = await request<unknown>(schemeBookPath(id, '/document-link'))
  const url = asString(asRecord(payload)?.url)
  if (!url) throw new ApiError('The server did not return a file link.')
  return new URL(url, API_URL).toString()
}

export async function approveSchemeBook(
  id: string | number,
): Promise<SchemeBook | null> {
  const payload = await request<unknown>(schemeBookPath(id, '/approve'), {
    method: 'PATCH',
  })

  return normalizeSchemeBook(payload)
}

export async function rejectSchemeBook(
  id: string | number,
  comment: string,
): Promise<SchemeBook | null> {
  const payload = await request<unknown>(schemeBookPath(id, '/reject'), {
    method: 'PATCH',
    body: { comment },
  })

  return normalizeSchemeBook(payload)
}
