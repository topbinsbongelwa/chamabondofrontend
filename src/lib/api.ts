import {
  normalizeRecord,
  normalizeRecords,
  normalizeSummary,
  type AttendanceRecord,
  type AttendanceSummary,
} from './attendance'
import { getToken, logout, setToken, setUser, type StoredUser } from './auth'
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

  if (body !== undefined) {
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
      body: body === undefined ? undefined : JSON.stringify(body),
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
    asString(data.jwt) ??
    asString(root.token) ??
    null
  )
}

function extractUser(body: unknown): StoredUser | null {
  const { root, data } = authPayload(body)
  const candidate = asRecord(data.user) ?? asRecord(root.user) ?? data

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
    department: asString(candidate.department),
    role: asString(candidate.role),
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

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const payload = await request<unknown>('/auth/login', {
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

  if (!isApiConfigured) {
    await delay(900)
    return { mocked: true }
  }

  let response: Response

  try {
    response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    await delay(900)
    return { mocked: true }
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

  return {
    message: asString(record?.message),
  }
}

export async function fetchTodayAttendance(): Promise<AttendanceRecord | null> {
  try {
    const payload = await request<unknown>('/attendance/today')
    return normalizeRecord(payload)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function checkIn(): Promise<AttendanceRecord | null> {
  const payload = await request<unknown>('/attendance/checkin', {
    method: 'POST',
  })
  return normalizeRecord(payload)
}

export async function checkOut(): Promise<AttendanceRecord | null> {
  const payload = await request<unknown>('/attendance/checkout', {
    method: 'POST',
  })
  return normalizeRecord(payload)
}

export async function markAttendance(
  status: string,
  note?: string,
): Promise<AttendanceRecord | null> {
  const trimmedNote = note?.trim()

  const payload = await request<unknown>('/attendance/mark', {
    method: 'POST',
    body: {
      status,
      ...(trimmedNote ? { note: trimmedNote } : {}),
    },
  })
  return normalizeRecord(payload)
}

export async function fetchAttendanceSummary(): Promise<AttendanceSummary> {
  const payload = await request<unknown>('/attendance/summary')
  return normalizeSummary(payload)
}

export async function fetchMyAttendance(): Promise<AttendanceRecord[]> {
  const payload = await request<unknown>('/attendance/me')
  return normalizeRecords(payload)
}
