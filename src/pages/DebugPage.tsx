import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_CONFIG_ERROR, API_URL, buildApiUrl, isApiConfigured } from '../lib/config'

interface HealthResult {
  status: number | null
  statusText: string
  body: string
  error: string
  durationMs: number
}

const initialResult: HealthResult = {
  status: null,
  statusText: '',
  body: '',
  error: '',
  durationMs: 0,
}

export function DebugPage() {
  const healthUrl = buildApiUrl('/api/health')
  const [result, setResult] = useState<HealthResult>(initialResult)
  const [loading, setLoading] = useState(false)

  const checkHealth = useCallback(async () => {
    if (!isApiConfigured) {
      console.error('[debug] API address is not configured')
      setResult({ ...initialResult, error: API_CONFIG_ERROR })
      return
    }

    setLoading(true)
    const startedAt = performance.now()

    try {
      console.log('[debug] API URL', API_URL)
      console.log('[debug] Health URL', healthUrl)

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      const body = await response.text()

      console.log('[debug] Health response', {
        status: response.status,
        statusText: response.statusText,
        url: healthUrl,
        body,
      })

      setResult({
        status: response.status,
        statusText: response.statusText,
        body,
        error: '',
        durationMs: Math.round(performance.now() - startedAt),
      })
    } catch (error) {
      console.error('[debug] Health request failed', { url: healthUrl, error })
      setResult({
        ...initialResult,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        durationMs: Math.round(performance.now() - startedAt),
      })
    } finally {
      setLoading(false)
    }
  }, [healthUrl])

  useEffect(() => {
    void checkHealth()
  }, [checkHealth])

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Connection diagnostics
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Debug</h1>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-slate-500">API URL</dt>
            <dd className="mt-1 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-slate-900">
              {API_URL || '(not configured)'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Health URL</dt>
            <dd className="mt-1 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-slate-900">
              {healthUrl}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Result</dt>
            <dd
              className={`mt-1 rounded-lg px-3 py-2 font-mono ${
                result.error || (result.status !== null && result.status >= 400)
                  ? 'bg-red-50 text-red-800'
                  : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {loading
                ? 'Checking…'
                : result.error
                  ? result.error
                  : `HTTP ${result.status} ${result.statusText} (${result.durationMs} ms)`}
            </dd>
          </div>
          {result.body ? (
            <div>
              <dt className="font-semibold text-slate-500">Response body</dt>
              <dd className="mt-1 whitespace-pre-wrap break-all rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
                {result.body}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void checkHealth()}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Checking…' : 'Check again'}
          </button>
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">
            Back to app
          </Link>
        </div>
      </div>
    </main>
  )
}
