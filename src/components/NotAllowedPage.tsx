import { Link } from 'react-router-dom'
import { getHomePath } from '../lib/roles'

interface NotAllowedPageProps {
  description?: string
}

export function NotAllowedPage({
  description = 'Your account does not have permission to view this page.',
}: NotAllowedPageProps) {
  return (
    <main className="mx-auto flex min-h-[55vh] w-full max-w-xl flex-col items-center justify-center px-5 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl font-bold text-amber-700" aria-hidden="true">
        !
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Not allowed</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <Link to={getHomePath()} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
        Return to your dashboard
      </Link>
    </main>
  )
}
