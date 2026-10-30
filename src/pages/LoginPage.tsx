import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Crest } from '../components/Crest'
import {
  AlertIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  SpinnerIcon,
} from '../components/icons'
import { ApiError, login } from '../lib/api'
import { getToken } from '../lib/auth'
import { getHomePath } from '../lib/roles'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const [ecNumber, setEcNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const homePath = getHomePath()
  const destination = (location.state as LocationState | null)?.from ?? homePath

  if (getToken()) {
    return <Navigate to={destination} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!ecNumber.trim() || !password) {
      setError('Enter your EC number and password.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await login({ ecNumber, password })
      navigate(destination === '/login' ? homePath : destination, { replace: true })
    } catch (loginError) {
      console.error('[login] Sign-in failed', loginError)

      if (loginError instanceof ApiError && loginError.status === 401) {
        setError('Wrong EC number or password')
      } else {
        setError(
          loginError instanceof Error
            ? loginError.message
            : 'We could not sign you in. Please try again.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Crest />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Chamabondo Primary School
            </p>
            <p className="truncate text-lg font-bold leading-tight text-slate-900 sm:text-xl">
              Chamabondo Teacher Portal
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <section className="hidden lg:block">
            <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Welcome back
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900">
              Your school day, organised in one place.
            </h1>
            <p className="mt-4 max-w-md text-base text-slate-600">
              Check in and out, mark leave, review your attendance and keep up
              with KRAs, scheme books and the school calendar.
            </p>

            <ul className="mt-8 space-y-3">
              {['Quick daily check-in', 'Clear monthly attendance', 'Works on your phone'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-primary">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </li>
                ),
              )}
            </ul>

            <div className="mt-10 h-px w-40 bg-gold/40" />
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Log in
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Use the details you registered with.
              </p>

              <div className="my-6 h-px w-full bg-gold/30" />

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="ecNumber" className="label">
                    EC number
                  </label>
                  <input
                    id="ecNumber"
                    name="ecNumber"
                    type="text"
                    value={ecNumber}
                    onChange={(event) => setEcNumber(event.target.value)}
                    autoComplete="username"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="e.g. EC12345"
                    disabled={submitting}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      disabled={submitting}
                      className="input pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-0 top-0 inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl text-slate-500 transition hover:text-primary"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
                  >
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </p>
                ) : null}

                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? (
                    <>
                      <SpinnerIcon className="h-5 w-5 animate-spin" />
                      Logging in…
                    </>
                  ) : (
                    'Log in'
                  )}
                </button>
              </form>

              <div className="my-6 h-px w-full bg-slate-100" />

              <p className="text-center text-sm text-slate-600">
                Need an account?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-primary underline-offset-4 hover:underline hover:decoration-gold hover:decoration-2"
                >
                  Create one
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            Chamabondo Teacher Portal · For staff of Chamabondo Primary School
          </p>
        </div>
      </footer>
    </div>
  )
}
