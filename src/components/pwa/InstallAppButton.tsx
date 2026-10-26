import { useEffect, useState, useSyncExternalStore } from 'react'
import { CloseIcon, DownloadIcon, ShareIcon } from '../icons'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface InstallState {
  event: BeforeInstallPromptEvent | null
  installed: boolean
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return true

  return navigator.maxTouchPoints > 1 && /macintosh/i.test(ua)
}

const listeners = new Set<() => void>()
let state: InstallState = {
  event: null,
  installed: isStandalone(),
}

function updateState(next: InstallState) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): InstallState {
  return state
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    updateState({
      ...state,
      event: event as BeforeInstallPromptEvent,
    })
  })

  window.addEventListener('appinstalled', () => {
    updateState({ event: null, installed: true })
  })
}

export function InstallAppButton() {
  const installState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [hintOpen, setHintOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [installError, setInstallError] = useState(false)

  const iosInstallable = !installState.installed && isIosDevice()
  const canInstall =
    !installState.installed && (installState.event !== null || iosInstallable)

  useEffect(() => {
    if (!hintOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHintOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hintOpen])

  if (!canInstall || dismissed) return null

  const handleClick = async () => {
    if (!installState.event) {
      setHintOpen((open) => !open)
      return
    }

    const promptEvent = installState.event
    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice

      updateState({
        event: null,
        installed: installState.installed || choice.outcome === 'accepted',
      })
      setHintOpen(false)
      setInstallError(false)
    } catch {
      updateState({ ...state, event: null })
      setInstallError(true)
    }
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-md rounded-2xl border border-gold/30 bg-white p-4 shadow-2xl motion-safe:animate-fade-in sm:inset-x-auto sm:bottom-5 sm:right-5 sm:mx-0 sm:w-96">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-700">
          {iosInstallable ? (
            <ShareIcon className="h-5 w-5" />
          ) : (
            <DownloadIcon className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">Install Chamabondo</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
            {iosInstallable
              ? 'Add the app to your Home Screen for quick access.'
              : 'Add the app to your device for quick, full-screen access.'}
          </p>

          {installError ? (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              The install prompt could not be opened. Try again from your browser menu.
            </p>
          ) : null}

          {hintOpen ? (
            <p role="status" className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-slate-600">
              <ShareIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Tap Share, then Add to Home Screen.
            </p>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleClick}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-semibold text-white transition hover:bg-primary-600"
              aria-expanded={iosInstallable ? hintOpen : undefined}
            >
              {iosInstallable ? <ShareIcon className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
              {iosInstallable ? 'How to install' : 'Install app'}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              Not now
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss install prompt"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
