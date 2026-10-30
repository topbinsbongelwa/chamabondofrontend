export type AnnouncementCategory = 'general' | 'meeting' | 'sports' | 'event'

export interface Announcement {
  id: string
  title: string
  body: string
  category: AnnouncementCategory
  eventDate: string | null
  authorName: string
  createdAt: string | null
}

export interface AnnouncementInput {
  title: string
  body: string
  category: AnnouncementCategory
  eventDate: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

export function normalizeAnnouncement(value: unknown): Announcement | null {
  const source = asRecord(value)
  if (!source) return null

  const id = asString(source.id) ?? asString(source._id)
  const title = asString(source.title)
  const body = asString(source.body)
  const category = asString(source.category)
  if (!id || !title || !body) return null

  const acceptedCategory: AnnouncementCategory[] = [
    'general',
    'meeting',
    'sports',
    'event',
  ]

  return {
    id,
    title,
    body,
    category: acceptedCategory.includes(category as AnnouncementCategory)
      ? (category as AnnouncementCategory)
      : 'general',
    eventDate: asString(source.eventDate) ?? asString(source.event_date),
    authorName: asString(source.authorName) ?? 'School administrator',
    createdAt: asString(source.createdAt) ?? asString(source.created_at),
  }
}

export function normalizeAnnouncementList(value: unknown): Announcement[] {
  const root = asRecord(value)
  const data = asRecord(root?.data) ?? root
  const candidate = data?.announcements ?? data?.items ?? data?.results
  const items = Array.isArray(candidate) ? candidate : Array.isArray(value) ? value : []
  return items
    .map((item) => normalizeAnnouncement(item))
    .filter((item): item is Announcement => item !== null)
}
