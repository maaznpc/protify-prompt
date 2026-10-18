import { findCatalogModel, requiresNetworkVariant } from './catalog'
import {
  cities,
  conditions,
  ptaStatuses,
  type Listing,
  type RawListing,
  type Category,
  type PtaStatus,
  type Condition,
  type City,
} from './types'

export function hash(value: string) {
  let result = 2166136261,
    second = 2654435769
  for (let i = 0; i < value.length; i++) {
    result = Math.imul(result ^ value.charCodeAt(i), 16777619)
    second = Math.imul(second ^ value.charCodeAt(i), 2246822519)
  }
  return (result >>> 0).toString(36).padStart(7, '0') + (second >>> 0).toString(36).padStart(7, '0')
}

export function identifyModel(raw: string): { model: string; category: Category } {
  const catalogModel = findCatalogModel(raw)
  if (catalogModel) return { model: catalogModel.model, category: catalogModel.category }
  const text = raw.toLowerCase()
  const mac = text.match(/\bmac\s*book\s*(air|pro)\b.*?\b(m[1-4])\b/)
  if (mac)
    return { model: `MacBook ${capitalize(mac[1])} ${mac[2].toUpperCase()}`, category: 'laptops' }
  const dell = text.match(/\bdell\s*(?:ultrasharp\s*)?([up][2-4]\d{3}[a-z]{0,3})\b/)
  if (dell) return { model: `Dell ${dell[1].toUpperCase()}`, category: 'monitors' }
  const lg = text.match(/\blg\s*(\d{2}(?:un|ul|uk|gn|gp)\d{3}[a-z]?(?:-b)?)\b/)
  if (lg) return { model: `LG ${lg[1].toUpperCase()}`, category: 'monitors' }
  return { model: 'Unrecognized model', category: 'other' }
}

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

export function parsePrice(raw: string | number | undefined): number {
  if (typeof raw === 'number') return raw
  if (!raw) return NaN
  const text = raw
    .toLowerCase()
    .replace(/(?:pkr|rs\.?|rupees)/g, '')
    .replace(/,/g, '')
    .trim()
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(k|lac|lakh|lacs|lakhs)?\s*\/?-?$/)
  if (!match) return NaN
  const multiplier = match[2] === 'k' ? 1000 : match[2] ? 100000 : 1
  return Math.round(Number(match[1]) * multiplier)
}

export function safeUrl(raw = ''): string {
  if (!raw.trim()) return ''
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''
    if (url.username || url.password) return ''
    url.hash = ''
    for (const key of [...url.searchParams.keys()])
      if (key.startsWith('utm_') || ['fbclid', 'gclid'].includes(key)) url.searchParams.delete(key)
    url.searchParams.sort()
    return url.href
  } catch {
    return ''
  }
}

export function normalize(raw: RawListing, now = new Date()): Listing {
  const title = String(raw.title || '')
    .trim()
    .replace(/\s+/g, ' ')
  if (title.length < 3 || title.length > 500)
    throw new Error('Title must be between 3 and 500 characters.')
  const text = title.toLowerCase()
  const identified = identifyModel(title)
  const warnings: string[] = []
  const price = parsePrice(raw.price)
  if (!Number.isFinite(price) || price < 1000 || price > 10000000)
    throw new Error('Enter a full asking price between Rs 1,000 and Rs 10,000,000.')
  const time = raw.observed_at ? new Date(raw.observed_at) : now
  if (!Number.isFinite(time.getTime()) || time.getTime() > now.getTime() + 60000)
    throw new Error('Observation date must be valid and cannot be in the future.')
  let storage = Number(raw.storage) || 0
  if (!storage) {
    const tb = text.match(/\b([1248])\s*tb\b/)
    const gb = [...text.matchAll(/\b(32|64|128|256|512|1024|2048)\s*(?:gb|g)\b/g)]
    storage = tb ? Number(tb[1]) * 1024 : gb.length ? Math.max(...gb.map((m) => Number(m[1]))) : 0
    if (!storage && identified.category === 'phones')
      storage = Number(text.match(/\b(64|128|256|512)\b/)?.[1] || 0)
  }
  if (!Number.isInteger(storage) || storage < 0 || storage > 8192)
    throw new Error('Storage must be between 0 and 8192 GB.')
  const nonPta =
    /\b(?:non[\s-]*pta|not\s+pta|pta\s*(?:not\s+approved|blocked|unapproved)|jv|sim\s*locked|bypass)\b/.test(
      text,
    )
  const approved = /\b(?:pta[\s-]*approved|pta[\s-]*ok|official(?:ly)?\s+approved)\b/.test(text)
  let pta: PtaStatus =
    identified.category === 'phones'
      ? nonPta
        ? 'non-pta'
        : approved
          ? 'approved'
          : 'unknown'
      : 'n/a'
  if (raw.pta && ptaStatuses.includes(raw.pta as PtaStatus)) pta = raw.pta as PtaStatus
  if (
    (nonPta && approved) ||
    (nonPta && raw.pta === 'approved') ||
    (approved && raw.pta === 'non-pta')
  ) {
    pta = 'unknown'
    warnings.push('Conflicting PTA claims')
  }
  if (identified.category === 'phones' && pta === 'n/a') pta = 'unknown'
  if (identified.category !== 'phones') pta = 'n/a'
  const conditionText = text.replace(/\b(?:no|without)\s+(?:scratches|dents|faults|cracks)\b/g, '')
  let condition: Condition =
    /\b(?:parts?\s*(?:only|phone)|for\s+(?:parts|repair)|broken|dead|faulty|not\s+working|panel\s+broken|cracked|face\s*id\s*(?:off|not\s+working))\b/.test(
      conditionText,
    )
      ? 'parts'
      : /\b(?:mint|pristine|like\s*new|excellent|lush)\b|\b(?:9|10)\/10\b/.test(conditionText)
        ? 'excellent'
        : /\b(?:fair|scratches|scratched|dents|worn)\b|\b[56]\/10\b/.test(conditionText)
          ? 'fair'
          : /\b(?:good|clean|working|used)\b|\b[78]\/10\b/.test(conditionText)
            ? 'good'
            : 'unknown'
  const detectedParts = condition === 'parts'
  if (!detectedParts && raw.condition && conditions.includes(raw.condition as Condition))
    condition = raw.condition as Condition
  if (
    /\b(?:wanted|want\s+to\s+buy|wtb|looking\s+for|installments?|monthly|advance\s+payment|down\s*payment|case\s+only|box\s+only|cover\s+only)\b/.test(
      text,
    )
  )
    warnings.push('Wanted, accessory, or partial-payment listing')
  if (identified.category === 'other') warnings.push('Model needs review')
  if (requiresNetworkVariant(identified.model)) warnings.push('4G/5G variant not specified')
  if ((identified.category === 'phones' || identified.category === 'laptops') && !storage)
    warnings.push('Storage not specified')
  if (condition === 'unknown') warnings.push('Condition not specified')
  if (pta === 'unknown' && identified.category === 'phones')
    warnings.push('PTA status not specified')
  if (condition === 'parts') warnings.push('Parts or repair listing')
  const rawCity = String(raw.city || '')
    .trim()
    .toLowerCase()
  const city =
    cities.find((c) => c.toLowerCase() === rawCity) ||
    (
      { lhr: 'Lahore', khi: 'Karachi', isb: 'Islamabad', rwp: 'Rawalpindi' } as Record<string, City>
    )[rawCity] ||
    'Other'
  if (city === 'Other') warnings.push('City needs review')
  const url = safeUrl(raw.url)
  if (raw.url && !url) warnings.push('Invalid listing URL removed')
  const seller = String(raw.seller || '')
    .trim()
    .slice(0, 100)
  const source = String(raw.source || 'Manual entry')
    .trim()
    .slice(0, 80)
  const identity =
    url ||
    [
      source.toLowerCase(),
      seller.toLowerCase(),
      city,
      title.toLowerCase().replace(/[^a-z0-9]/g, ''),
      seller ? '' : price,
    ].join('|')
  return {
    id: 'l-' + hash(identity),
    title,
    ...identified,
    storage,
    pta,
    condition,
    city,
    source,
    seller,
    url,
    firstSeen: time.toISOString(),
    observations: [{ at: time.toISOString(), price }],
    warnings,
  }
}

export function mergeListings(existing: Listing[], incoming: Listing[]) {
  const map = new Map(existing.map((l) => [l.id, l]))
  let added = 0,
    updated = 0,
    duplicates = 0
  for (const listing of incoming) {
    const old = map.get(listing.id)
    if (!old) {
      map.set(listing.id, listing)
      added++
      continue
    }
    if (
      old.observations.some((o) =>
        listing.observations.some((n) => n.at === o.at && n.price === o.price),
      )
    ) {
      duplicates++
      continue
    }
    const observations = [...old.observations, ...listing.observations]
      .filter((o, i, all) => all.findIndex((a) => a.at === o.at && a.price === o.price) === i)
      .sort((a, b) => a.at.localeCompare(b.at))
      .slice(-2000)
    map.set(listing.id, {
      ...old,
      ...listing,
      firstSeen: old.firstSeen < listing.firstSeen ? old.firstSeen : listing.firstSeen,
      observations,
    })
    updated++
  }
  if (map.size > 5000)
    throw new Error(
      'This workspace supports 5,000 listings. Export a backup before starting a new workspace.',
    )
  return { listings: [...map.values()], added, updated, duplicates }
}
