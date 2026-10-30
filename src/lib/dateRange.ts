import { formatDate, parseDateValue } from './format'

export function toMonthValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function currentMonthValue(): string {
  return toMonthValue(new Date())
}

export function monthBounds(month: string): { from: string; to: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month.trim())
  if (!match) return null

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) return null

  const first = new Date(year, monthIndex, 1)
  const last = new Date(year, monthIndex + 1, 0)

  return {
    from: formatIsoDate(first),
    to: formatIsoDate(last),
  }
}

export function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function monthFromDate(value: string): string {
  const date = parseDateValue(value)
  return Number.isNaN(date.getTime()) ? '' : toMonthValue(date)
}

export function formatRangeLabel(from: string, to: string): string {
  if (!from || !to) return 'Select a date range'
  return `${formatDate(from)} to ${formatDate(to)}`
}

export function formatMonthValue(month: string): string {
  const bounds = monthBounds(month)
  if (!bounds) return month
  return parseDateValue(bounds.from).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

export function rangeLengthInDays(from: string, to: string): number {
  const start = parseDateValue(from)
  const end = parseDateValue(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0

  return (
    Math.floor(
      (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
        86_400_000,
    ) + 1
  )
}

export function isRangeValid(from: string, to: string): boolean {
  if (!from || !to) return false
  return from <= to
}
