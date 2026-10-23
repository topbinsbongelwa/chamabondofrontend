import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { CloseIcon, RefreshIcon } from '../icons'

export function UpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

  useRegisterSW({
    onNeedReload() {
      setUpdateReady(true)
    },
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? null
    },
  })

  useEffect(() => {
    const checkForUpdate = () => {
      if (document.visibilityState !== 'visible') return
      void registrationRef.current?.update()
    }

    const interval = window.setInterval(checkForUpdate, 60 * 60 * 1000)
    document.addEventListener('visibilitychange', checkForUpdate)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', checkForUpdate)
    }
  }, [])

  if (!updateReady) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 top-20 z-[60] mx-auto flex max-w-sm items-start gap-3 rounded-2xl border border-gold/30 bg-white p-3.5 shadow-xl motion-safe:animate-fade-in sm:inset-x-auto sm:right-6 sm:mx-0"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-700">
        <RefreshIcon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">New version available</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Refresh to load the latest Chamabondo updates.
        </p>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-600"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setUpdateReady(false)}
            className="inline-flex min-h-[36px] items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Later
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setUpdateReady(false)}
        aria-label="Dismiss update notice"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
