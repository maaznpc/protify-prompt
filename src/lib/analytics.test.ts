import { describe, expect, it } from 'vitest'
import {
  alertMatches,
  buildEstimates,
  DAY,
  estimate,
  latest,
  median,
  priceTrend,
  profitEstimate,
  signal,
  trimOutliers,
} from './analytics'
import { normalize } from './normalize'
import type { AlertRule, Listing } from './types'

const now = Date.parse('2026-10-18T12:00:00Z')
function listing(price: number, seller = String(price), overrides: Partial<Listing> = {}): Listing {
  return {
    ...normalize(
      { title: 'iPhone 13 128gb PTA approved good condition', price, city: 'Lahore', seller },
      new Date(now),
    ),
    ...overrides,
  }
}
describe('price evidence', () => {
  it('keeps indexed leave-one-out medians equal to independently filtered price samples', () => {
    for (let count = 3; count <= 24; count++) {
      const rows = Array.from({ length: count }, (_, i) =>
        listing(i === count - 1 ? 850000 : 90000 + (i % 9) * 2000, `seller-${i}`),
      )
      const estimates = buildEstimates(rows, now)
      for (const candidate of rows) {
        const peers = trimOutliers(
          rows.filter((l) => l.id !== candidate.id),
          now,
        ).peers
        const expected = peers.length >= 3 ? median(peers.map((l) => latest(l, now)!.price)) : null
        expect(estimates.get(candidate.id)?.median).toBe(expected)
        expect(estimates.get(candidate.id)?.count).toBe(peers.length)
      }
    }
  })
  it('analyzes a 5,000-listing cohort without allocating one peer array per candidate', () => {
    const rows = Array.from({ length: 5000 }, (_, i) =>
      listing(100000 + (i % 30) * 500, `seller-${i}`),
    )
    const estimates = buildEstimates(rows, now)
    expect(estimates.size).toBe(5000)
    expect(estimates.get(rows[0].id)?.median).toBe(107000)
    expect(estimates.get(rows[0].id)?.count).toBe(4999)
  })
  it('handles odd, even, and empty medians without changing input', () => {
    const values = [9, 1, 5]
    expect(median(values)).toBe(5)
    expect(median([4, 2])).toBe(3)
    expect(median([])).toBeNull()
    expect(values).toEqual([9, 1, 5])
  })
  it('uses other equivalent listings and leaves the candidate out', () => {
    const candidate = listing(80000, 'deal'),
      peers = [100000, 110000, 120000, 130000, 140000].map((p) => listing(p))
    const result = estimate(candidate, [candidate, ...peers], now)
    expect(result.median).toBe(120000)
    expect(result.count).toBe(5)
    expect(result.discount).toBeCloseTo(33.3333)
    expect(signal(candidate, result, now)).toBe('deal')
  })
  it('does not mix storage, condition, PTA status, or city', () => {
    const candidate = listing(80000, 'deal'),
      peers = [100000, 110000, 120000].map((p) => listing(p))
    const mismatches = [
      listing(20000, 'different-pta', { pta: 'non-pta' }),
      listing(20000, 'different-storage', { storage: 256 }),
      listing(20000, 'different-city', { city: 'Karachi' }),
      listing(20000, 'different-condition', { condition: 'fair' }),
    ]
    const result = estimate(candidate, [...peers, ...mismatches], now)
    expect(result.median).toBe(110000)
    expect(result.count).toBe(3)
    expect(signal(candidate, result, now)).toBe('limited')
  })
  it('requires three peers for a median and five for a deal label', () => {
    const candidate = listing(80000, 'deal'),
      peers = [110000, 120000].map((p) => listing(p))
    expect(estimate(candidate, peers, now).median).toBeNull()
    const result = estimate(candidate, [...peers, listing(100000)], now)
    expect(result.median).toBe(110000)
    expect(signal(candidate, result, now)).toBe('limited')
  })
  it('removes large price outliers without being pulled by them', () => {
    const peers = [100000, 102000, 104000, 106000, 108000, 110000, 112000, 999000].map((p) =>
      listing(p),
    )
    const result = estimate(listing(90000, 'deal'), peers, now)
    expect(result.median).toBe(106000)
    expect(result.excluded).toBe(1)
    expect(result.count).toBe(7)
  })
  it('routes implausibly low prices to review', () => {
    const candidate = listing(20000, 'suspicious'),
      peers = Array.from({ length: 6 }, (_, i) => listing(100000, `peer${i}`))
    expect(signal(candidate, estimate(candidate, peers, now), now)).toBe('review')
  })
  it('does not allow stale listings to affect current medians', () => {
    const stale = listing(20000, 'old', {
      observations: [{ at: new Date(now - 31 * DAY).toISOString(), price: 20000 }],
    })
    const result = estimate(
      listing(80000, 'deal'),
      [stale, ...[100000, 110000, 120000].map((p) => listing(p))],
      now,
    )
    expect(result.count).toBe(3)
    expect(result.median).toBe(110000)
  })
  it('picks only the latest known observation and ignores future prices', () => {
    const l = listing(80000)
    l.observations = [
      { at: new Date(now + DAY).toISOString(), price: 1000 },
      { at: new Date(now).toISOString(), price: 80000 },
      { at: new Date(now - DAY).toISOString(), price: 90000 },
    ]
    expect(latest(l, now)?.price).toBe(80000)
    expect(latest(l, now - 2 * DAY)).toBeNull()
  })
})
describe('historical analysis', () => {
  it('never leaks a later observation into an earlier day', () => {
    const rows = [0, 1, 2].map((i) =>
      listing(90000, `seller${i}`, {
        observations: [
          { at: new Date(now - 3 * DAY).toISOString(), price: 120000 },
          { at: new Date(now - DAY).toISOString(), price: 90000 },
        ],
      }),
    )
    const trend = priceTrend(rows, 'iPhone 13', 'Lahore', 4, now)
    expect(trend.points.map((p) => p.median)).toEqual([120000, 120000, 90000, 90000])
  })
  it('leaves a gap after fourteen days without an observation', () => {
    const rows = [0, 1, 2].map((i) =>
      listing(90000, `seller${i}`, {
        observations: [{ at: new Date(now - 16 * DAY).toISOString(), price: 90000 }],
      }),
    )
    expect(
      priceTrend(rows, 'iPhone 13', 'Lahore', 2, now).points.every((p) => p.median === null),
    ).toBe(true)
  })
  it('never mixes cities in an all-cities trend', () => {
    const rows = [0, 1, 2].map((i) => listing(90000, `seller${i}`))
    rows.push(...[0, 1, 2, 3].map((i) => listing(200000, `karachi${i}`, { city: 'Karachi' })))
    const trend = priceTrend(rows, 'iPhone 13', 'All cities', 1, now)
    expect(trend.reference?.city).toBe('Karachi')
    expect(trend.points[0].median).toBe(200000)
  })
})
describe('budget rules and resale estimates', () => {
  const rule: AlertRule = {
    id: 'one',
    model: 'iPhone 13',
    budget: 90000,
    city: 'Lahore',
    storage: 128,
    pta: 'approved',
    enabled: true,
    minDiscount: 0,
  }
  it('matches only eligible, fresh observations under the exact budget', () => {
    const rows = [
      listing(90000, 'match'),
      listing(95000, 'expensive'),
      listing(85000, 'nonpta', { pta: 'non-pta' }),
      listing(85000, 'parts', { condition: 'parts' }),
    ]
    expect(alertMatches(rule, rows, now).map((l) => l.seller)).toEqual(['match'])
    expect(alertMatches({ ...rule, enabled: false }, rows, now)).toHaveLength(0)
  })
  it('requires enough independent price evidence for a discount alert', () => {
    const candidate = listing(85000, 'deal'),
      peers = Array.from({ length: 6 }, (_, i) => listing(110000 + i * 1000, `peer${i}`))
    expect(
      alertMatches({ ...rule, minDiscount: 20 }, [candidate, ...peers], now).map((l) => l.seller),
    ).toEqual(['deal'])
    expect(alertMatches({ ...rule, minDiscount: 20 }, [candidate], now)).toHaveLength(0)
  })
  it('includes repairs, transport, and percentage selling fees in profit and ROI', () => {
    const result = profitEstimate(80000, 100000, 5000, 1000, 2)
    expect(result.costs).toBe(88000)
    expect(result.profit).toBe(12000)
    expect(result.roi).toBeCloseTo(13.636)
    expect(profitEstimate(100000, 90000, 0, 0, 0).profit).toBe(-10000)
  })
})
