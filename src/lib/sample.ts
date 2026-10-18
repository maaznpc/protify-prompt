import type { Listing, Workspace } from './types'
import { DAY } from './analytics'
import { normalize } from './normalize'

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
    { model: 'iPhone 8', storage: 64, price: 38000, pta: 'approved' },
    { model: 'iPhone XR', storage: 128, price: 57000, pta: 'approved' },
    { model: 'iPhone XS Max', storage: 256, price: 74000, pta: 'approved' },
    { model: 'iPhone SE 2020', storage: 64, price: 43000, pta: 'approved' },
    { model: 'iPhone 11', storage: 128, price: 79000, pta: 'approved' },
    { model: 'iPhone 11 Pro Max', storage: 256, price: 105000, pta: 'approved' },
    { model: 'iPhone 12', storage: 128, price: 95000, pta: 'approved' },
    { model: 'iPhone 13 Pro', storage: 256, price: 152000, pta: 'approved' },
    { model: 'iPhone 13 Pro Max', storage: 256, price: 168000, pta: 'approved' },
    { model: 'iPhone 14', storage: 128, price: 148000, pta: 'approved' },
    { model: 'iPhone 15', storage: 128, price: 188000, pta: 'approved' },
    { model: 'iPhone 15 Pro', storage: 256, price: 265000, pta: 'approved' },
    { model: 'iPhone 16', storage: 128, price: 252000, pta: 'approved' },
    { model: 'iPhone 16 Pro', storage: 256, price: 335000, pta: 'approved' },
    { model: 'iPhone 16e', storage: 128, price: 206000, pta: 'approved' },
    { model: 'Samsung S21 FE', storage: 128, price: 76000, pta: 'approved' },
    { model: 'Samsung S22 Ultra', storage: 256, price: 165000, pta: 'approved' },
    { model: 'Samsung S24 Ultra', storage: 256, price: 275000, pta: 'approved' },
    { model: 'Samsung S25', storage: 256, price: 250000, pta: 'approved' },
    { model: 'Samsung A05s', storage: 128, price: 26000, pta: 'approved' },
    { model: 'Samsung A15 4G', storage: 128, price: 37000, pta: 'approved' },
    { model: 'Samsung A15 5G', storage: 128, price: 44000, pta: 'approved' },
    { model: 'Samsung A35', storage: 128, price: 74000, pta: 'approved' },
    { model: 'Samsung A54', storage: 256, price: 88000, pta: 'approved' },
    { model: 'Samsung A55', storage: 256, price: 110000, pta: 'approved' },
    { model: 'Samsung Z Flip 5', storage: 256, price: 142000, pta: 'approved' },
    { model: 'Pixel 5', storage: 128, price: 43000, pta: 'approved' },
    { model: 'Pixel 6a', storage: 128, price: 52000, pta: 'approved' },
    { model: 'Pixel 7 Pro', storage: 128, price: 94000, pta: 'approved' },
    { model: 'Pixel 8', storage: 128, price: 112000, pta: 'approved' },
    { model: 'Pixel 8a', storage: 128, price: 97000, pta: 'approved' },
    { model: 'Pixel 9 Pro', storage: 256, price: 188000, pta: 'approved' },
    { model: 'OnePlus 8T', storage: 128, price: 58000, pta: 'approved' },
    { model: 'OnePlus 9 Pro', storage: 256, price: 82000, pta: 'approved' },
    { model: 'OnePlus 11', storage: 256, price: 128000, pta: 'approved' },
    { model: 'OnePlus 12R', storage: 256, price: 145000, pta: 'approved' },
    { model: 'OnePlus Nord CE 3 Lite', storage: 128, price: 42000, pta: 'approved' },
    { model: 'Xiaomi 11T', storage: 128, price: 65000, pta: 'approved' },
    { model: 'Xiaomi 13T', storage: 256, price: 116000, pta: 'approved' },
    { model: 'Xiaomi 14', storage: 256, price: 194000, pta: 'approved' },
    { model: 'Redmi Note 10 Pro', storage: 128, price: 41000, pta: 'approved' },
    { model: 'Redmi Note 12 4G', storage: 128, price: 39000, pta: 'approved' },
    { model: 'Redmi Note 13 4G', storage: 128, price: 46000, pta: 'approved' },
    { model: 'Redmi Note 13 Pro 5G', storage: 256, price: 82000, pta: 'approved' },
    { model: 'Redmi Note 14 4G', storage: 128, price: 52000, pta: 'approved' },
    { model: 'Redmi 13C', storage: 128, price: 24000, pta: 'approved' },
    { model: 'POCO F3', storage: 128, price: 52000, pta: 'approved' },
    { model: 'POCO F5', storage: 256, price: 85000, pta: 'approved' },
    { model: 'POCO X6 Pro', storage: 256, price: 92000, pta: 'approved' },
    { model: 'OPPO A17', storage: 64, price: 23000, pta: 'approved' },
    { model: 'OPPO A58', storage: 128, price: 38000, pta: 'approved' },
    { model: 'OPPO Reno 8 4G', storage: 128, price: 54000, pta: 'approved' },
    { model: 'OPPO Reno 11', storage: 256, price: 94000, pta: 'approved' },
    { model: 'Vivo Y21', storage: 64, price: 24000, pta: 'approved' },
    { model: 'Vivo Y36', storage: 128, price: 41000, pta: 'approved' },
    { model: 'Vivo V29', storage: 256, price: 90000, pta: 'approved' },
    { model: 'Vivo V30', storage: 256, price: 111000, pta: 'approved' },
    { model: 'Realme C53', storage: 128, price: 30000, pta: 'approved' },
    { model: 'Realme C67', storage: 128, price: 43000, pta: 'approved' },
    { model: 'Realme 9 Pro', storage: 128, price: 51000, pta: 'approved' },
    { model: 'Realme 12 Pro Plus', storage: 256, price: 97000, pta: 'approved' },
    { model: 'Infinix Smart 8', storage: 64, price: 18000, pta: 'approved' },
    { model: 'Infinix Hot 40', storage: 128, price: 29000, pta: 'approved' },
    { model: 'Infinix Note 30', storage: 256, price: 39000, pta: 'approved' },
    { model: 'Infinix Note 40 Pro', storage: 256, price: 59000, pta: 'approved' },
    { model: 'Tecno Spark 20', storage: 128, price: 27000, pta: 'approved' },
    { model: 'Tecno Camon 20', storage: 256, price: 38000, pta: 'approved' },
    { model: 'Tecno Camon 30', storage: 256, price: 52000, pta: 'approved' },
    { model: 'Tecno Pova 5', storage: 256, price: 34000, pta: 'approved' },
    { model: 'Nothing Phone 1', storage: 128, price: 73000, pta: 'approved' },
    { model: 'Nothing Phone 2a', storage: 256, price: 98000, pta: 'approved' },
    { model: 'Motorola Edge 30', storage: 128, price: 54000, pta: 'approved' },
    { model: 'Motorola Moto G54', storage: 128, price: 39000, pta: 'approved' },
    { model: 'Sony Xperia 5 III', storage: 128, price: 62000, pta: 'approved' },
    { model: 'Huawei P30 Pro', storage: 128, price: 66000, pta: 'approved' },
    { model: 'Honor X9b', storage: 256, price: 83000, pta: 'approved' },
    { model: 'Nokia G21', storage: 128, price: 23000, pta: 'approved' },
  ]
  const listings: Listing[] = []
  const offsets = [-0.18, -0.13, -0.04, -0.02, 0, 0.01, 0.02, 0.04, 0.06, 0.09, 0.15, 0.7]
  for (const [group, spec] of specs.entries()) {
    for (const city of ['Lahore', 'Karachi', 'Islamabad'] as const) {
      const cityFactor = city === 'Karachi' ? 0.96 : city === 'Islamabad' ? 1.045 : 1
      const count = city === 'Lahore' ? 12 : 8
      for (let i = 0; i < count; i++) {
        const observed = new Date(now - (i * 0.7 + group * 0.3 + 0.2) * 3600000)
        const price = Math.round((spec.price * cityFactor * (1 + offsets[i])) / 500) * 500
        const title = `${spec.model}${spec.storage ? ' ' + spec.storage + 'GB' : ' 27 inch 4K'} ${spec.pta === 'approved' ? 'PTA approved ' : spec.pta === 'non-pta' ? 'non-PTA ' : ''}${i % 2 ? 'clean condition, box available' : 'good condition, personal use'}`
        const listing = normalize(
          {
            title,
            price,
            city,
            condition: 'good',
            pta: spec.pta,
            source: ['OLX', 'Community group', 'Local shop'][i % 3],
            seller: `Sample ${city} seller ${group * 12 + i + 1}`,
          },
          observed,
        )
        // Keep the original demo identifiers so existing sample bookmarks survive.
        listing.id =
          city === 'Lahore'
            ? `sample-${group}-${i}`
            : group === 0
              ? `sample-${city}-${i}`
              : `sample-${city}-${group}-${i}`
        listing.firstSeen = new Date(now - 95 * DAY).toISOString()
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
