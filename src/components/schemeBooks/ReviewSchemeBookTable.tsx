import { formatTerm } from '../../lib/kras'
import {
  formatWeeksCovered,
  type SchemeBook,
} from '../../lib/schemeBooks'
import { ChevronRightIcon } from '../icons'
import { SchemeBookStatusBadge } from './SchemeBookStatusBadge'

interface ReviewSchemeBookTableProps {
  books: SchemeBook[]
  onSelect: (book: SchemeBook) => void
}

export function ReviewSchemeBookTable({
  books,
  onSelect,
}: ReviewSchemeBookTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-5 py-3">
                  Teacher
                </th>
                <th scope="col" className="px-4 py-3">
                  Department
                </th>
                <th scope="col" className="px-4 py-3">
                  Subject
                </th>
                <th scope="col" className="px-4 py-3">
                  Grade
                </th>
                <th scope="col" className="px-4 py-3">
                  Term
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  <span className="sr-only">Review</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {books.map((book) => (
                <tr key={book.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-slate-800">
                      {book.teacherName || 'Teacher'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatWeeksCovered(book)}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">
                    {book.department || 'No department'}
                  </td>
                  <td className="max-w-[240px] px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-800">
                      {book.subject || 'No subject'}
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs text-slate-400"
                      title={book.title}
                    >
                      {book.title}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">
                    {book.grade || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">
                    {formatTerm(book.term)}
                    <span className="text-slate-400">
                      {' '}
                      / {book.year || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <SchemeBookStatusBadge status={book.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(book)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-sm font-semibold text-primary transition hover:bg-primary-50"
                    >
                      Review
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {books.map((book) => (
          <article key={book.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug text-slate-900">
                  {book.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {book.teacherName || 'Teacher'}
                  {book.department ? ` · ${book.department}` : ''}
                </p>
              </div>
              <SchemeBookStatusBadge status={book.status} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Subject
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700">
                  {book.subject || 'No subject'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Grade
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700">
                  {book.grade || '—'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Term
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700">
                  {formatTerm(book.term)} / {book.year || '—'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Weeks covered
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700">
                  {formatWeeksCovered(book)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelect(book)}
              className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-1 rounded-xl border border-primary/20 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-100"
            >
              Review scheme book
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>
    </>
  )
}
