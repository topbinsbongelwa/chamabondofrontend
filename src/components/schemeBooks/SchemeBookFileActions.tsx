import { useEffect, useRef, useState } from 'react'
import {
  fetchSchemeBookDocument,
  getSchemeBookDocumentUrl,
} from '../../lib/api'
import {
  formatFileSize,
  schemeBookFileKind,
  schemeBookMimeType,
  type SchemeBook,
} from '../../lib/schemeBooks'
import { AlertIcon, DownloadIcon, EyeIcon, SpinnerIcon } from '../icons'

interface SchemeBookFileActionsProps {
  book: SchemeBook
  allowPreview?: boolean
}

type FileAction = 'open' | 'download' | 'preview' | null

export function SchemeBookFileActions({
  book,
  allowPreview = false,
}: SchemeBookFileActionsProps) {
  const [busy, setBusy] = useState<FileAction>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const kind = schemeBookFileKind(book.documentName, book.documentType)
  const hasFile = Boolean(book.documentId || book.documentName)
  const canPreview = allowPreview && (kind === 'image' || kind === 'pdf')

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  useEffect(() => {
    setPreviewUrl(null)
    setError(null)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [book.id])

  if (!hasFile) return null

  const handleOpen = async () => {
    if (busy) return
    setBusy('open')
    setError(null)

    try {
      const url = await getSchemeBookDocumentUrl(book.id)
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.append(link)
      link.click()
      link.remove()
    } catch (openError) {
      setError(
        openError instanceof Error
          ? openError.message
          : 'Could not open this file.',
      )
    } finally {
      setBusy(null)
    }
  }

  const handleDownload = async () => {
    if (busy) return
    setBusy('download')
    setError(null)

    try {
      const url = await getSchemeBookDocumentUrl(book.id)
      const link = document.createElement('a')
      link.href = url
      link.download = book.documentName || 'scheme-book-file'
      link.rel = 'noreferrer'
      document.body.append(link)
      link.click()
      link.remove()
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Could not download this file.',
      )
    } finally {
      setBusy(null)
    }
  }

  const loadPreviewUrl = async (): Promise<string> => {
    if (objectUrlRef.current) return objectUrlRef.current

    const { blob, filename, contentType } = await fetchSchemeBookDocument(
      book.id,
    )
    const mime = schemeBookMimeType(
      book.documentName || filename,
      book.documentType || contentType,
    )
    const typedBlob = new Blob([blob], { type: mime })
    const url = URL.createObjectURL(typedBlob)
    objectUrlRef.current = url
    return url
  }

  const handlePreview = async () => {
    if (busy) return

    if (previewUrl) {
      setPreviewUrl(null)
      return
    }

    setBusy('preview')
    setError(null)

    try {
      const url = await loadPreviewUrl()
      setPreviewUrl(url)
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : 'Could not preview this file.',
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mt-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-xs font-semibold text-slate-600">
            <span className="block truncate">
              {book.documentName || 'Attached scheme book'}
            </span>
            {book.documentSize ? (
              <span className="mt-0.5 block text-[11px] font-normal text-slate-400">
                {formatFileSize(book.documentSize)}
              </span>
            ) : null}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {canPreview ? (
              <button
                type="button"
                onClick={() => void handlePreview()}
                disabled={busy !== null}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/30 hover:bg-primary-50 hover:text-primary disabled:opacity-60"
              >
                {busy === 'preview' ? (
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
                {previewUrl ? 'Hide preview' : 'Preview'}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => void handleOpen()}
              disabled={busy !== null}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-primary/20 bg-primary-50 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-100 disabled:opacity-60"
            >
              {busy === 'open' ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
              Open
            </button>

            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={busy !== null}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/30 hover:bg-primary-50 hover:text-primary disabled:opacity-60"
            >
              {busy === 'download' ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : (
                <DownloadIcon className="h-4 w-4" />
              )}
              Download
            </button>
          </div>
        </div>

        {allowPreview &&
        !canPreview &&
        (kind === 'word' || kind === 'other') ? (
          <p className="mt-2 text-[11px] text-slate-400">
            Preview is not available for this file type. Open or download it
            instead.
          </p>
        ) : null}

        {previewUrl ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {kind === 'image' ? (
              <img
                src={previewUrl}
                alt={book.documentName || 'Scheme book preview'}
                className="max-h-[420px] w-full object-contain"
              />
            ) : (
              <iframe
                src={previewUrl}
                title={book.documentName || 'Scheme book preview'}
                className="h-[420px] w-full"
              />
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-700"
        >
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}
