import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { WifiOffIcon } from '../icons'

export function OfflineBanner() {
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-lg motion-safe:animate-fade-in sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <WifiOffIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">You&rsquo;re offline</p>
        <p className="text-xs text-amber-800">
          Showing saved content. New changes need a connection.
        </p>
      </div>
    </div>
  )
}
