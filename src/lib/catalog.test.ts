import { describe, expect, it } from 'vitest'
import { brandForModel, deviceCatalog, phoneBrands } from './catalog'
import { identifyModel, normalize } from './normalize'
import { eligible, estimate } from './analytics'
import { createWorkspace, sampleListings } from './sample'

describe('expanded device support', () => {
  it('recognizes every advertised model without silently collapsing its variant', () => {
    for (const entry of deviceCatalog) {
      expect(identifyModel(`${entry.model} 128gb good condition`), entry.model).toEqual({
        model: entry.model,
        category: entry.category,
      })
    }
    expect(new Set(deviceCatalog.map((entry) => entry.model)).size).toBe(deviceCatalog.length)
    expect(deviceCatalog.filter((entry) => entry.category === 'phones').length).toBeGreaterThan(300)
    expect(phoneBrands).toHaveLength(18)
  })
  it.each([
    ['xiaomi redmi note13 pro+ 256gb pta approved good', 'Redmi Note 13 Pro Plus', 'Redmi'],
    ['samsung galaxy a15 5g 128gb clean', 'Samsung A15 5G', 'Samsung'],
    ['redmi note 12 4g 128 good condition', 'Redmi Note 12 4G', 'Redmi'],
    ['1+8t 256gb lush condition', 'OnePlus 8T', 'OnePlus'],
    ['one plus nord ce3 lite 5g 128gb good', 'OnePlus Nord CE 3 Lite', 'OnePlus'],
    ['oppo reno11 256gb working', 'OPPO Reno 11', 'OPPO'],
    ['VIVO Y17s 128gb pta ok', 'Vivo Y17s', 'Vivo'],
    ['realme c67 128gb pta approved', 'Realme C67', 'Realme'],
    ['INFINIX hot40 pro 256gb clean', 'Infinix Hot 40 Pro', 'Infinix'],
    ['tecno spark20 pro+ 256gb good', 'Tecno Spark 20 Pro Plus', 'Tecno'],
    ['nothing phone (2a) 256gb good', 'Nothing Phone 2a', 'Nothing'],
    ['moto g54 128gb clean', 'Motorola Moto G54', 'Motorola'],
    ['sony xperia 5 iii 128gb good', 'Sony Xperia 5 III', 'Sony'],
    ['huawei p30 pro 128gb clean', 'Huawei P30 Pro', 'Huawei'],
    ['honor x9b 256gb good', 'Honor X9b', 'Honor'],
    ['nokia g21 128gb working', 'Nokia G21', 'Nokia'],
    ['iphone SE 2nd gen 64gb clean', 'iPhone SE 2020', 'Apple'],
    ['iphone16e 128gb working', 'iPhone 16e', 'Apple'],
  ])('normalizes %s', (title, expected, brand) => {
    expect(identifyModel(title).model).toBe(expected)
    expect(brandForModel(expected)).toBe(brand)
  })
  it.each([
    'iPhone 11 Mini 128gb',
    'iPhone 14 Mini 128gb',
    'Samsung S230 128gb',
    'Pixel 77 128gb',
    'Redmi Note 130 128gb',
  ])('does not invent a model for %s', (title) => {
    expect(identifyModel(title).model).toBe('Unrecognized model')
  })
  it('keeps 4G and 5G prices separate and excludes unspecified dual-network variants', () => {
    const raw = {
      title: 'Samsung A15 4G 128gb pta approved good condition',
      price: 30000,
      city: 'Lahore',
    }
    const fourG = normalize(raw)
    const fiveG = [1, 2, 3, 4, 5].map((i) =>
      normalize({
        ...raw,
        title: raw.title.replace('4G', '5G'),
        price: 50000 + i * 1000,
        seller: `seller${i}`,
      }),
    )
    expect(estimate(fourG, fiveG).count).toBe(0)
    const unspecified = normalize({ ...raw, title: raw.title.replace('4G ', '') })
    expect(unspecified.warnings).toContain('4G/5G variant not specified')
    expect(eligible(unspecified)).toBe(false)
  })
})

describe('sample market coverage', () => {
  const anchor = new Date().toISOString()
  const listings = sampleListings(anchor)
  it('provides budget, midrange, and premium phones across all sample cities', () => {
    for (const city of ['Lahore', 'Karachi', 'Islamabad']) {
      const phones = listings.filter((l) => l.category === 'phones' && l.city === city)
      expect(new Set(phones.map((l) => l.model)).size).toBeGreaterThanOrEqual(80)
      expect(new Set(phones.map((l) => brandForModel(l.model))).size).toBe(18)
      expect(phones.some((l) => l.model === 'Infinix Smart 8')).toBe(true)
      expect(phones.some((l) => l.model === 'iPhone 16 Pro')).toBe(true)
    }
  })
  it('has unique IDs, recognized variants, and usable comparable cohorts', () => {
    expect(new Set(listings.map((l) => l.id)).size).toBe(listings.length)
    expect(listings.some((l) => l.model === 'Unrecognized model')).toBe(false)
    expect(listings.some((l) => l.warnings.includes('4G/5G variant not specified'))).toBe(false)
    const infinix = listings.find((l) => l.model === 'Infinix Note 30' && l.city === 'Karachi')!
    expect(estimate(infinix, listings).count).toBeGreaterThanOrEqual(5)
  })
  it('preserves old demo bookmarks and leaves new private workspaces empty', () => {
    expect(listings.find((l) => l.id === 'sample-0-0')?.model).toBe('iPhone 13')
    expect(listings.find((l) => l.id === 'sample-1-0')?.model).toBe('iPhone 12 Pro')
    expect(listings.find((l) => l.id === 'sample-Karachi-0')?.model).toBe('iPhone 13')
    expect(createWorkspace().listings).toEqual([])
  })
})
