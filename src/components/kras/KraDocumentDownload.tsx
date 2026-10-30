import { useState } from 'react'
import { getKraDocumentUrl } from '../../lib/api'
import type { Kra } from '../../lib/kras'
import { DownloadIcon } from '../icons'

interface KraDocumentDownloadProps {
  kra: Kra
}

function formatSize(size: number | null): string {
  if (!size || size < 0) return ''
  if (size < 1000 * 1000) return `${Math.max(1, Math.round(size / 1000))} KB`
  if (size < 1000 * 1000 * 1000) return `${(size / 1_000_000).toFixed(1)} MB`
  return `${(size / 1_000_000_000).toFixed(1)} GB`
}

export function KraDocumentDownload({ kra }: KraDocumentDownloadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!kra.documentId) return null

  const download = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const url = await getKraDocumentUrl(kra.id)
      const link = document.createElement('a')
      link.href = url
      link.rel = 'noreferrer'
      document.body.append(link)
      link.click()
      link.remove()
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Could not download this document.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => void download()}
        disabled={loading}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-primary/20 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-100 disabled:opacity-60"
      >
        <DownloadIcon className="h-4 w-4" />
        {loading
          ? 'Downloading...'
          : `Download ${kra.documentName || 'submitted document'}`}
        {kra.documentSize ? ` · ${formatSize(kra.documentSize)}` : ''}
      </button>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
