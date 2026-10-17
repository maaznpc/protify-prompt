import type { Listing, Workspace } from './types'
import { DAY } from './analytics'
import { normalize } from './normalize'

export const modelCatalog = [
  'iPhone 13',
  'iPhone 12 Pro',
  'iPhone 14 Pro',
  'Samsung S23',
  'Pixel 7',
  'MacBook Air M1',
  'Dell U2720Q',
]

export function createWorkspace(): Workspace {
  return {
    version: 1,
    mode: 'sample',
    listings: [],
    saved: [],
    rules: [],
    sampleSaved: [],
    sampleRules: [],
    sampleAnchor: new Date().toISOString(),
  }
}
export function sampleListings(anchor: string): Listing[] {
  const now = Date.parse(anchor)
  const specs = [
    { model: 'iPhone 13', storage: 128, price: 117000, pta: 'approved' },
    { model: 'iPhone 12 Pro', storage: 256, price: 113000, pta: 'approved' },
    { model: 'iPhone 14 Pro', storage: 256, price: 171000, pta: 'non-pta' },
    { model: 'Samsung S23', storage: 256, price: 139000, pta: 'approved' },
    { model: 'Pixel 7', storage: 128, price: 72000, pta: 'approved' },
    { model: 'MacBook Air M1', storage: 256, price: 172000, pta: 'n/a' },
    { model: 'Dell U2720Q', storage: 0, price: 93000, pta: 'n/a' },
  ]
  const listings: Listing[] = []
  const offsets = [-0.18, -0.13, -0.04, -0.02, 0, 0.01, 0.02, 0.04, 0.06, 0.09, 0.15, 0.7]
  for (const [group, spec] of specs.entries()) {
    for (let i = 0; i < 12; i++) {
      const observed = new Date(now - (i * 0.7 + group * 0.3 + 0.2) * 3600000)
      const price = Math.round((spec.price * (1 + offsets[i])) / 500) * 500
      const title = `${spec.model}${spec.storage ? ' ' + spec.storage + 'GB' : ' 27 inch 4K'} ${spec.pta === 'approved' ? 'PTA approved ' : spec.pta === 'non-pta' ? 'non-PTA ' : ''}${i % 2 ? 'clean condition, box available' : 'good condition, personal use'}`
      const listing = normalize(
        {
          title,
          price,
          city: 'Lahore',
          condition: 'good',
          pta: spec.pta,
          source: ['OLX', 'Community group', 'Local shop'][i % 3],
          seller: `Sample seller ${group * 12 + i + 1}`,
        },
        observed,
      )
      listing.id = `sample-${group}-${i}`
      listing.firstSeen = new Date(now - 91 * DAY).toISOString()
      listing.observations = Array.from({ length: 14 }, (_, j) => {
        const daysAgo = 91 - j * 7
        const adjustment = (daysAgo / 91) * 0.075 + Math.sin(j * 1.8 + group) * 0.008
        return {
          at: new Date(observed.getTime() - daysAgo * DAY).toISOString(),
          price: Math.round((price * (1 + adjustment)) / 500) * 500,
        }
      })
      listings.push(listing)
    }
  }
  // A few other cities and variants make the importance of exact comparisons visible.
  for (const city of ['Karachi', 'Islamabad']) {
    for (let i = 0; i < 7; i++) {
      const listing = normalize(
        {
          title: 'iPhone 13 128gb PTA approved good condition',
          price: 112000 + i * 2000,
          city,
          seller: `Sample ${city} seller ${i}`,
          source: 'Community group',
        },
        new Date(now - i * 3600000),
      )
      listing.id = `sample-${city}-${i}`
      listings.push(listing)
    }
  }
  listings.push(
    normalize(
      {
        title: 'iPhone 13 128gb non-pta good condition',
        price: 69000,
        city: 'Lahore',
        seller: 'Sample non-PTA seller',
        source: 'OLX',
      },
      new Date(now - 2 * 3600000),
    ),
  )
  listings.push(
    normalize(
      {
        title: 'iPhone 13 128gb PTA approved broken for parts',
        price: 27000,
        city: 'Lahore',
        seller: 'Sample repair seller',
        source: 'OLX',
      },
      new Date(now - 3 * 3600000),
    ),
  )
  return listings
}
