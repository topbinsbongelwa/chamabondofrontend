export interface StoredUser {
  id?: string | number
  firstName?: string
  surname?: string
  name?: string
  fullName?: string
  ecNumber?: string
  email?: string
  phone?: string
  department?: string
  role?: string
  userRole?: string
  position?: string
  title?: string
  isAdmin?: boolean
  approved?: boolean
}

const TOKEN_KEYS = ['chamabondo_token', 'token', 'accessToken', 'access_token', 'jwt']
const USER_KEYS = ['chamabondo_user', 'user', 'teacher', 'currentUser']

function getStorage(kind: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function readFromStorages(keys: string[]): string | null {
  for (const storage of [getStorage('local'), getStorage('session')]) {
    if (!storage) continue

    for (const key of keys) {
      const value = storage.getItem(key)
      if (value && value.trim()) return value
    }
  }

  return null
}

export function getToken(): string | null {
  return readFromStorages(TOKEN_KEYS)
}

export function setToken(token: string): void {
  getStorage('local')?.setItem('chamabondo_token', token)
}

export function setUser(user: StoredUser | null): void {
  const storage = getStorage('local')
  if (!storage) return

  if (!user) {
    storage.removeItem('chamabondo_user')
    return
  }

  storage.setItem('chamabondo_user', JSON.stringify(user))
}

export function getStoredUser(): StoredUser | null {
  const raw = readFromStorages(USER_KEYS)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return parsed as StoredUser
  } catch {
    return null
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return undefined
}

function decodeJwt(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1]
  if (!part) return null

  const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')

  try {
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    return asRecord(JSON.parse(json))
  } catch {
    return null
  }
}

function getUserFromToken(): StoredUser | null {
  const token = getToken()
  if (!token) return null

  const payload = decodeJwt(token)
  if (!payload) return null

  const nested = asRecord(payload.user)
  const source = nested ?? payload

  return {
    id: asString(source.id) ?? asString(source.sub),
    firstName: asString(source.firstName) ?? asString(source.first_name),
    surname:
      asString(source.surname) ??
      asString(source.lastName) ??
      asString(source.last_name),
    name: asString(source.name),
    fullName: asString(source.fullName) ?? asString(source.full_name),
    ecNumber: asString(source.ecNumber) ?? asString(source.ec_number),
    email: asString(source.email),
    phone:
      asString(source.phone) ??
      asString(source.phoneNumber) ??
      asString(source.phone_number),
    department: asString(source.department),
    role: asString(source.role),
    userRole: asString(source.userRole) ?? asString(source.user_role),
    position: asString(source.position),
    title: asString(source.title),
    isAdmin: asBoolean(source.isAdmin) ?? asBoolean(source.is_admin),
    approved:
      asBoolean(source.approved) ??
      asBoolean(source.isApproved) ??
      asBoolean(source.is_approved),
  }
}

export function getCurrentUser(): StoredUser | null {
  const stored = getStoredUser()
  const fromToken = getUserFromToken()

  if (!stored) return fromToken
  if (!fromToken) return stored

  return { ...fromToken, ...stored }
}

export function getDisplayName(): string {
  const user = getCurrentUser()
  if (!user) return 'Teacher'

  const fullName = [user.firstName, user.surname].filter(Boolean).join(' ')
  if (fullName) return fullName

  if (user.name) return user.name
  if (user.fullName) return user.fullName
  if (user.email) return user.email.split('@')[0]
  if (user.ecNumber) return user.ecNumber

  return 'Teacher'
}

export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return initials || 'T'
}

export function clearAuth(): void {
  for (const storage of [getStorage('local'), getStorage('session')]) {
    if (!storage) continue

    for (const key of [...TOKEN_KEYS, ...USER_KEYS]) {
      storage.removeItem(key)
    }
  }
}

export function logout(): void {
  clearAuth()

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}
