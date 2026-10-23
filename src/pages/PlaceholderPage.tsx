import type { ComponentType, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '../components/icons'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary-50 text-primary">
          <Icon className="h-8 w-8" />
        </span>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          {description}
        </p>

        <span className="mt-5 inline-flex rounded-full bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-700">
          Coming soon
        </span>

        <div className="mt-8 border-t border-slate-100 pt-5">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-sm font-semibold text-primary transition hover:bg-primary-50"
          >
            Back to dashboard
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
