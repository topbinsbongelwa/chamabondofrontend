import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { createSchemeBook, resubmitSchemeBook } from '../../lib/api'
import { formatTerm } from '../../lib/kras'
import {
  SCHEME_BOOK_FILE_ACCEPT,
  SCHEME_BOOK_MAX_FILE_SIZE,
  formatFileSize,
  validateSchemeBookFile,
  type SchemeBook,
  type SchemeBookInput,
} from '../../lib/schemeBooks'
import {
  AlertIcon,
  CameraIcon,
  CloseIcon,
  SpinnerIcon,
  UploadIcon,
} from '../icons'
import { Modal } from '../ui/Modal'

const CURRENT_YEAR = new Date().getFullYear()
const TERM_OPTIONS = ['Term 1', 'Term 2', 'Term 3']
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) =>
  String(CURRENT_YEAR + 1 - index),
)

function suggestedTerm(): string {
  const month = new Date().getMonth() + 1
  if (month <= 4) return 'Term 1'
  if (month <= 8) return 'Term 2'
  return 'Term 3'
}

function initialValues(book: SchemeBook | null): SchemeBookInput {
  return {
    title: book?.title ?? '',
    subject: book?.subject ?? '',
    grade: book?.grade ?? '',
    term: book?.term || suggestedTerm(),
    year: book?.year || String(CURRENT_YEAR),
    weekFrom: book?.weekFrom !== null && book?.weekFrom !== undefined
      ? String(book.weekFrom)
      : '',
    weekTo:
      book?.weekTo !== null && book?.weekTo !== undefined
        ? String(book.weekTo)
        : '',
    notes: book?.notes ?? '',
  }
}

interface SchemeBookFormModalProps {
  open: boolean
  book: SchemeBook | null
  onClose: () => void
  onSaved: (message: string) => void
}

export function SchemeBookFormModal({
  open,
  book,
  onClose,
  onSaved,
}: SchemeBookFormModalProps) {
  const [values, setValues] = useState<SchemeBookInput>(initialValues(book))
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    setValues(initialValues(book))
    setFile(null)
    setError(null)
    setUploading(false)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open, book])

  const setField = (field: keyof SchemeBookInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const clearFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null

    if (!selected) {
      setFile(null)
      return
    }

    const validationError = validateSchemeBookFile(selected)
    if (validationError) {
      setFile(null)
      setError(validationError)
      event.target.value = ''
      return
    }

    setFile(selected)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (uploading) return

    const payload: SchemeBookInput = {
      title: values.title.trim(),
      subject: values.subject.trim(),
      grade: values.grade.trim(),
      term: values.term.trim(),
      year: values.year.trim(),
      weekFrom: values.weekFrom.trim(),
      weekTo: values.weekTo.trim(),
      notes: values.notes.trim(),
    }

    if (
      !payload.title ||
      !payload.subject ||
      !payload.grade ||
      !payload.term ||
      !payload.year ||
      !payload.weekFrom ||
      !payload.weekTo
    ) {
      setError('Please complete every required field.')
      return
    }

    const weekFrom = Number(payload.weekFrom)
    const weekTo = Number(payload.weekTo)

    if (
      !Number.isInteger(weekFrom) ||
      !Number.isInteger(weekTo) ||
      weekFrom < 1 ||
      weekTo < 1
    ) {
      setError('Week numbers must be whole numbers starting from 1.')
      return
    }

    if (weekTo < weekFrom) {
      setError('The "week to" value cannot be earlier than "week from".')
      return
    }

    if (!file) {
      setError(
        book
          ? 'Choose a replacement file before resubmitting.'
          : 'Choose a file before uploading.',
      )
      return
    }

    const validationError = validateSchemeBookFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      if (book) {
        await resubmitSchemeBook(book.id, payload, file, setProgress)
      } else {
        await createSchemeBook(payload, file, setProgress)
      }

      setProgress(100)
      onSaved(
        book
          ? 'Scheme book resubmitted for review.'
          : 'Scheme book uploaded for review.',
      )
      onClose()
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Could not upload this scheme book. Please try again.',
      )
    } finally {
      setUploading(false)
    }
  }

  const termOptions = Array.from(
    new Set([...TERM_OPTIONS, ...(book?.term ? [book.term] : [])]),
  )
  const yearOptions = Array.from(
    new Set([...YEAR_OPTIONS, ...(book?.year ? [book.year] : [])]),
  )

  return (
    <Modal
      open={open}
      onClose={uploading ? () => undefined : onClose}
      title={book ? 'Resubmit Scheme Book' : 'Upload Scheme Book'}
      description={
        book
          ? 'Replace the file and update the details, then send it back to your reviewer.'
          : 'Add your scheme book details and attach the file. It will be sent for review once uploaded.'
      }
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            {uploading
              ? `Uploading… ${progress}%`
              : 'PDF, DOC, DOCX, JPG or PNG up to 10 MB.'}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="scheme-book-form"
              disabled={uploading}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : (
                <UploadIcon className="h-4 w-4" />
              )}
              {uploading
                ? 'Uploading…'
                : book
                  ? 'Resubmit'
                  : 'Upload'}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="scheme-book-form"
        onSubmit={handleSubmit}
        aria-busy={uploading}
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

        <div>
          <label htmlFor="scheme-book-title" className="label">
            Title
          </label>
          <input
            id="scheme-book-title"
            type="text"
            value={values.title}
            onChange={(event) => setField('title', event.target.value)}
            maxLength={160}
            disabled={uploading}
            placeholder="e.g. Grade 6 Mathematics Scheme of Work"
            className="input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="scheme-book-subject" className="label">
              Subject
            </label>
            <input
              id="scheme-book-subject"
              type="text"
              value={values.subject}
              onChange={(event) => setField('subject', event.target.value)}
              maxLength={120}
              disabled={uploading}
              placeholder="e.g. Mathematics"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="scheme-book-grade" className="label">
              Grade
            </label>
            <input
              id="scheme-book-grade"
              type="text"
              value={values.grade}
              onChange={(event) => setField('grade', event.target.value)}
              maxLength={60}
              disabled={uploading}
              placeholder="e.g. Grade 6"
              className="input"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="scheme-book-term" className="label">
              Term
            </label>
            <select
              id="scheme-book-term"
              value={values.term}
              onChange={(event) => setField('term', event.target.value)}
              disabled={uploading}
              className="input"
            >
              {termOptions.map((term) => (
                <option key={term} value={term}>
                  {formatTerm(term)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="scheme-book-year" className="label">
              Year
            </label>
            <select
              id="scheme-book-year"
              value={values.year}
              onChange={(event) => setField('year', event.target.value)}
              disabled={uploading}
              className="input"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="scheme-book-week-from" className="label">
              Week from
            </label>
            <input
              id="scheme-book-week-from"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={values.weekFrom}
              onChange={(event) => setField('weekFrom', event.target.value)}
              disabled={uploading}
              placeholder="e.g. 1"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="scheme-book-week-to" className="label">
              Week to
            </label>
            <input
              id="scheme-book-week-to"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={values.weekTo}
              onChange={(event) => setField('weekTo', event.target.value)}
              disabled={uploading}
              placeholder="e.g. 12"
              className="input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="scheme-book-notes" className="label">
            Notes <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="scheme-book-notes"
            value={values.notes}
            onChange={(event) => setField('notes', event.target.value)}
            rows={3}
            maxLength={1200}
            disabled={uploading}
            placeholder="Add anything your reviewer should know about this scheme book."
            className="input min-h-[92px] resize-y"
          />
        </div>

        <div>
          <label htmlFor="scheme-book-file" className="label">
            Scheme book file
          </label>
          <input
            ref={fileInputRef}
            id="scheme-book-file"
            type="file"
            accept={SCHEME_BOOK_FILE_ACCEPT}
            disabled={uploading}
            onChange={handleFileChange}
            className="sr-only"
          />

          <label
            htmlFor="scheme-book-file"
            className={`flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-4 text-center transition hover:border-primary/50 hover:bg-primary-50/40 ${
              uploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <CameraIcon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-slate-700">
              Take a photo, choose from gallery, or pick a file
            </span>
            <span className="text-xs text-slate-500">
              PDF, DOC, DOCX, JPG or PNG · up to 10 MB
            </span>
          </label>

          {file ? (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary-50/70 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatFileSize(file.size)}
                  {file.size > SCHEME_BOOK_MAX_FILE_SIZE
                    ? ' · Too large'
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                disabled={uploading}
                aria-label="Remove selected file"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-red-600 disabled:opacity-60"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ) : book?.documentName ? (
            <p className="hint">
              Current file: {book.documentName}. Choose a new file to replace it.
            </p>
          ) : null}
        </div>

        {uploading ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-600">
                Uploading your scheme book
              </p>
              <p className="font-mono text-xs font-bold tabular-nums text-primary">
                {progress}%
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
