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

function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  return /^((?!chrome|android|crios|fxios|edgios|opios).)*safari/i.test(ua)
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

  const iosInstallable =
    !installState.installed && isIosDevice() && isSafari()
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

  if (!canInstall) return null

  const handleClick = async () => {
    if (!installState.event) {
      setHintOpen((open) => !open)
      return
    }

    const promptEvent = installState.event
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice

    updateState({
      event: null,
      installed: installState.installed || choice.outcome === 'accepted',
    })
    setHintOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-2.5 text-sm font-semibold text-gold-700 transition hover:border-gold/60 hover:bg-gold/15"
        aria-expanded={iosInstallable ? hintOpen : undefined}
      >
        {iosInstallable ? (
          <ShareIcon className="h-5 w-5" />
        ) : (
          <DownloadIcon className="h-5 w-5" />
        )}
        <span className="hidden md:inline">Install app</span>
        <span className="sr-only md:hidden">Install app</span>
      </button>

      {hintOpen ? (
        <div
          role="status"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xl motion-safe:animate-fade-in"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-slate-900">Install on iPhone</p>
            <button
              type="button"
              onClick={() => setHintOpen(false)}
              aria-label="Close install hint"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-slate-600">
            <ShareIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Tap Share, then Add to Home Screen.
          </p>
        </div>
      ) : null}
    </div>
  )
}
