import {
  CalendarIcon,
  ChartBarIcon,
  NotebookIcon,
  SendIcon,
  SparklesIcon,
  TargetIcon,
} from '../components/icons'

const CAPABILITIES = [
  {
    title: 'KRA guidance',
    description:
      'Get help shaping objectives and turning your work into clear evidence.',
    icon: TargetIcon,
  },
  {
    title: 'Reports & summaries',
    description:
      'Draft short reports and summaries from the records you already keep.',
    icon: ChartBarIcon,
  },
  {
    title: 'Planning support',
    description:
      'Find quick answers about school activities, deadlines and next steps.',
    icon: CalendarIcon,
  },
] as const

export function AiAssistantPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 sm:space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Staff support
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold-700">
            <SparklesIcon className="h-5 w-5" />
          </span>
          AI Assistant
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          A future school assistant for KRAs, reports and quick answers.
        </p>
      </div>

      <section
        aria-labelledby="assistant-preview-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-5 text-white sm:p-7">
          <div
            className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-gold/20 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/20">
                <SparklesIcon className="h-6 w-6" />
              </span>
              <div>
                <h2
                  id="assistant-preview-heading"
                  className="text-lg font-bold tracking-tight sm:text-xl"
                >
                  Your school assistant
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-primary-50">
                  Your assistant for KRAs, reports and quick answers. It will
                  use the information you already manage in Chamabondo.
                </p>
              </div>
            </div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              Coming soon
            </span>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-700">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <div className="rounded-2xl rounded-tl-md border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-sm leading-relaxed text-slate-700">
                Hello. This space is being prepared for a future assistant that
                can help with school tasks. Messaging is not available yet.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Planned capabilities
            </h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {CAPABILITIES.map(({ title, description, icon: Icon }) => (
                <li
                  key={title}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-inset ring-slate-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-sm font-bold text-slate-800">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={(event) => event.preventDefault()}
            className="border-t border-slate-100 pt-4"
          >
            <label htmlFor="assistant-message" className="sr-only">
              Ask the assistant
            </label>
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  id="assistant-message"
                  type="text"
                  disabled
                  placeholder="Ask about KRAs, reports or school tasks..."
                  aria-describedby="assistant-availability"
                  className="input pr-12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                  Soon
                </span>
              </div>
              <button
                type="button"
                disabled
                aria-label="Send message - not available yet"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </div>
            <p id="assistant-availability" className="hint">
              The assistant is not connected yet. Messages cannot be sent.
            </p>
          </form>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900">
            <NotebookIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              For now, use the Calendar, KRAs and Scheme Books sections to manage
              your school work.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
