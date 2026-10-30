const configuredApiUrl = (import.meta.env.VITE_API_URL ?? '').trim()
const isLocalApiUrl = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(
  configuredApiUrl,
)
const productionFallback = import.meta.env.PROD
  ? 'https://chamabondobackend.vercel.app'
  : ''
const usableApiUrl =
  configuredApiUrl && !(import.meta.env.PROD && isLocalApiUrl)
    ? configuredApiUrl
    : ''
const resolvedApiUrl = usableApiUrl || productionFallback

export const API_URL = resolvedApiUrl.replace(/\/+$/, '')

export const isApiConfigured = API_URL.length > 0

export const API_CONFIG_ERROR = 'API address is not configured'

if (!isApiConfigured && import.meta.env.PROD) {
  console.error(
    '[config] VITE_API_URL is missing. Set it in the Vercel frontend project environment variables and redeploy without the build cache.',
  )
}

function normalisePath(path: string): string {
  const rawPath = String(path ?? '').trim()

  if (/^https?:\/\//i.test(rawPath)) return rawPath

  let cleanPath = rawPath || '/'

  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`

  cleanPath = cleanPath.replace(/\/{2,}/g, '/')

  if (/\/api$/i.test(API_URL) && /^\/api(\/|$)/i.test(cleanPath)) {
    cleanPath = cleanPath.slice(4) || '/'
  }

  return cleanPath
}

export function buildApiUrl(path: string): string {
  const rawPath = String(path ?? '').trim()

  if (/^https?:\/\//i.test(rawPath)) return rawPath

  const cleanPath = normalisePath(rawPath)

  if (!API_URL) return cleanPath

  return `${API_URL}${cleanPath}`
}

export function getApiOrigin(): string | null {
  if (!API_URL) return null

  try {
    return new URL(API_URL).origin
  } catch {
    return null
  }
}
