import type { AlertRule, Estimate, Listing, Observation } from './types'

export const DAY = 86400000
const observationIndexes = new WeakMap<
  Observation[],
  { length: number; rows: { at: number; observation: Observation }[] }
>()

export function latest(listing: Listing, at = Date.now()): Observation | null {
  // Observations are immutable in application state. Cache their sorted time index so
  // chart windows and peer comparisons do not repeatedly parse the same timestamps.
  let index = observationIndexes.get(listing.observations)
  if (!index || index.length !== listing.observations.length) {
    index = {
      length: listing.observations.length,
      rows: listing.observations
        .map((observation) => ({ at: Date.parse(observation.at), observation }))
        .sort((a, b) => a.at - b.at),
    }
    observationIndexes.set(listing.observations, index)
  }
  let low = 0,
    high = index.rows.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (index.rows[middle].at <= at) low = middle + 1
    else high = middle
  }
  return low ? index.rows[low - 1].observation : null
}
export function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
function quantile(values: number[], q: number) {
  const sorted = [...values].sort((a, b) => a - b),
    index = (sorted.length - 1) * q
  const lo = Math.floor(index),
    fraction = index - lo
  return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * fraction
}
export function eligible(listing: Listing) {
  return (
    listing.category !== 'other' &&
    listing.condition !== 'parts' &&
    listing.condition !== 'unknown' &&
    listing.city !== 'Other' &&
    (listing.category === 'monitors' || listing.storage > 0) &&
    (listing.category !== 'phones' || listing.pta !== 'unknown') &&
    !listing.warnings.some((w) => /conflict|wanted|partial-payment|variant not specified/i.test(w))
  )
}
export function comparisonKey(listing: Listing) {
  return [listing.model, listing.storage, listing.pta, listing.condition, listing.city].join('|')
}
export function trimOutliers(listings: Listing[], at = Date.now()) {
  const priced = listings
    .map((l) => ({ listing: l, observation: latest(l, at) }))
    .filter((p) => p.observation !== null)
  if (priced.length < 8) return { peers: priced.map((p) => p.listing), excluded: 0 }
  const values = priced.map((p) => p.observation!.price),
    q1 = quantile(values, 0.25),
    q3 = quantile(values, 0.75)
  // A minimum spread avoids discarding every price change when many sellers use the same round number.
  const spread = Math.max(q3 - q1, (median(values) || 0) * 0.05)
  const peers = priced
    .filter(
      (p) => p.observation!.price >= q1 - 1.5 * spread && p.observation!.price <= q3 + 1.5 * spread,
    )
    .map((p) => p.listing)
  return { peers, excluded: listings.length - peers.length }
}
export function estimate(listing: Listing, listings: Listing[], at = Date.now()): Estimate {
  return createEstimator(listings, at)(listing)
}

function createEstimator(listings: Listing[], at: number) {
  type PriceRow = { id: string; price: number }
  const groups = new Map<string, { rows: PriceRow[]; ranks: Map<string, number> }>()
  for (const listing of listings) {
    if (!eligible(listing)) continue
    const observation = latest(listing, at)
    if (!observation || at - Date.parse(observation.at) > 30 * DAY) continue
    const key = comparisonKey(listing)
    if (!groups.has(key)) groups.set(key, { rows: [], ranks: new Map() })
    groups.get(key)!.rows.push({ id: listing.id, price: observation.price })
  }
  for (const group of groups.values()) {
    group.rows.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id))
    group.rows.forEach((row, index) => group.ranks.set(row.id, index))
  }
  const empty: Estimate = {
    median: null,
    low: null,
    high: null,
    count: 0,
    excluded: 0,
    confidence: 'limited',
    discount: null,
    reason: '',
  }
  return (listing: Listing): Estimate => {
    if (!eligible(listing))
      return {
        ...empty,
        reason:
          'Complete model, storage, condition, city, and PTA details are needed for a fair comparison. Parts and partial-payment ads are excluded.',
      }
    const group = groups.get(comparisonKey(listing))
    const rows = group?.rows || []
    const removed = group?.ranks.get(listing.id) ?? -1
    const rawCount = rows.length - (removed >= 0 ? 1 : 0)
    let start = 0,
      end = rows.length
    function size() {
      return end - start - (removed >= start && removed < end ? 1 : 0)
    }
    function valueAt(index: number) {
      let rank = start + index
      if (removed >= start && removed < end && rank >= removed) rank++
      return rows[rank].price
    }
    function percentile(q: number) {
      const rank = (size() - 1) * q,
        lower = Math.floor(rank),
        fraction = rank - lower
      return valueAt(lower) + (valueAt(Math.min(lower + 1, size() - 1)) - valueAt(lower)) * fraction
    }
    function bound(price: number, upper: boolean) {
      let low = 0,
        high = rows.length
      while (low < high) {
        const middle = (low + high) >>> 1
        if (rows[middle].price < price || (upper && rows[middle].price === price)) low = middle + 1
        else high = middle
      }
      return low
    }
    if (rawCount >= 8) {
      const q1 = percentile(0.25),
        q3 = percentile(0.75),
        spread = Math.max(q3 - q1, percentile(0.5) * 0.05)
      start = bound(q1 - 1.5 * spread, false)
      end = bound(q3 + 1.5 * spread, true)
    }
    const count = size(),
      excluded = rawCount - count
    if (count < 3)
      return {
        ...empty,
        count,
        excluded,
        reason:
          'At least 3 other recent, equivalent listings are needed. Import more observations to build a useful benchmark.',
      }
    const mid = percentile(0.5),
      current = latest(listing, at)
    return {
      median: mid,
      low: percentile(0.25),
      high: percentile(0.75),
      count,
      excluded,
      confidence: count >= 10 ? 'strong' : count >= 5 ? 'moderate' : 'limited',
      discount: current ? ((mid - current.price) / mid) * 100 : null,
      reason: `${count} other ${listing.city} listings with the same model, storage, PTA status, and condition. Observed within 30 days; ${excluded} price outlier${excluded === 1 ? '' : 's'} excluded.`,
    }
  }
}

export function buildEstimates(listings: Listing[], at = Date.now()): Map<string, Estimate> {
  const analyze = createEstimator(listings, at)
  return new Map(listings.map((listing) => [listing.id, analyze(listing)]))
}

export function recent(listing: Listing, at = Date.now()) {
  const observation = latest(listing, at)
  return Boolean(observation && at - Date.parse(observation.at) <= 30 * DAY)
}
export type Signal = 'deal' | 'fair' | 'above' | 'review' | 'limited' | 'stale'
export function signal(listing: Listing, comparison: Estimate, at = Date.now()): Signal {
  if (!eligible(listing)) return 'review'
  if (!recent(listing, at)) return 'stale'
  if (comparison.median === null || comparison.discount === null || comparison.count < 5)
    return 'limited'
  if (comparison.discount > 45) return 'review'
  if (comparison.discount >= 12) return 'deal'
  if (comparison.discount < -10) return 'above'
  return 'fair'
}
export function alertMatches(
  rule: AlertRule,
  listings: Listing[],
  at = Date.now(),
  existingEstimates?: Map<string, Estimate>,
) {
  if (!rule.enabled) return []
  const estimates = rule.minDiscount ? existingEstimates || buildEstimates(listings, at) : null
  return listings.filter(
    (l) =>
      l.model === rule.model &&
      (!rule.city || rule.city === 'All cities' || l.city === rule.city) &&
      (!rule.storage || l.storage === rule.storage) &&
      (rule.pta === 'unknown' || l.pta === rule.pta) &&
      eligible(l) &&
      recent(l, at) &&
      latest(l, at)!.price <= rule.budget &&
      (!rule.minDiscount ||
        (() => {
          const e = estimates!.get(l.id)!
          return (
            e.count >= 5 &&
            e.discount !== null &&
            e.discount >= rule.minDiscount &&
            e.discount <= 45
          )
        })()),
  )
}
export interface TrendPoint {
  at: number
  median: number | null
  movingAverage: number | null
  count: number
}
export function priceTrend(
  listings: Listing[],
  model: string,
  city: string,
  days: number,
  at = Date.now(),
): { points: TrendPoint[]; reference: Listing | null } {
  const matching = listings.filter(
    (l) => l.model === model && (city === 'All cities' || l.city === city) && eligible(l),
  )
  // Select the largest exact comparable cohort, rather than mixing storage/PTA/condition or cities.
  const groups = new Map<string, Listing[]>()
  for (const l of matching) {
    const key = comparisonKey(l)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(l)
  }
  const cohort =
    [...groups.values()].sort(
      (a, b) => b.length - a.length || comparisonKey(a[0]).localeCompare(comparisonKey(b[0])),
    )[0] || []
  const points: TrendPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const dayEnd = at - i * DAY
    const active = cohort.filter((l) => {
      const o = latest(l, dayEnd)
      return o && dayEnd - Date.parse(o.at) <= 14 * DAY
    })
    const { peers } = trimOutliers(active, dayEnd)
    const value = peers.length >= 3 ? median(peers.map((l) => latest(l, dayEnd)!.price)) : null
    const recentPoints = [...points.slice(-6).map((p) => p.median), value].filter(
      (p): p is number => p !== null,
    )
    points.push({
      at: dayEnd,
      median: value,
      movingAverage:
        value !== null && recentPoints.length >= 3
          ? recentPoints.reduce((a, b) => a + b, 0) / recentPoints.length
          : null,
      count: peers.length,
    })
  }
  return { points, reference: cohort[0] || null }
}
export function money(value: number | null, compact = false) {
  if (value === null) return '—'
  return `Rs ${compact && value >= 1000 ? new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value / 1000) + 'k' : Math.round(value).toLocaleString('en-PK')}`
}
export function storageLabel(storage: number) {
  return storage >= 1024 ? `${storage / 1024} TB` : storage ? `${storage} GB` : 'Unspecified'
}
export function ptaLabel(pta: string) {
  return pta === 'approved'
    ? 'PTA approved'
    : pta === 'non-pta'
      ? 'Non-PTA'
      : pta === 'n/a'
        ? 'Not applicable'
        : 'PTA unknown'
}
export function ageLabel(at: string, now = Date.now()) {
  const hours = Math.max(0, (now - Date.parse(at)) / 3600000)
  return hours < 1
    ? 'Just observed'
    : hours < 24
      ? `${Math.floor(hours)}h ago`
      : `${Math.floor(hours / 24)}d ago`
}
export function profitEstimate(
  purchase: number,
  resale: number,
  repairs: number,
  transport: number,
  fees: number,
) {
  const costs = purchase + repairs + transport + (resale * fees) / 100
  return { costs, profit: resale - costs, roi: costs > 0 ? ((resale - costs) / costs) * 100 : 0 }
}
