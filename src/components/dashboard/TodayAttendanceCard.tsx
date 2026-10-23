import { useEffect, useState, type FormEvent } from 'react'
import {
  checkIn,
  checkOut,
  fetchTodayAttendance,
  markAttendance,
} from '../../lib/api'
import {
  MARK_OPTIONS,
  statusKey,
  statusLabel,
  type AttendanceRecord,
} from '../../lib/attendance'
import { formatClock, formatFullDate, formatTime } from '../../lib/format'
import { useNow } from '../../hooks/useNow'
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  RefreshIcon,
  SpinnerIcon,
} from '../icons'
import { StatusBadge } from './StatusBadge'

type PendingAction = 'checkin' | 'checkout' | 'mark' | null

interface Feedback {
  kind: 'success' | 'error'
  message: string
}

interface TodayAttendanceCardProps {
  onChanged: () => void
}

function messageFromError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

const LEAVE_STATUSES = ['sick-leave', 'leave', 'holiday', 'official-duty', 'absent']

export function TodayAttendanceCard({ onChanged }: TodayAttendanceCardProps) {
  const now = useNow()
  const [record, setRecord] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadVersion, setLoadVersion] = useState(0)
  const [pending, setPending] = useState<PendingAction>(null)
  const [markStatus, setMarkStatus] = useState('')
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError(null)

      try {
        const data = await fetchTodayAttendance()
        if (!cancelled) setRecord(data)
      } catch (error) {
        if (!cancelled) setLoadError(messageFromError(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [loadVersion])

  const key = statusKey(record?.status)
  const hasCheckedIn =
    Boolean(record?.checkIn) || key === 'present' || key === 'late'
  const hasCheckedOut = Boolean(record?.checkOut)
  const markedLeave = LEAVE_STATUSES.includes(key)
  const isDone = hasCheckedOut || markedLeave
  const busy = pending !== null

  const resolveRecord = async (
    response: AttendanceRecord | null,
  ): Promise<AttendanceRecord | null> => {
    if (response) return response

    try {
      return await fetchTodayAttendance()
    } catch {
      return null
    }
  }

  const handlePrimaryAction = async () => {
    if (busy || loading || isDone) return

    const action = hasCheckedIn ? 'checkout' : 'checkin'
    setPending(action)
    setFeedback(null)

    try {
      const response = action === 'checkin' ? await checkIn() : await checkOut()
      const next = await resolveRecord(response)
      const timestamp = new Date().toISOString()

      if (next) {
        setRecord(next)
      } else if (action === 'checkin') {
        setRecord((current) => ({
          id: current?.id ?? null,
          date: current?.date ?? timestamp,
          status: 'present',
          checkIn: current?.checkIn ?? timestamp,
          checkOut: current?.checkOut ?? null,
          note: current?.note ?? null,
        }))
      } else {
        setRecord((current) =>
          current
            ? { ...current, checkOut: current.checkOut ?? timestamp }
            : null,
        )
      }

      const time = formatTime(
        action === 'checkin' ? next?.checkIn ?? timestamp : next?.checkOut ?? timestamp,
      )

      setFeedback({
        kind: 'success',
        message:
          action === 'checkin'
            ? `Checked in at ${time}. Have a good day.`
            : `Checked out at ${time}. See you tomorrow.`,
      })
      onChanged()
    } catch (error) {
      setFeedback({ kind: 'error', message: messageFromError(error) })
    } finally {
      setPending(null)
    }
  }

  const handleMark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!markStatus || busy || loading) return

    setPending('mark')
    setFeedback(null)

    try {
      const selected = MARK_OPTIONS.find((option) => option.value === markStatus)
      const response = await markAttendance(markStatus, note)
      const next = await resolveRecord(response)

      if (next) {
        setRecord(next)
      } else {
        const value = note.trim() || null
        setRecord((current) =>
          current
            ? { ...current, status: markStatus, note: value }
            : {
                id: null,
                date: new Date().toISOString(),
                status: markStatus,
                checkIn: null,
                checkOut: null,
                note: value,
              },
        )
      }

      setFeedback({
        kind: 'success',
        message: `Marked as ${selected?.label ?? statusLabel(markStatus)} for today.`,
      })
      setMarkStatus('')
      setNote('')
      onChanged()
    } catch (error) {
      setFeedback({ kind: 'error', message: messageFromError(error) })
    } finally {
      setPending(null)
    }
  }

  let primaryLabel = 'Check In'
  if (isDone) primaryLabel = 'Done for today'
  else if (pending === 'checkin') primaryLabel = 'Checking in…'
  else if (pending === 'checkout') primaryLabel = 'Checking out…'
  else if (hasCheckedIn) primaryLabel = 'Check Out'

  return (
    <section
      aria-labelledby="today-attendance-heading"
      aria-busy={loading || busy}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50/70 via-white to-gold/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Today&apos;s attendance
            </p>
            <h2
              id="today-attendance-heading"
              className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
            >
              {formatFullDate(now)}
            </h2>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
              <ClockIcon className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-700">
                {formatClock(now)}
              </span>
              <span className="sr-only">Current time</span>
            </p>
          </div>

          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
              Loading
            </span>
          ) : (
            <StatusBadge
              status={record?.status ?? (loadError ? 'unknown' : 'Not checked in')}
            />
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="animate-pulse space-y-4" aria-hidden="true">
            <div className="grid max-w-md grid-cols-2 gap-3">
              <div className="h-[74px] rounded-xl bg-slate-100" />
              <div className="h-[74px] rounded-xl bg-slate-100" />
            </div>
            <div className="h-12 max-w-xs rounded-xl bg-slate-100" />
            <div className="h-px w-full bg-slate-100" />
            <div className="h-10 max-w-sm rounded-xl bg-slate-100" />
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-start gap-2 text-sm font-medium text-red-700">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{loadError}</span>
            </p>
            <button
              type="button"
              onClick={() => setLoadVersion((version) => version + 1)}
              className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <RefreshIcon className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : (
          <>
            <dl className="grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Check-in
                </dt>
                <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">
                  {formatTime(record?.checkIn)}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Check-out
                </dt>
                <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">
                  {formatTime(record?.checkOut)}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={loading || busy || isDone}
                className={`btn-primary sm:max-w-xs ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-600 hover:border-emerald-200 hover:bg-emerald-600'
                    : ''
                }`}
              >
                {pending === 'checkin' || pending === 'checkout' ? (
                  <SpinnerIcon className="h-5 w-5 animate-spin" />
                ) : isDone ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <ClockIcon className="h-5 w-5" />
                )}
                {primaryLabel}
              </button>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900">Mark as</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Use this if you are not able to check in normally today.
              </p>

              <form onSubmit={handleMark} className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="mark-status" className="label">
                      Status
                    </label>
                    <select
                      id="mark-status"
                      value={markStatus}
                      onChange={(event) => setMarkStatus(event.target.value)}
                      disabled={busy || loading}
                      className="input"
                    >
                      <option value="">Select a status</option>
                      {MARK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="mark-note" className="label">
                      Note <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="mark-note"
                      type="text"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      maxLength={280}
                      disabled={busy || loading}
                      placeholder="Add a short reason"
                      className="input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!markStatus || busy || loading}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {pending === 'mark' ? (
                    <>
                      <SpinnerIcon className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </form>
            </div>

            {feedback ? (
              <p
                role={feedback.kind === 'error' ? 'alert' : 'status'}
                className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  feedback.kind === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {feedback.kind === 'error' ? (
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
