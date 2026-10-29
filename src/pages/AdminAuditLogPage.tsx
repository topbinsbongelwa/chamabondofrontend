import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

interface AuditEntry {
  id: string
  who: string
  what: string
  when: string
  details: string
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function text(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function auditRows(payload: unknown): AuditEntry[] {
  const root = record(payload)
  const nested = record(root?.data)
  const collection =
    (Array.isArray(payload) ? payload : null) ??
    (Array.isArray(root?.items) ? root.items : null) ??
    (Array.isArray(root?.logs) ? root.logs : null) ??
    (Array.isArray(nested?.items) ? nested.items : null) ??
    (Array.isArray(nested?.logs) ? nested.logs : null) ??
    []

  return collection.flatMap((item, index) => {
    const source = record(item)
    if (!source) return []
    const actor = record(source.actor) ?? record(source.user)
    const action = text(source.action ?? source.event ?? source.type)
    const date = text(source.createdAt ?? source.created_at ?? source.timestamp ?? source.date)
    return [{
      id: text(source.id ?? source._id) || `${date}-${index}`,
      who: text(source.actorName ?? source.actor_name ?? source.userName ?? source.user_name) ||
        text(actor?.name ?? actor?.fullName ?? actor?.email) || 'Unknown user',
      what: action || 'Administrative action',
      when: date,
      details: text(source.details ?? source.description ?? source.message),
    }]
  })
}

export function AdminAuditLogPage() {
  const [items, setItems] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    api<unknown>('/api/admin/audit')
      .then((response) => {
        if (active) setItems(auditRows(response))
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Could not load the audit log.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [version])

  const visible = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) =>
      `${item.who} ${item.what} ${item.details}`.toLowerCase().includes(query),
    )
  }, [filter, items])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Governance</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Audit log</h1>
        <p className="mt-1 text-sm text-slate-500">Sensitive administrative actions recorded by the system.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <label htmlFor="audit-search" className="sr-only">Search audit entries</label>
          <input
            id="audit-search"
            className="input"
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search who, action or details"
          />
        </div>
        {loading ? (
          <div className="animate-pulse space-y-3 p-5"><div className="h-10 rounded bg-slate-100" /><div className="h-10 rounded bg-slate-100" /></div>
        ) : error ? (
          <div role="alert" className="p-5">
            <p className="text-sm text-red-700">{error}</p>
            <button type="button" onClick={() => setVersion((value) => value + 1)} className="mt-3 text-sm font-semibold text-primary underline">Retry</button>
          </div>
        ) : visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">{items.length ? 'No entries match your search.' : 'No audit entries are available.'}</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3">Who</th><th className="px-5 py-3">What</th><th className="px-5 py-3">When</th><th className="px-5 py-3">Details</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((item) => <AuditRow key={item.id} item={item} />)}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 sm:hidden">
              {visible.map((item) => (
                <li key={item.id} className="space-y-1 p-4">
                  <p className="text-sm font-semibold text-slate-900">{item.what}</p>
                  <p className="text-xs text-slate-600">{item.who} · {formatWhen(item.when)}</p>
                  {item.details ? <p className="text-xs text-slate-500">{item.details}</p> : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}

function formatWhen(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value || '—' : date.toLocaleString('en-GB')
}

function AuditRow({ item }: { item: AuditEntry }) {
  return (
    <tr>
      <td className="px-5 py-3.5 font-semibold text-slate-900">{item.who}</td>
      <td className="px-5 py-3.5 text-slate-700">{item.what}</td>
      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">{formatWhen(item.when)}</td>
      <td className="px-5 py-3.5 text-slate-600">{item.details || '—'}</td>
    </tr>
  )
}
