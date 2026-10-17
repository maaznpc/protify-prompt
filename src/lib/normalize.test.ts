import { describe, expect, it } from 'vitest'
import { identifyModel, mergeListings, normalize, parsePrice, safeUrl } from './normalize'
import { eligible } from './analytics'

const now = new Date('2026-10-18T08:00:00Z')
const input = {
  title: 'iPhone 13 128gb PTA approved good condition',
  price: '95k',
  city: 'Lahore',
  seller: 'seller-a',
}

describe('real listing normalization', () => {
  it.each([
    ['ip12 pro max 128gb non-pta lush condition', 'iPhone 12 Pro Max'],
    ['iphone12promax 256 gb clean', 'iPhone 12 Pro Max'],
    ['i phone 13 128 box available', 'iPhone 13'],
    ['Samsung Galaxy S23 Ultra 12/256gb', 'Samsung S23 Ultra'],
    ['Pixel 7a 128 GB', 'Pixel 7a'],
    ['Macbook Air M1 8gb 256gb', 'MacBook Air M1'],
    ['Dell UltraSharp U2720Q 4k monitor', 'Dell U2720Q'],
  ])('recognizes %s', (title, model) => expect(identifyModel(title).model).toBe(model))
  it('does not confuse non-PTA with approved', () => {
    expect(normalize({ ...input, title: 'ip12 128 non-pta good condition' }, now).pta).toBe(
      'non-pta',
    )
    expect(
      normalize({ ...input, title: 'iphone 13 128 pta not approved good condition' }, now).pta,
    ).toBe('non-pta')
  })
  it('requires review for contradictory PTA text, including an unsafe override', () => {
    const listing = normalize(
      { ...input, title: 'iphone 13 128 non-pta pta approved good condition', pta: 'approved' },
      now,
    )
    expect(listing.pta).toBe('unknown')
    expect(eligible(listing)).toBe(false)
  })
  it('does not allow a damaged phone to become a deal through a condition override', () => {
    const listing = normalize(
      { ...input, title: input.title + ' broken for parts', condition: 'good' },
      now,
    )
    expect(listing.condition).toBe('parts')
    expect(eligible(listing)).toBe(false)
  })
  it('handles negated cosmetic faults', () =>
    expect(normalize({ ...input, title: input.title + ' no scratches' }, now).condition).toBe(
      'good',
    ))
  it('picks storage instead of RAM on a laptop', () =>
    expect(
      normalize({ ...input, title: 'Macbook Air M1 8gb ram 256gb SSD good condition' }, now)
        .storage,
    ).toBe(256))
  it('normalizes local city aliases', () =>
    expect(normalize({ ...input, city: 'lhr' }, now).city).toBe('Lahore'))
  it('excludes wanted and installment ads', () => {
    expect(eligible(normalize({ ...input, title: 'wanted ' + input.title }, now))).toBe(false)
    expect(
      eligible(normalize({ ...input, title: input.title + ' monthly installments' }, now)),
    ).toBe(false)
  })
  it('does not infer unknown details', () => {
    const listing = normalize({ title: 'iphone 13 available', price: 90000, city: 'Lahore' }, now)
    expect(listing.storage).toBe(0)
    expect(listing.pta).toBe('unknown')
    expect(listing.condition).toBe('unknown')
    expect(eligible(listing)).toBe(false)
  })
  it.each([
    ['Rs 95,000', 95000],
    ['95k', 95000],
    ['1.25 lakh', 125000],
    ['PKR 120000', 120000],
    ['120000/-', 120000],
  ])('parses %s', (raw, value) => expect(parsePrice(raw)).toBe(value))
  it.each(['call for price', '95000 or best offer', '-100', '1e9', ''])(
    'rejects ambiguous price %s',
    (value) => expect(() => normalize({ ...input, price: value }, now)).toThrow(),
  )
  it('rejects future observations', () =>
    expect(() => normalize({ ...input, observed_at: '2026-10-19' }, now)).toThrow(/future/))
  it('rejects dangerous URLs and removes tracking parameters', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('')
    expect(safeUrl('https://user:secret@example.com/')).toBe('')
    expect(safeUrl('https://example.com/item?utm_source=feed&b=2&a=1#x')).toBe(
      'https://example.com/item?a=1&b=2',
    )
  })
  it('merges re-observations by canonical URL and preserves history', () => {
    const a = normalize({ ...input, url: 'https://example.com/item?utm_source=a' }, now)
    const b = normalize(
      {
        ...input,
        title: input.title + ' price reduced',
        price: 90000,
        url: 'https://example.com/item?utm_source=b',
      },
      new Date(now.getTime() + 3600000),
    )
    const merged = mergeListings([a], [b])
    expect(merged.listings).toHaveLength(1)
    expect(merged.updated).toBe(1)
    expect(merged.listings[0].observations.map((o) => o.price)).toEqual([95000, 90000])
    expect(mergeListings(merged.listings, [b]).duplicates).toBe(1)
  })
  it('keeps different sellers separate even with identical wording', () => {
    const a = normalize(input, now),
      b = normalize({ ...input, seller: 'seller-b' }, now)
    expect(mergeListings([], [a, b]).listings).toHaveLength(2)
  })
})
