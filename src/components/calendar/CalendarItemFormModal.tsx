import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CALENDAR_AUDIENCE_LABELS,
  CALENDAR_CATEGORIES,
  CALENDAR_PRIORITY_LABELS,
  CALENDAR_TYPE_OPTIONS,
  type CalendarAudience,
  type CalendarItemType,
  type CalendarPriority,
} from '../../constants/calendar'
import { useStaffDirectory } from '../../hooks/useStaffDirectory'
import {
  createCalendarItem,
  updateCalendarItem,
} from '../../lib/api'
import { getCurrentUser } from '../../lib/auth'
import {
  formatCalendarCategory,
  todayKey,
  type CalendarItem,
  type CalendarItemInput,
  type CalendarTeacher,
} from '../../lib/calendar'
import {
  canPinCalendarItems,
  getRole,
  isTeacherInCharge,
} from '../../lib/roles'
import {
  AlertIcon,
  CloseIcon,
  SearchIcon,
  SpinnerIcon,
} from '../icons'
import { Modal } from '../ui/Modal'

interface FormValues {
  type: CalendarItemType
  title: string
  description: string
  startDate: string
  endDate: string
  allDay: boolean
  startTime: string
  endTime: string
  venue: string
  category: string
  audience: CalendarAudience
  department: string
  assignedTeachers: CalendarTeacher[]
  priority: CalendarPriority
  pinned: boolean
  expiresAt: string
}

function emptyValues(
  defaultType: CalendarItemType,
  teacherDepartment: string,
  tic: boolean,
): FormValues {
  return {
    type: defaultType,
    title: '',
    description: '',
    startDate: todayKey(),
    endDate: '',
    allDay: false,
    startTime: '08:00',
    endTime: '',
    venue: '',
    category: 'general',
    audience: tic ? 'department' : 'all',
    department: tic ? teacherDepartment : '',
    assignedTeachers: [],
    priority: 'normal',
    pinned: false,
    expiresAt: '',
  }
}

function valuesFromItem(item: CalendarItem): FormValues {
  return {
    type: item.type,
    title: item.title,
    description: item.description,
    startDate: item.startDate,
    endDate: item.endDate ?? '',
    allDay: item.allDay,
    startTime: item.startTime ?? '',
    endTime: item.endTime ?? '',
    venue: item.venue ?? '',
    category: item.category,
    audience: item.audience,
    department: item.department ?? '',
    assignedTeachers: item.assignedTeachers,
    priority: item.priority,
    pinned: item.pinned,
    expiresAt: item.expiresAt ?? '',
  }
}

interface TeacherMultiSelectProps {
  selected: CalendarTeacher[]
  disabled: boolean
  onChange: (teachers: CalendarTeacher[]) => void
}

function teacherMatches(memberId: string | number | null, teacher: CalendarTeacher) {
  if (memberId !== null && teacher.id !== null) {
    return String(memberId) === String(teacher.id)
  }
  return false
}

function TeacherMultiSelect({
  selected,
  disabled,
  onChange,
}: TeacherMultiSelectProps) {
  const { staff, loading, error } = useStaffDirectory()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return staff

    return staff.filter((member) =>
      [member.name, member.ecNumber, member.department, member.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search),
    )
  }, [staff, query])

  const addTeacher = (teacher: CalendarTeacher) => {
    if (disabled) return
    const exists = selected.some(
      (item) =>
        (teacher.id !== null && teacherMatches(teacher.id, item)) ||
        item.name.trim().toLowerCase() === teacher.name.trim().toLowerCase(),
    )
    if (!exists) onChange([...selected, teacher])
  }

  const removeTeacher = (teacher: CalendarTeacher) => {
    if (disabled) return
    onChange(
      selected.filter(
        (item) =>
          !(
            (teacher.id !== null && teacherMatches(teacher.id, item)) ||
            item.name.trim().toLowerCase() === teacher.name.trim().toLowerCase()
          ),
      ),
    )
  }

  return (
    <div>
      <span className="label">Assigned teachers</span>

      {selected.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((teacher) => (
            <li
              key={`${teacher.id ?? teacher.name}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 py-1 pl-2.5 pr-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/10"
            >
              {teacher.name}
              <button
                type="button"
                onClick={() => removeTeacher(teacher)}
                disabled={disabled}
                aria-label={`Remove ${teacher.name}`}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-primary/10 disabled:opacity-50"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-xs text-slate-500">
          Search for staff members to assign to this activity.
        </p>
      )}

      <div className="relative">
        <label htmlFor="calendar-teacher-search" className="sr-only">
          Search teachers
        </label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="calendar-teacher-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
          placeholder="Search by name, EC number or department"
          className="input pl-10"
        />
      </div>

      {error ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-amber-700">
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error} You can still create the activity without assigning teachers.
        </p>
      ) : null}

      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="flex items-center gap-2 px-3 py-3 text-xs font-medium text-slate-500">
            <SpinnerIcon className="h-4 w-4 animate-spin" />
            Loading staff directory...
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-3 text-xs text-slate-500">
            No staff match your search.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.slice(0, 40).map((member) => {
              const checked = selected.some(
                (teacher) =>
                  (member.id !== null &&
                    teacherMatches(member.id, teacher)) ||
                  teacher.name.trim().toLowerCase() ===
                    member.name.trim().toLowerCase(),
              )

              return (
                <li key={member.id ?? `${member.name}-${member.ecNumber ?? ''}`}>
                  <label className="flex min-h-[42px] cursor-pointer items-center gap-3 px-3 py-2 text-sm transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => {
                        if (checked) {
                          const target = selected.find(
                            (teacher) =>
                              (member.id !== null &&
                                teacherMatches(member.id, teacher)) ||
                              teacher.name.trim().toLowerCase() ===
                                member.name.trim().toLowerCase(),
                          )
                          if (target) removeTeacher(target)
                        } else {
                          addTeacher({
                            id: member.id === null ? null : String(member.id),
                            name: member.name,
                            ecNumber: member.ecNumber,
                            department: member.department,
                          })
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-800">
                        {member.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {[member.ecNumber, member.department]
                          .filter(Boolean)
                          .join(' · ') || 'No EC number'}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

interface CalendarItemFormModalProps {
  open: boolean
  item: CalendarItem | null
  defaultType: CalendarItemType
  onClose: () => void
  onSaved: (message: string) => void
}

export function CalendarItemFormModal({
  open,
  item,
  defaultType,
  onClose,
  onSaved,
}: CalendarItemFormModalProps) {
  const role = getRole()
  const tic = isTeacherInCharge(role)
  const canPin = canPinCalendarItems(role)
  const teacherDepartment = getCurrentUser()?.department ?? ''
  const [values, setValues] = useState<FormValues>(() =>
    emptyValues(defaultType, teacherDepartment, tic),
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    setValues(
      item
        ? valuesFromItem(item)
        : emptyValues(defaultType, teacherDepartment, tic),
    )
    setError(null)
    setSaving(false)
  }, [open, item, defaultType, teacherDepartment, tic])

  const update = (patch: Partial<FormValues>) => {
    setValues((current) => ({ ...current, ...patch }))
  }

  const handleTypeChange = (type: CalendarItemType) => {
    update({
      type,
      ...(type !== 'activity' ? { assignedTeachers: [] } : {}),
      ...(type !== 'update'
        ? { priority: 'normal', pinned: false, expiresAt: '' }
        : {}),
    })
  }

  const categoryOptions = CALENDAR_CATEGORIES.some(
    (category) => category.value === values.category,
  )
    ? CALENDAR_CATEGORIES
    : [
        ...CALENDAR_CATEGORIES,
        {
          value: values.category,
          label: formatCalendarCategory(values.category),
        },
      ]

  const validate = (): string | null => {
    if (!values.title.trim()) return 'Add a title for this item.'
    if (!values.startDate) return 'Choose a start date.'
    if (values.endDate && values.endDate < values.startDate) {
      return 'The end date cannot be before the start date.'
    }
    if (!values.allDay && !values.startTime) {
      return 'Choose a start time, or mark the item as all day.'
    }
    if (
      !values.allDay &&
      values.endTime &&
      (!values.endDate || values.endDate === values.startDate) &&
      values.endTime < values.startTime
    ) {
      return 'The end time cannot be before the start time.'
    }
    if (tic) {
      if (!(teacherDepartment || values.department).trim()) {
        return 'Add your department to your account before creating department items.'
      }
    } else if (
      values.audience === 'department' &&
      !values.department.trim()
    ) {
      return 'Choose the department this item is for.'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    const audience: CalendarAudience = tic ? 'department' : values.audience
    const department =
      audience === 'department'
        ? tic
          ? (teacherDepartment || values.department).trim()
          : values.department.trim()
        : ''

    const input: CalendarItemInput = {
      type: values.type,
      title: values.title.trim(),
      description: values.description.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      allDay: values.allDay,
      startTime: values.allDay ? '' : values.startTime,
      endTime: values.allDay ? '' : values.endTime,
      venue: values.venue.trim(),
      category: values.category,
      audience,
      department,
      assignedTeacherIds:
        values.type === 'activity'
          ? values.assignedTeachers.flatMap((teacher) =>
              teacher.id ? [teacher.id] : [],
            )
          : [],
      priority: values.type === 'update' ? values.priority : 'normal',
      pinned:
        values.type === 'update'
          ? canPin
            ? values.pinned
            : (item?.pinned ?? false)
          : false,
      expiresAt: values.type === 'update' ? values.expiresAt : '',
    }

    setSaving(true)
    setError(null)

    try {
      if (item) {
        await updateCalendarItem(item.id, input)
        onSaved('Calendar item updated.')
      } else {
        await createCalendarItem(input)
        onSaved('Calendar item created.')
      }
      onClose()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save this calendar item.',
      )
    } finally {
      setSaving(false)
    }
  }

  const busy = saving

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={item ? 'Edit calendar item' : 'Add calendar item'}
      description={
        item
          ? 'Update the details, then save your changes.'
          : 'Choose what to add, then complete the details that appear.'
      }
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="calendar-item-form"
            disabled={busy}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Saving...' : item ? 'Save changes' : 'Create item'}
          </button>
        </div>
      }
    >
      <form
        id="calendar-item-form"
        onSubmit={handleSubmit}
        aria-busy={busy}
        className="space-y-4"
      >
        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="calendar-item-type" className="label">
              Type
            </label>
            <select
              id="calendar-item-type"
              value={values.type}
              onChange={(event) =>
                handleTypeChange(event.target.value as CalendarItemType)
              }
              disabled={busy}
              className="input"
            >
              {CALENDAR_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="calendar-item-category" className="label">
              Category
            </label>
            <select
              id="calendar-item-category"
              value={values.category}
              onChange={(event) => update({ category: event.target.value })}
              disabled={busy}
              className="input"
            >
              {categoryOptions.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="calendar-item-title" className="label">
            Title
          </label>
          <input
            id="calendar-item-title"
            type="text"
            value={values.title}
            onChange={(event) => update({ title: event.target.value })}
            maxLength={160}
            required
            disabled={busy}
            placeholder="e.g. Staff meeting or inter-house sports"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="calendar-item-description" className="label">
            Description
          </label>
          <textarea
            id="calendar-item-description"
            value={values.description}
            onChange={(event) => update({ description: event.target.value })}
            rows={4}
            maxLength={4000}
            disabled={busy}
            placeholder="Add any details staff need to know."
            className="input min-h-[112px] resize-y"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="calendar-item-start-date" className="label">
              Start date
            </label>
            <input
              id="calendar-item-start-date"
              type="date"
              value={values.startDate}
              onChange={(event) => update({ startDate: event.target.value })}
              required
              disabled={busy}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="calendar-item-end-date" className="label">
              End date <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="calendar-item-end-date"
              type="date"
              value={values.endDate}
              min={values.startDate || undefined}
              onChange={(event) => update({ endDate: event.target.value })}
              disabled={busy}
              className="input"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
          <input
            type="checkbox"
            checked={values.allDay}
            onChange={(event) => update({ allDay: event.target.checked })}
            disabled={busy}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">
              All day
            </span>
            <span className="block text-xs text-slate-500">
              Hide the start and end times for this item.
            </span>
          </span>
        </label>

        {!values.allDay ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="calendar-item-start-time" className="label">
                Start time
              </label>
              <input
                id="calendar-item-start-time"
                type="time"
                value={values.startTime}
                onChange={(event) => update({ startTime: event.target.value })}
                disabled={busy}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="calendar-item-end-time" className="label">
                End time <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="calendar-item-end-time"
                type="time"
                value={values.endTime}
                onChange={(event) => update({ endTime: event.target.value })}
                disabled={busy}
                className="input"
              />
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="calendar-item-venue" className="label">
            Venue
          </label>
          <input
            id="calendar-item-venue"
            type="text"
            value={values.venue}
            onChange={(event) => update({ venue: event.target.value })}
            maxLength={160}
            disabled={busy}
            placeholder="e.g. Main hall"
            className="input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="calendar-item-audience" className="label">
              Audience
            </label>
            <select
              id="calendar-item-audience"
              value={tic ? 'department' : values.audience}
              onChange={(event) =>
                update({ audience: event.target.value as CalendarAudience })
              }
              disabled={busy || tic}
              className="input"
            >
              {!tic ? (
                <option value="all">
                  {CALENDAR_AUDIENCE_LABELS.all}
                </option>
              ) : null}
              <option value="department">
                {CALENDAR_AUDIENCE_LABELS.department}
              </option>
            </select>
            {tic ? (
              <p className="hint">
                As teacher in charge, items are shared with your department.
              </p>
            ) : null}
          </div>

          {(tic || values.audience === 'department') ? (
            <div>
              <label htmlFor="calendar-item-department" className="label">
                Department
              </label>
              <input
                id="calendar-item-department"
                type="text"
                value={
                  tic
                    ? teacherDepartment || values.department
                    : values.department
                }
                onChange={(event) =>
                  update({ department: event.target.value })
                }
                disabled={busy || (tic && Boolean(teacherDepartment))}
                required
                placeholder="e.g. Grade 7"
                className="input"
              />
            </div>
          ) : null}
        </div>

        {values.type === 'activity' ? (
          <TeacherMultiSelect
            selected={values.assignedTeachers}
            disabled={busy}
            onChange={(assignedTeachers) => update({ assignedTeachers })}
          />
        ) : null}

        {values.type === 'update' ? (
          <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="calendar-item-priority" className="label">
                  Priority
                </label>
                <select
                  id="calendar-item-priority"
                  value={values.priority}
                  onChange={(event) =>
                    update({
                      priority: event.target.value as CalendarPriority,
                    })
                  }
                  disabled={busy}
                  className="input"
                >
                  <option value="normal">
                    {CALENDAR_PRIORITY_LABELS.normal}
                  </option>
                  <option value="important">
                    {CALENDAR_PRIORITY_LABELS.important}
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="calendar-item-expiry" className="label">
                  Expiry date <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="calendar-item-expiry"
                  type="date"
                  value={values.expiresAt}
                  onChange={(event) => update({ expiresAt: event.target.value })}
                  disabled={busy}
                  className="input"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-100 bg-white px-3.5 py-3">
              <input
                type="checkbox"
                checked={values.pinned}
                onChange={(event) => update({ pinned: event.target.checked })}
                disabled={busy || !canPin}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Pin this update
                </span>
                <span className="block text-xs text-slate-500">
                  {canPin
                    ? 'Pinned updates appear first in the Updates feed.'
                    : 'Only the deputy head and head can pin updates.'}
                </span>
              </span>
            </label>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
