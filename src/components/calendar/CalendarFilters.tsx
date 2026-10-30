import {
  CALENDAR_TYPE_OPTIONS,
  type CalendarCategoryOption,
  type CalendarItemType,
} from '../../constants/calendar'

interface CalendarFiltersProps {
  typeFilter: CalendarItemType | 'all'
  categoryFilter: string
  categories: CalendarCategoryOption[]
  onTypeChange: (value: CalendarItemType | 'all') => void
  onCategoryChange: (value: string) => void
  onReset: () => void
}

export function CalendarFilters({
  typeFilter,
  categoryFilter,
  categories,
  onTypeChange,
  onCategoryChange,
  onReset,
}: CalendarFiltersProps) {
  const hasFilters = typeFilter !== 'all' || categoryFilter !== 'all'

  return (
    <div
      aria-label="Calendar filters"
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1 sm:max-w-[180px]">
        <label htmlFor="calendar-type-filter" className="sr-only">
          Filter by item type
        </label>
        <select
          id="calendar-type-filter"
          value={typeFilter}
          onChange={(event) =>
            onTypeChange(event.target.value as CalendarItemType | 'all')
          }
          className="input"
        >
          <option value="all">All types</option>
          {CALENDAR_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 flex-1 sm:max-w-[200px]">
        <label htmlFor="calendar-category-filter" className="sr-only">
          Filter by category
        </label>
        <select
          id="calendar-category-filter"
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="input"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  )
}
