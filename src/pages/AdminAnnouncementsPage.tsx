import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  updateAnnouncement,
} from '../lib/api'
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementInput,
} from '../lib/announcements'
import { formatDate } from '../lib/format'
import { AlertIcon, CalendarIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon } from '../components/icons'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const EMPTY_INPUT: AnnouncementInput = {
  title: '',
  body: '',
  category: 'general',
  eventDate: '',
}

function inputFromAnnouncement(item: Announcement): AnnouncementInput {
  return {
    title: item.title,
    body: item.body,
    category: item.category,
    eventDate: item.eventDate ?? '',
  }
}

export function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [input, setInput] = useState<AnnouncementInput>(EMPTY_INPUT)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchAnnouncements())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load school updates.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, reloadKey])

  const resetForm = () => {
    setInput(EMPTY_INPUT)
    setEditingId(null)
    setError(null)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      if (editingId) {
        await updateAnnouncement(editingId, input)
        setNotice('School update saved.')
      } else {
        await createAnnouncement(input)
        setNotice('School update published.')
      }
      resetForm()
      setReloadKey((key) => key + 1)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save this school update.',
      )
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return

    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteAnnouncement(deleteTarget.id)
      setDeleteTarget(null)
      setNotice('School update removed.')
      setReloadKey((key) => key + 1)
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : 'Could not remove this school update.',
      )
    } finally {
      setDeleting(false)
    }
  }

  const startEdit = (item: Announcement) => {
    setInput(inputFromAnnouncement(item))
    setEditingId(item.id)
    setError(null)
    setNotice(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Staff communications
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          School updates
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Publish sports activities, meetings, events, and other notices for staff.
        </p>
      </div>

      {notice ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <CheckIcon className="h-4 w-4" />
          {notice}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
            {editingId ? <PencilIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? 'Edit update' : 'Publish an update'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="announcement-title" className="label">
                Title
              </label>
              <input
                id="announcement-title"
                value={input.title}
                onChange={(event) =>
                  setInput((value) => ({ ...value, title: event.target.value }))
                }
                maxLength={160}
                required
                disabled={saving}
                className="input"
                placeholder="e.g. Inter-house sports day"
              />
            </div>
            <div>
              <label htmlFor="announcement-category" className="label">
                Update type
              </label>
              <select
                id="announcement-category"
                value={input.category}
                onChange={(event) =>
                  setInput((value) => ({
                    ...value,
                    category: event.target.value as AnnouncementCategory,
                  }))
                }
                disabled={saving}
                className="input"
              >
                <option value="general">General notice</option>
                <option value="meeting">Meeting</option>
                <option value="sports">Sports activity</option>
                <option value="event">School event</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="announcement-date" className="label">
                Date (optional)
              </label>
              <input
                id="announcement-date"
                type="date"
                value={input.eventDate}
                onChange={(event) =>
                  setInput((value) => ({
                    ...value,
                    eventDate: event.target.value,
                  }))
                }
                disabled={saving}
                className="input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="announcement-body" className="label">
              Details
            </label>
            <textarea
              id="announcement-body"
              value={input.body}
              onChange={(event) =>
                setInput((value) => ({ ...value, body: event.target.value }))
              }
              rows={4}
              maxLength={4000}
              required
              disabled={saving}
              className="input min-h-[112px] resize-y"
              placeholder="Share the information staff need to know."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Save update'
                  : 'Publish update'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section aria-labelledby="published-updates-heading">
        <h2
          id="published-updates-heading"
          className="text-lg font-bold text-slate-900"
        >
          Published updates
        </h2>
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
          ) : error ? (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          ) : items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No updates have been published yet.
            </p>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      {item.category}
                    </span>
                    {item.eventDate ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {formatDate(item.eventDate)}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Shared by {item.authorName}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(item)
                      setDeleteError(null)
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove this school update?"
        message="Staff will no longer see this update."
        busy={deleting}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
