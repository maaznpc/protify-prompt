import { describe, expect, it } from 'vitest'
import { importCsv, listingsCsv, parseCsv } from './csv'
import { normalize } from './normalize'
import { createWorkspace } from './sample'
import { validateBackup } from './storage'

describe('CSV import', () => {
  it('parses quoted commas, escaped quotes, CRLF, and multiline fields', () => {
    expect(
      parseCsv('\uFEFFtitle,price\r\n"iPhone, \\""nice\\""\nphone",95000\r\n'.replaceAll('\\', '')),
    ).toEqual([
      ['title', 'price'],
      ['iPhone, "nice"\nphone', '95000'],
    ])
  })
  it('rejects missing headers and unclosed quoting', () => {
    expect(() => importCsv('model,value\niPhone,95000')).toThrow(/title and price/)
    expect(() => parseCsv('title,price\n"iPhone,95000')).toThrow(/not closed/)
  })
  it('reports malformed rows while retaining good rows for review', () => {
    const result = importCsv(
      'title,price,city\n"iPhone 13 128gb pta approved good",95000,Lahore\nphone,invalid,Lahore\nbad,too,many,columns',
    )
    expect(result.accepted).toHaveLength(1)
    expect(result.rejected.map((r) => r.row)).toEqual([3, 4])
  })
  it('round-trips every price observation', () => {
    const listing = normalize({
      title: 'iPhone 13 128gb pta approved good',
      price: 95000,
      city: 'Lahore',
      seller: 'A',
    })
    listing.observations.push({ at: new Date(Date.now() - 86400000).toISOString(), price: 100000 })
    expect(importCsv(listingsCsv([listing])).accepted.map((l) => l.observations[0].price)).toEqual([
      95000, 100000,
    ])
  })
  it('neutralizes spreadsheet formula injection on export', () => {
    const listing = normalize({
      title: '=HYPERLINK("https://example.com")',
      price: 95000,
      city: 'Lahore',
      seller: '@hostile',
    })
    const row = parseCsv(listingsCsv([listing]))[1]
    expect(row[0].startsWith("'=")).toBe(true)
    expect(row[4]).toBe("'@hostile")
  })
})
describe('backup integrity', () => {
  it('round-trips a schema-validated workspace', () => {
    const state = createWorkspace()
    expect(validateBackup(JSON.stringify(state))).toEqual(state)
  })
  it('rejects invalid schemas and dangerous source links', () => {
    expect(() => validateBackup('{"version": 3}')).toThrow(/valid Nearmint backup/)
    const state = createWorkspace(),
      listing = normalize({
        title: 'iphone 13 128gb good pta approved',
        price: 95000,
        city: 'Lahore',
      })
    listing.url = 'javascript:alert(1)'
    state.listings = [listing]
    expect(() => validateBackup(JSON.stringify(state))).toThrow(/valid Nearmint backup/)
  })
})
