import { normalizeEcNumber, normalizePhone, type SignupValues } from './validation'

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
  /** True when the request was faked because the backend is not reachable yet. */
  mocked?: boolean
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

export const isApiConfigured = API_URL.length > 0

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

/**
 * Creates a teacher account.
 * Posts to `${VITE_API_URL}/auth/signup`. While the backend is not ready
 * (no VITE_API_URL set, or the request cannot reach the server) the call is
 * mocked so the signup flow can still be tested end to end.
 */
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
    // Backend not reachable yet - fall back to the mocked response.
    await delay(900)
    return { mocked: true }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message =
      (body && typeof body.message === 'string' && body.message) ||
      'We could not create your account. Please try again.'
    throw new ApiError(message)
  }

  const body = await response.json().catch(() => ({}))
  return {
    message: typeof body?.message === 'string' ? body.message : undefined,
  }
}
