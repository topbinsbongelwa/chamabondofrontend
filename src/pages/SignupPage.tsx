import { Navigate, useNavigate } from 'react-router-dom'
import { Crest } from '../components/Crest'
import { SignupForm } from '../components/SignupForm'
import { BookIcon, CalendarIcon, WifiOffIcon } from '../components/icons'
import { getToken } from '../lib/auth'
import { getHomePath } from '../lib/roles'

const FEATURES = [
  {
    icon: WifiOffIcon,
    title: 'Offline check-in',
    text: 'Check in even when the network is down. It syncs when you are back online.',
  },
  {
    icon: BookIcon,
    title: 'KRAs and scheme books',
    text: 'Submit your key result areas and scheme books straight from your phone.',
  },
  {
    icon: CalendarIcon,
    title: 'School calendar',
    text: 'Meetings, deadlines and school activities in one simple calendar.',
  },
]

export function SignupPage() {
  const navigate = useNavigate()

  if (getToken()) {
    return <Navigate to={getHomePath()} replace />
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
            <h1 className="truncate text-lg font-bold leading-tight text-slate-900 sm:text-xl">
              Chamabondo Teacher Portal
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Hero - shown first on mobile under the form */}
          <section className="order-2 lg:order-1">
            <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Staff portal
            </span>

            <p className="mt-4 text-2xl font-semibold leading-snug text-slate-900 sm:text-3xl">
              Check in, submit KRAs and scheme books, and stay on top of school
              activities, all in one place.
            </p>

            <p className="mt-4 max-w-md text-base text-slate-600">
              Built for teachers at Chamabondo Primary School. Create your account
              once and the headmaster will approve it for you.
            </p>

            <ul className="mt-8 space-y-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary shadow-sm">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 hidden h-px w-40 bg-gold/40 lg:block" />
          </section>

          {/* Signup card - first thing you see on mobile */}
          <section className="order-1 lg:order-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Create your account
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                It only takes a minute. All fields marked with{' '}
                <span className="text-red-600">*</span> are required.
              </p>

              <div className="my-6 h-px w-full bg-gold/30" />

              <SignupForm
                onSuccess={() => navigate(getHomePath(), { replace: true })}
              />

              <div className="my-6 h-px w-full bg-slate-100" />

              <p className="text-center text-sm text-slate-600">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="font-semibold text-primary underline-offset-4 hover:underline hover:decoration-gold hover:decoration-2"
                >
                  Log in
                </a>
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
