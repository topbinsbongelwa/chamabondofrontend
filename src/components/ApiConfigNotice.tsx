import { API_CONFIG_ERROR, isApiConfigured } from '../lib/config'
import { AlertIcon } from './icons'

export function ApiConfigNotice() {
  if (isApiConfigured || !import.meta.env.PROD) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-3 top-3 z-[70] mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-lg"
    >
      <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-bold">{API_CONFIG_ERROR}</p>
        <p className="mt-0.5 text-xs">
          Set VITE_API_URL in the Vercel frontend project and redeploy without
          the build cache.
        </p>
      </div>
    </div>
  )
}
