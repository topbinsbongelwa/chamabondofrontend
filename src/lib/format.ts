const fullDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function parseDateValue(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())

  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  return new Date(value)
}

export function formatMonthYear(value: Date): string {
  return value.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function formatFullDate(value: Date | string): string {
  const date = typeof value === 'string' ? parseDateValue(value) : value
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : ''
  return fullDateFormatter.format(date)
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'

  const date = parseDateValue(value)
  if (Number.isNaN(date.getTime())) return value

  return shortDateFormatter.format(date)
}

export function formatTime(value?: string | null): string {
  if (!value) return '—'

  const timeOnly = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i.exec(value.trim())
  if (timeOnly) {
    const [, rawHour, minute, meridiem] = timeOnly
    let hour = Number(rawHour)

    if (meridiem?.toLowerCase() === 'pm' && hour < 12) hour += 12
    if (meridiem?.toLowerCase() === 'am' && hour === 12) hour = 0

    return `${String(hour).padStart(2, '0')}:${minute}`
  }

  const date = parseDateValue(value)
  if (Number.isNaN(date.getTime())) return value

  return timeFormatter.format(date)
}

export function formatClock(value: Date): string {
  return value.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}
