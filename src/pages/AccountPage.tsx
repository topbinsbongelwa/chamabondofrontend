import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertIcon, CheckIcon, SpinnerIcon } from '../components/icons'
import { updateMyProfile } from '../lib/api'
import { getCurrentUser, getDisplayName, getInitials } from '../lib/auth'
import { formatRoleLabel } from '../lib/roles'

function profileValue(value?: string): string {
  return value?.trim() || 'Not provided'
}

export function AccountPage() {
  const user = getCurrentUser()
  const name = getDisplayName()
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const role = formatRoleLabel(
    user?.role ?? user?.userRole ?? user?.position ?? user?.title,
  )

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateMyProfile({ email: email.trim(), phone: phone.trim() })
      setSaved(true)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save your profile.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 sm:space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Account settings
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your contact details.
        </p>
      </div>

      <section
        aria-labelledby="profile-details-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex items-center gap-4 bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-5 sm:p-7">
          <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-gold/70 bg-white/10 text-xl font-bold text-white shadow-lg sm:h-[72px] sm:w-[72px] sm:text-2xl">
            {getInitials(name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
              {name}
            </h2>
            <p className="mt-1 text-sm font-medium text-primary-100">{role}</p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <h2
            id="profile-details-heading"
            className="text-base font-bold text-slate-900"
          >
            Contact details
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Full name', value: name },
              { label: 'EC number', value: profileValue(user?.ecNumber) },
              { label: 'Department / grade', value: profileValue(user?.department) },
              { label: 'Role', value: role },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-email" className="label">
                  Email address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setSaved(false)
                  }}
                  maxLength={254}
                  disabled={saving}
                  className="input"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label htmlFor="profile-phone" className="label">
                  Phone number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value)
                    setSaved(false)
                  }}
                  maxLength={25}
                  disabled={saving}
                  className="input"
                  placeholder="e.g. 0771234567"
                />
              </div>
            </div>
            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
              >
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : null}
            {saved ? (
              <p
                role="status"
                className="flex items-center gap-2 text-sm font-medium text-emerald-700"
              >
                <CheckIcon className="h-4 w-4" />
                Contact details saved.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save contact details'}
            </button>
          </form>

          <Link
            to="/updates"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Back to updates
          </Link>
        </div>
      </section>
    </div>
  )
}
