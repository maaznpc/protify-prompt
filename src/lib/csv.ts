import { normalize } from './normalize'
import type { Listing, RawListing } from './types'

// RFC 4180-style quoting, including escaped quotes and embedded newlines.
export function parseCsv(text: string): string[][] {
  if (text.length > 10_000_000) throw new Error('CSV files must be smaller than 10 MB.')
  const rows: string[][] = [],
    row: string[] = []
  let cell = '',
    quoted = false,
    closedQuote = false
  text = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (char === '"') {
        quoted = false
        closedQuote = true
      } else cell += char
    } else if (char === '"' && !cell && !closedQuote) quoted = true
    else if (char === ',') {
      row.push(cell)
      cell = ''
      closedQuote = false
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((c) => c.trim())) rows.push([...row])
      row.length = 0
      cell = ''
      closedQuote = false
    } else {
      if (closedQuote && char.trim()) throw new Error('Unexpected text after a quoted CSV field.')
      cell += char
    }
  }
  if (quoted) throw new Error('A quoted CSV field was not closed.')
  row.push(cell)
  if (row.some((c) => c.trim())) rows.push(row)
  if (rows.length > 5001) throw new Error('Import a maximum of 5,000 rows at a time.')
  return rows
}
export function importCsv(text: string, now = new Date()) {
  const rows = parseCsv(text)
  if (rows.length < 2) throw new Error('Add a header and at least one listing row.')
  const headers = rows[0].map((h) => h.trim().toLowerCase())
  if (!headers.includes('title') || !headers.includes('price'))
    throw new Error('CSV needs title and price columns. Download the template for an example.')
  const accepted: Listing[] = [],
    rejected: { row: number; reason: string }[] = []
  rows.slice(1).forEach((row, index) => {
    try {
      if (row.length !== headers.length)
        throw new Error(
          `Expected ${headers.length} columns; found ${row.length}. Quote values containing commas.`,
        )
      const raw = Object.fromEntries(
        headers.map((h, i) => [h, row[i].trim()]),
      ) as unknown as RawListing
      accepted.push(normalize(raw, now))
    } catch (e) {
      rejected.push({ row: index + 2, reason: e instanceof Error ? e.message : 'Invalid row' })
    }
  })
  return { accepted, rejected }
}
function escapeCell(value: unknown) {
  let text = String(value ?? '')
  // Neutralize spreadsheet formulas on export, even when an imported title is hostile.
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
export function listingsCsv(listings: Listing[]) {
  const headers = [
    'title',
    'price',
    'city',
    'source',
    'seller',
    'url',
    'observed_at',
    'condition',
    'pta',
    'storage',
  ]
  const rows = listings.flatMap((l) =>
    l.observations.map((o) => [
      l.title,
      o.price,
      l.city,
      l.source,
      l.seller,
      l.url,
      o.at,
      l.condition,
      l.pta,
      l.storage,
    ]),
  )
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')
}
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
