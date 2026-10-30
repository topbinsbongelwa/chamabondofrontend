import { useEffect, useState, type FormEvent } from 'react'
import { createKra, updateKra } from '../../lib/api'
import {
  formatTerm,
  type Kra,
  type KraInput,
} from '../../lib/kras'
import { AlertIcon, SpinnerIcon } from '../icons'
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

function emptyValues(): KraInput {
  return {
    title: '',
    description: '',
    indicator: '',
    target: '',
    term: suggestedTerm(),
    year: String(CURRENT_YEAR),
  }
}

interface KraFormModalProps {
  open: boolean
  kra: Kra | null
  onClose: () => void
  onSaved: (message: string) => void
}

type SaveMode = 'draft' | 'submit'

export function KraFormModal({
  open,
  kra,
  onClose,
  onSaved,
}: KraFormModalProps) {
  const [values, setValues] = useState<KraInput>(emptyValues)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<SaveMode | null>(null)

  useEffect(() => {
    if (!open) return

    setValues(
      kra
        ? {
            title: kra.title,
            description: kra.description,
            indicator: kra.indicator,
            target: kra.target,
            term: kra.term,
            year: kra.year,
          }
        : emptyValues(),
    )
    setFile(null)
    setError(null)
    setSaving(null)
  }, [open, kra])

  const setField = (field: keyof KraInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async (mode: SaveMode) => {
    if (saving) return

    const payload: KraInput = {
      title: values.title.trim(),
      description: values.description.trim(),
      indicator: values.indicator.trim(),
      target: values.target.trim(),
      term: values.term.trim(),
      year: values.year.trim(),
    }

    if (
      !payload.title ||
      !payload.description ||
      !payload.indicator ||
      !payload.target ||
      !payload.term ||
      !payload.year
    ) {
      setError('Please complete every field before saving.')
      return
    }

    if (mode === 'submit' && !file && !kra?.documentId) {
      setError('Attach a PDF, DOC, or DOCX document before submitting.')
      return
    }

    setSaving(mode)
    setError(null)

    try {
      if (kra) {
        await updateKra(kra.id, payload, mode === 'submit', file)
      } else {
        await createKra(payload, mode === 'submit', file)
      }

      onSaved(
        mode === 'submit'
          ? 'KRA submitted for review.'
          : 'KRA saved as a draft.',
      )
      onClose()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save this KRA. Please try again.',
      )
    } finally {
      setSaving(null)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSave('submit')
  }

  const termOptions = Array.from(
    new Set([...TERM_OPTIONS, ...(kra?.term ? [kra.term] : [])]),
  )
  const yearOptions = Array.from(
    new Set([...YEAR_OPTIONS, ...(kra?.year ? [kra.year] : [])]),
  )
  const busy = saving !== null

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={kra ? 'Edit KRA' : 'New KRA'}
      description={
        kra
          ? 'Update this key result area. Drafts and rejected KRAs can be edited.'
          : 'Set a clear key result area for the term, then save a draft or submit it for review.'
      }
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            {saving === 'submit'
              ? 'Submitting to your reviewer...'
              : saving === 'draft'
                ? 'Saving your draft...'
                : 'You can keep working on a draft at any time.'}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleSave('draft')}
              disabled={busy}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving === 'draft' ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : null}
              Save as Draft
            </button>

            <button
              type="submit"
              form="kra-form"
              disabled={busy}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving === 'submit' ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : null}
              {saving === 'submit' ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="kra-form"
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

        <div>
          <label htmlFor="kra-title" className="label">
            Title
          </label>
          <input
            id="kra-title"
            type="text"
            value={values.title}
            onChange={(event) => setField('title', event.target.value)}
            maxLength={160}
            disabled={busy}
            placeholder="e.g. Improve Grade 7 mathematics pass rate"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="kra-description" className="label">
            Description
          </label>
          <textarea
            id="kra-description"
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
            rows={4}
            maxLength={1200}
            disabled={busy}
            placeholder="Describe what you plan to do and why it matters."
            className="input min-h-[112px] resize-y"
          />
        </div>

        <div>
          <label htmlFor="kra-indicator" className="label">
            Indicator
          </label>
          <input
            id="kra-indicator"
            type="text"
            value={values.indicator}
            onChange={(event) => setField('indicator', event.target.value)}
            maxLength={300}
            disabled={busy}
            placeholder="e.g. Learner performance in end-of-term tests"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="kra-target" className="label">
            Target
          </label>
          <input
            id="kra-target"
            type="text"
            value={values.target}
            onChange={(event) => setField('target', event.target.value)}
            maxLength={160}
            disabled={busy}
            placeholder="e.g. 75% of learners scoring 60% or above"
            className="input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="kra-term" className="label">
              Term
            </label>
            <select
              id="kra-term"
              value={values.term}
              onChange={(event) => setField('term', event.target.value)}
              disabled={busy}
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
            <label htmlFor="kra-year" className="label">
              Year
            </label>
            <select
              id="kra-year"
              value={values.year}
              onChange={(event) => setField('year', event.target.value)}
              disabled={busy}
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

        <div>
          <label htmlFor="kra-document" className="label">
            Supporting soft-copy document
          </label>
          <input
            id="kra-document"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={busy}
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null
              if (selected && selected.size > 3 * 1000 * 1000 * 1000) {
                setFile(null)
                setError('The document must be 3 GB or smaller.')
                event.target.value = ''
                return
              }
              setFile(selected)
              setError(null)
            }}
            className="input h-auto min-h-[44px] py-2"
          />
          <p className="hint">
            PDF, DOC, or DOCX up to 3 GB. Attach a document to submit for review.
            {kra?.documentName && !file
              ? ` Current file: ${kra.documentName}`
              : ''}
          </p>
        </div>
      </form>
    </Modal>
  )
}
