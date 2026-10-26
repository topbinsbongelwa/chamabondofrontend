export type CsvValue = string | number | null | undefined

function escapeCell(value: CsvValue): string {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv(rows: CsvValue[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, rows: CsvValue[][]): void {
  if (typeof window === 'undefined') return

  const blob = new Blob([`\uFEFF${toCsv(rows)}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
