import { useEffect, useMemo, useState } from 'react'
import type { CalendarItemType } from '../../constants/calendar'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import {
  addMonths,
  categoryOptionsFor,
  dateKeyFromDateValue,
  startOfMonth,
  todayKey,
  type CalendarItem,
} from '../../lib/calendar'
import { formatMonthYear } from '../../lib/format'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  NotebookIcon,
} from '../icons'
import { AgendaList } from './AgendaList'
import { CalendarFilters } from './CalendarFilters'
import { CalendarLegend } from './CalendarLegend'
import { DayPanel } from './DayPanel'
import { MonthGrid } from './MonthGrid'

type CalendarView = 'month' | 'agenda'

interface CalendarTabProps {
  items: CalendarItem[]
  loading: boolean
  onSelectItem: (item: CalendarItem) => void
}

export function CalendarTab({
  items,
  loading,
  onSelectItem,
}: CalendarTabProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [view, setView] = useState<CalendarView>(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches
      ? 'agenda'
      : 'month',
  )
  const [viewTouched, setViewTouched] = useState(false)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey())
  const [typeFilter, setTypeFilter] = useState<CalendarItemType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    if (viewTouched) return
    setView(isMobile ? 'agenda' : 'month')
  }, [isMobile, viewTouched])

  const categories = useMemo(() => categoryOptionsFor(items), [items])
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (typeFilter !== 'all' && item.type !== typeFilter) return false
        if (categoryFilter !== 'all' && item.category !== categoryFilter) {
          return false
        }
        return true
      }),
    [items, typeFilter, categoryFilter],
  )

  const changeView = (next: CalendarView) => {
    setViewTouched(true)
    setView(next)
  }

  const goToMonth = (amount: number) => {
    const next = addMonths(month, amount)
    setMonth(next)
    setSelectedDate(dateKeyFromDateValue(next))
  }

  const goToToday = () => {
    const now = new Date()
    setMonth(startOfMonth(now))
    setSelectedDate(todayKey())
  }

  const resetFilters = () => {
    setTypeFilter('all')
    setCategoryFilter('all')
  }

  const showSkeleton = loading && items.length === 0

  return (
    <div className="space-y-4">
      <section
        aria-label="Calendar controls"
        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card sm:p-4"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                aria-label="Previous month"
                className="inline-flex h-10 w-10 items-center justify-center rounded-l-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="min-h-[40px] border-x border-slate-200 px-3 text-xs font-bold uppercase tracking-wide text-primary transition hover:bg-primary-50"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                aria-label="Next month"
                className="inline-flex h-10 w-10 items-center justify-center rounded-r-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>

            <h2 className="min-w-0 text-base font-bold text-slate-900 sm:text-lg">
              {formatMonthYear(month)}
            </h2>
          </div>

          <div
            role="group"
            aria-label="Calendar view"
            className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:inline-flex"
          >
            <button
              type="button"
              onClick={() => changeView('month')}
              aria-pressed={view === 'month'}
              className={`inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                view === 'month'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-inset ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              Month
            </button>
            <button
              type="button"
              onClick={() => changeView('agenda')}
              aria-pressed={view === 'agenda'}
              className={`inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                view === 'agenda'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-inset ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <NotebookIcon className="h-4 w-4" />
              Agenda
            </button>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <CalendarFilters
            typeFilter={typeFilter}
            categoryFilter={categoryFilter}
            categories={categories}
            onTypeChange={setTypeFilter}
            onCategoryChange={setCategoryFilter}
            onReset={resetFilters}
          />
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <CalendarLegend />
        </div>
      </section>

      {showSkeleton ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }, (_, index) => (
                <div
                  key={index}
                  className="h-16 rounded-lg bg-slate-100 sm:h-24"
                />
              ))}
            </div>
          </div>
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          <p className="sr-only" role="status">
            Loading calendar
          </p>
        </div>
      ) : view === 'month' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <MonthGrid
            month={month}
            items={filteredItems}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectItem={onSelectItem}
          />
          <div className="lg:sticky lg:top-[84px]">
            <DayPanel
              dateKey={selectedDate}
              items={filteredItems}
              onSelectItem={onSelectItem}
            />
          </div>
        </div>
      ) : (
        <AgendaList
          month={month}
          items={filteredItems}
          onSelectItem={onSelectItem}
        />
      )}
    </div>
  )
}
