import { useEffect } from 'react'
import { AlertIcon, CheckIcon, CloseIcon } from '../icons'

export type ToastTone = 'success' | 'error'

interface ToastProps {
  message: string
  tone?: ToastTone
  onClose: () => void
}

export function Toast({ message, tone = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  const isError = tone === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`fixed inset-x-3 bottom-20 z-[70] mx-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl motion-safe:animate-fade-in sm:inset-x-auto sm:bottom-5 sm:right-5 sm:mx-0 ${
        isError
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isError ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        {isError ? (
          <AlertIcon className="h-4 w-4" />
        ) : (
          <CheckIcon className="h-4 w-4" />
        )}
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed">
        {message}
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-black/5"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
