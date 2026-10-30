import { SchoolUpdatesCard } from '../components/dashboard/SchoolUpdatesCard'

function getWhatsAppGroupUrl(): { url: string | null; invalid: boolean } {
  const configuredUrl = import.meta.env.VITE_WHATSAPP_GROUP_URL?.trim()
  if (!configuredUrl) return { url: null, invalid: false }

  try {
    const url = new URL(configuredUrl)
    if (url.protocol !== 'https:' || url.hostname !== 'chat.whatsapp.com') {
      return { url: null, invalid: true }
    }
    return { url: url.toString(), invalid: false }
  } catch {
    return { url: null, invalid: true }
  }
}

export function TeacherUpdatesPage() {
  const whatsapp = getWhatsAppGroupUrl()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Staff communications
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Updates
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          School news, upcoming activities, meetings, and notices for staff.
        </p>
      </div>

      <section
        aria-labelledby="whatsapp-group-heading"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5"
      >
        <div>
          <h2
            id="whatsapp-group-heading"
            className="text-base font-bold text-emerald-900"
          >
            Staff WhatsApp group
          </h2>
          <p className="mt-1 text-sm text-emerald-800">
            {whatsapp.url
              ? 'Join the group for staff communication and updates.'
              : whatsapp.invalid
                ? 'The WhatsApp invite link is not configured correctly.'
                : 'The group invite link will be added here when it is available.'}
          </p>
        </div>
        {whatsapp.url ? (
          <a
            href={whatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Open WhatsApp group
          </a>
        ) : (
          <span className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-300 bg-white/70 px-4 py-2.5 text-sm font-semibold text-emerald-800">
            Invite link pending
          </span>
        )}
      </section>

      <SchoolUpdatesCard />
    </div>
  )
}
