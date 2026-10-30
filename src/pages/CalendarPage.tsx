import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { CalendarItemType } from '../constants/calendar'
import { CalendarActivitiesTab } from '../components/calendar/CalendarActivitiesTab'
import { CalendarItemDrawer } from '../components/calendar/CalendarItemDrawer'
import { CalendarItemFormModal } from '../components/calendar/CalendarItemFormModal'
import { CalendarTab } from '../components/calendar/CalendarTab'
import { CalendarUpdatesTab } from '../components/calendar/CalendarUpdatesTab'
import {
  AlertIcon,
  CalendarIcon,
  MegaphoneIcon,
  NotebookIcon,
  PlusIcon,
  RefreshIcon,
  SpinnerIcon,
} from '../components/icons'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Toast, type ToastTone } from '../components/ui/Toast'
import { useCalendarData } from '../hooks/useCalendarData'
import {
  deleteCalendarItem,
  setCalendarItemPinned,
} from '../lib/api'
import { getCurrentUser } from '../lib/auth'
import {
  isCalendarItemCreatedByMe,
  type CalendarItem,
} from '../lib/calendar'
import { formatCalendarCacheTime } from '../lib/calendarCache'
import {
  canManageCalendarItems,
  canPinCalendarItems,
  getRole,
  isTeacherInCharge,
} from '../lib/roles'

type CalendarTabId = 'calendar' | 'updates' | 'activities'

const TABS: Array<{
  id: CalendarTabId
  label: string
  icon: typeof CalendarIcon
}> = [
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'updates', label: 'Updates', icon: MegaphoneIcon },
  { id: 'activities', label: 'Activities', icon: NotebookIcon },
]

const DEFAULT_TYPE: Record<CalendarTabId, CalendarItemType> = {
  calendar: 'event',
  updates: 'update',
  activities: 'activity',
}

const ADD_LABEL: Record<CalendarTabId, string> = {
  calendar: 'Add event',
  updates: 'Add update',
  activities: 'Add activity',
}

function isCalendarTabId(value: string | null): value is CalendarTabId {
  return value === 'calendar' || value === 'updates' || value === 'activities'
}

interface ToastState {
  message: string
  tone: ToastTone
}

export function CalendarPage() {
  const role = getRole()
  const canManage = canManageCalendarItems(role)
  const canPin = canPinCalendarItems(role)
  const tic = isTeacherInCharge(role)
  const currentUser = getCurrentUser()
  const canManageItem = (item: CalendarItem) =>
    canManage && (!tic || isCalendarItemCreatedByMe(item, currentUser))

  const [searchParams, setSearchParams] = useSearchParams()
  const { items, loading, error, usingSavedData, savedAt, reload } =
    useCalendarData()
  const requestedTab = searchParams.get('tab')
  const tab: CalendarTabId = isCalendarTabId(requestedTab)
    ? requestedTab
    : 'calendar'
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CalendarItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pinBusyId, setPinBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const refresh = useCallback(() => {
    reload()
    setRefreshKey((current) => current + 1)
  }, [reload])

  const announce = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      setToast({ message, tone })
    },
    [],
  )

  const dismissToast = useCallback(() => setToast(null), [])

  const selectTab = (nextTab: CalendarTabId) => {
    const next = new URLSearchParams(searchParams)
    if (nextTab === 'calendar') {
      next.delete('tab')
    } else {
      next.set('tab', nextTab)
    }
    setSearchParams(next, { replace: true })
  }

  const openCreate = () => {
    setEditingItem(null)
    setFormOpen(true)
  }

  const openEdit = (item: CalendarItem) => {
    if (!canManageItem(item)) return
    setSelectedItem(null)
    setEditingItem(item)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingItem(null)
  }

  const handleSaved = (message: string) => {
    setSelectedItem(null)
    announce(message)
    refresh()
  }

  const requestDelete = (item: CalendarItem) => {
    if (!canManageItem(item)) return
    setSelectedItem(null)
    setDeleteError(null)
    setDeleteTarget(item)
  }

  const cancelDelete = () => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return

    const target = deleteTarget
    setDeleting(true)
    setDeleteError(null)

    try {
      await deleteCalendarItem(target.id)
      setDeleteTarget(null)
      setSelectedItem((current) =>
        current?.id === target.id ? null : current,
      )
      announce(`“${target.title}” was deleted.`)
      refresh()
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : 'Could not delete this item.',
      )
    } finally {
      setDeleting(false)
    }
  }

  const togglePin = async (item: CalendarItem) => {
    if (!canPin || pinBusyId) return

    const nextPinned = !item.pinned
    setPinBusyId(item.id)

    try {
      const updated = await setCalendarItemPinned(item.id, nextPinned)
      setSelectedItem((current) => {
        if (!current || current.id !== item.id) return current
        return updated ?? { ...current, pinned: nextPinned }
      })
      announce(nextPinned ? 'Item pinned.' : 'Item unpinned.')
      refresh()
    } catch (pinFailure) {
      announce(
        pinFailure instanceof Error
          ? pinFailure.message
          : 'Could not update the pin.',
        'error',
      )
    } finally {
      setPinBusyId(null)
    }
  }

  const activeTab = TABS.find((entry) => entry.id === tab) ?? TABS[0]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            School calendar
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <CalendarIcon className="h-5 w-5" />
            </span>
            Calendar
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Meetings, events, deadlines, staff activities and school updates in
            one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshIcon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {canManage ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600"
            >
              <PlusIcon className="h-4 w-4" />
              {ADD_LABEL[activeTab.id]}
            </button>
          ) : null}
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Calendar sections"
        className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`calendar-${id}-tab`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`calendar-${id}-panel`}
            onClick={() => selectTab(id)}
            className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              tab === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {usingSavedData ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900"
        >
          <p>
            Showing saved calendar data
            {savedAt ? ` from ${formatCalendarCacheTime(savedAt)}` : ''}. Connect
            to the internet to refresh.
          </p>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      ) : null}

      {error && items.length === 0 ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <p className="flex items-start gap-2 font-medium">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : null}

      <div
        id="calendar-calendar-panel"
        role="tabpanel"
        aria-labelledby="calendar-calendar-tab"
        aria-busy={tab === 'calendar' ? loading : undefined}
        hidden={tab !== 'calendar'}
      >
        <CalendarTab
          items={items}
          loading={loading}
          onSelectItem={setSelectedItem}
        />
      </div>

      <div
        id="calendar-updates-panel"
        role="tabpanel"
        aria-labelledby="calendar-updates-tab"
        aria-busy={tab === 'updates' ? loading : undefined}
        hidden={tab !== 'updates'}
      >
        <CalendarUpdatesTab
          items={items}
          loading={loading}
          canManageItem={canManageItem}
          canPin={canPin}
          pinBusyId={pinBusyId}
          onSelectItem={setSelectedItem}
          onEdit={openEdit}
          onDelete={requestDelete}
          onTogglePin={togglePin}
        />
      </div>

      <div
        id="calendar-activities-panel"
        role="tabpanel"
        aria-labelledby="calendar-activities-tab"
        aria-busy={tab === 'activities' ? loading : undefined}
        hidden={tab !== 'activities'}
      >
        <CalendarActivitiesTab
          items={items}
          loading={loading}
          currentUser={currentUser}
          refreshKey={refreshKey}
          onSelectItem={setSelectedItem}
        />
      </div>

      {selectedItem ? (
        <CalendarItemDrawer
          key={selectedItem.id}
          item={selectedItem}
          canManage={canManageItem(selectedItem)}
          canPin={canPin && selectedItem.type === 'update'}
          pinBusy={pinBusyId === selectedItem.id}
          onClose={() => setSelectedItem(null)}
          onEdit={openEdit}
          onDelete={requestDelete}
          onTogglePin={togglePin}
        />
      ) : null}

      <CalendarItemFormModal
        open={formOpen}
        item={editingItem}
        defaultType={DEFAULT_TYPE[tab]}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete calendar item?"
        message={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed from the calendar. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete item"
        busy={deleting}
        error={deleteError}
        onCancel={cancelDelete}
        onConfirm={() => void confirmDelete()}
      />

      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={dismissToast}
        />
      ) : null}
    </div>
  )
}
