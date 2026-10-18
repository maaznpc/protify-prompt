import type { Category } from './types'

export interface CatalogModel {
  model: string
  brand: string
  category: Category
  aliases: string[]
}

function family(brand: string, prefix: string, names: string): CatalogModel[] {
  return names.split('|').map((name) => ({
    model: `${prefix}${name}`,
    brand,
    category: 'phones',
    aliases: [],
  }))
}

// Explicit model names, rather than an unbounded generation-number regex. A model
// being supported here does not assert that it is currently listed in any city.
export const deviceCatalog: CatalogModel[] = [
  ...family(
    'Apple',
    'iPhone ',
    '8|8 Plus|X|XR|XS|XS Max|SE 2020|SE 2022|11|11 Pro|11 Pro Max|12|12 Mini|12 Pro|12 Pro Max|13|13 Mini|13 Pro|13 Pro Max|14|14 Plus|14 Pro|14 Pro Max|15|15 Plus|15 Pro|15 Pro Max|16|16 Plus|16 Pro|16 Pro Max|16e',
  ),
  ...family(
    'Samsung',
    'Samsung ',
    'S10|S10 Plus|S10e|S20|S20 Plus|S20 Ultra|S20 FE|S21|S21 Plus|S21 Ultra|S21 FE|S22|S22 Plus|S22 Ultra|S23|S23 Plus|S23 Ultra|S23 FE|S24|S24 Plus|S24 Ultra|S24 FE|S25|S25 Plus|S25 Ultra|A05|A05s|A06|A12|A13|A14|A15|A16|A22|A23|A24|A25|A32|A33|A34|A35|A36|A52|A52s|A53|A54|A55|A56|A72|A73|Note 10|Note 10 Plus|Note 20|Note 20 Ultra|Z Flip 3|Z Flip 4|Z Flip 5|Z Flip 6|Z Fold 3|Z Fold 4|Z Fold 5|Z Fold 6',
  ),
  ...family('Google', 'Pixel ', '4|4 XL|4a|5|5a|6|6a|6 Pro|7|7a|7 Pro|8|8a|8 Pro|9|9 Pro|9 Pro XL'),
  ...family(
    'OnePlus',
    'OnePlus ',
    '7|7 Pro|7T|8|8 Pro|8T|9|9 Pro|9R|10 Pro|10T|11|11R|12|12R|Nord|Nord 2|Nord 2T|Nord 3|Nord 4|Nord CE 2|Nord CE 3|Nord CE 3 Lite|Nord CE 4|Nord CE 4 Lite',
  ),
  ...family(
    'Xiaomi',
    'Xiaomi ',
    'Mi 11|11T|11T Pro|12|12 Lite|12 Pro|12T|12T Pro|13|13 Lite|13 Pro|13T|13T Pro|14|14 Ultra|14T|14T Pro',
  ),
  ...family(
    'Redmi',
    'Redmi ',
    '10|12|13|13C|14C|A2|A3|Note 10|Note 10S|Note 10 Pro|Note 11|Note 11 Pro|Note 12|Note 12 Pro|Note 12 Pro Plus|Note 13|Note 13 Pro|Note 13 Pro Plus|Note 14|Note 14 Pro|Note 14 Pro Plus',
  ),
  ...family(
    'POCO',
    'POCO ',
    'F3|F4|F5|F5 Pro|F6|F6 Pro|X3 NFC|X3 Pro|X4 Pro|X5 Pro|X6|X6 Pro|M3|M4 Pro|M5|M6|M6 Pro',
  ),
  ...family(
    'OPPO',
    'OPPO ',
    'A16|A17|A18|A38|A54|A57|A58|A60|A78|Reno 6|Reno 7|Reno 8|Reno 8T|Reno 10|Reno 11|Reno 12|F19|F21 Pro|F23',
  ),
  ...family(
    'Vivo',
    'Vivo ',
    'Y02|Y03|Y16|Y17s|Y21|Y22|Y27|Y28|Y33s|Y36|Y100|V21|V23|V25|V27|V29|V30|X80|X90',
  ),
  ...family(
    'Realme',
    'Realme ',
    'C21|C25|C30|C35|C51|C53|C55|C61|C63|C65|C67|8|8 Pro|9|9 Pro|10|10 Pro|11|11 Pro|12|12 Plus|12 Pro Plus|GT Master Edition|Narzo 50',
  ),
  ...family(
    'Infinix',
    'Infinix ',
    'Hot 11|Hot 12|Hot 12 Play|Hot 20|Hot 30|Hot 40|Hot 40 Pro|Hot 50|Hot 50 Pro|Note 10 Pro|Note 11|Note 12|Note 30|Note 30 Pro|Note 40|Note 40 Pro|Smart 7|Smart 8|Smart 9|Zero 20|Zero 30',
  ),
  ...family(
    'Tecno',
    'Tecno ',
    'Camon 18|Camon 19|Camon 20|Camon 20 Pro|Camon 30|Camon 30 Pro|Spark 8C|Spark 9|Spark 10|Spark 10 Pro|Spark 20|Spark 20 Pro|Spark 20 Pro Plus|Spark 30|Spark 30 Pro|Pova 4|Pova 5|Pova 5 Pro|Pova 6|Pova 6 Pro|Pop 7|Pop 8',
  ),
  ...family('Nothing', 'Nothing Phone ', '1|2|2a|2a Plus'),
  ...family(
    'Motorola',
    'Motorola ',
    'Edge 20|Edge 30|Edge 30 Pro|Edge 40|Edge 50|Moto G32|Moto G54|Moto G84',
  ),
  ...family('Sony', 'Sony Xperia ', '1 II|1 III|1 IV|5 II|5 III|10 IV'),
  ...family(
    'Huawei',
    'Huawei ',
    'P30|P30 Pro|P40|P40 Pro|Nova 7i|Nova 9|Nova 10|Mate 20 Pro|Mate 30 Pro',
  ),
  ...family('Honor', 'Honor ', 'X7|X8|X8a|X9a|X9b|90|200'),
  ...family('Nokia', 'Nokia ', '6.1|7.2|G21|C32'),
  ...['Air M1', 'Air M2', 'Air M3', 'Pro M1', 'Pro M2', 'Pro M3', 'Pro M4'].map((name) => ({
    model: `MacBook ${name}`,
    brand: 'Apple',
    category: 'laptops' as const,
    aliases: [],
  })),
  ...['U2422H', 'U2520D', 'U2720Q', 'U2722D', 'P2419H', 'P2422H', 'P2722H'].map((name) => ({
    model: `Dell ${name}`,
    brand: 'Dell',
    category: 'monitors' as const,
    aliases: [],
  })),
  ...['27UL500', '27UN850', '27GN800', '27GP850'].map((name) => ({
    model: `LG ${name}`,
    brand: 'LG',
    category: 'monitors' as const,
    aliases: [],
  })),
]

// These families have materially different 4G and 5G hardware. An unspecified
// variant remains reviewable instead of influencing a precise price benchmark.
const networkFamilies = [
  'Samsung A13',
  'Samsung A14',
  'Samsung A15',
  'Samsung A16',
  'Samsung A22',
  'Samsung A23',
  'Samsung A32',
  'Samsung A52',
  'Redmi Note 11 Pro',
  'Redmi Note 12',
  'Redmi Note 12 Pro',
  'Redmi Note 13',
  'Redmi Note 13 Pro',
  'Redmi Note 14',
  'Redmi Note 14 Pro',
  'OPPO A78',
  'OPPO Reno 8',
  'Vivo Y100',
  'Realme 9',
  'Realme 10',
  'Realme 11',
  'Realme 12',
  'POCO M4 Pro',
  'POCO M6 Pro',
]
for (const model of networkFamilies) {
  const entry = deviceCatalog.find((row) => row.model === model)!
  for (const network of ['4G', '5G'])
    deviceCatalog.push({ ...entry, model: `${model} ${network}`, aliases: [] })
}

for (const entry of deviceCatalog) {
  if (entry.brand === 'Samsung') {
    const suffix = entry.model.replace('Samsung ', '')
    entry.aliases.push(`Samsung Galaxy ${suffix}`, `Galaxy ${suffix}`)
    if (/^S\d/.test(suffix)) entry.aliases.push(suffix)
  }
  if (entry.brand === 'Google') entry.aliases.push(`Google ${entry.model}`)
  if (entry.brand === 'Redmi' || entry.brand === 'POCO') entry.aliases.push(`Xiaomi ${entry.model}`)
  if (entry.brand === 'OPPO') entry.aliases.push(entry.model.replace('Reno ', 'Reno'))
  if (entry.model === 'iPhone SE 2020') entry.aliases.push('iPhone SE 2', 'iPhone SE 2nd gen')
  if (entry.model === 'iPhone SE 2022') entry.aliases.push('iPhone SE 3', 'iPhone SE 3rd gen')
  if (entry.brand === 'Motorola' && entry.model.includes('Moto '))
    entry.aliases.push(entry.model.replace('Motorola ', ''))
  if (entry.model === 'OnePlus Nord CE 3 Lite') entry.aliases.push('OnePlus Nord CE 3 Lite 5G')
}

const byName = new Map(deviceCatalog.map((entry) => [entry.model, entry]))
export const phoneBrands = [
  ...new Set(deviceCatalog.filter((e) => e.category === 'phones').map((e) => e.brand)),
]
export const modelCatalog = [
  'iPhone 13',
  ...deviceCatalog.map((e) => e.model).filter((m) => m !== 'iPhone 13'),
]
export const catalogGroups = [...new Set(deviceCatalog.map((e) => e.brand))].map((brand) => ({
  brand,
  models: deviceCatalog.filter((e) => e.brand === brand).map((e) => e.model),
}))
export function brandForModel(model: string): string {
  return (
    byName.get(model)?.brand || (/^MacBook|^iPhone/.test(model) ? 'Apple' : model.split(' ')[0])
  )
}
export function categoryForModel(model: string): Category {
  return byName.get(model)?.category || 'other'
}
export function requiresNetworkVariant(model: string) {
  return networkFamilies.includes(model)
}

function modelText(text: string) {
  return text
    .toLowerCase()
    .replace(/\b1\s*\+\s*(?=\d)/g, 'oneplus ')
    .replace(/\bip(?=\s*\d)/g, 'iphone')
    .replace(/i\s*phone/g, 'iphone')
    .replace(/\bone\s*plus\b/g, 'oneplus')
    .replace(/\+/g, ' plus ')
    .replace(/([a-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([a-z])/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
const matchers = deviceCatalog
  .flatMap((entry) =>
    [entry.model, ...entry.aliases].map((alias) => {
      const text = modelText(alias)
      return {
        entry,
        pattern: new RegExp(`\\b${text.replaceAll(' ', '\\s*')}\\b`, 'i'),
        specificity: text.length,
      }
    }),
  )
  .sort((a, b) => b.specificity - a.specificity)

const titleCache = new Map<string, CatalogModel | null>()
function remember(text: string, entry: CatalogModel | null) {
  if (titleCache.size >= 2000) titleCache.delete(titleCache.keys().next().value!)
  titleCache.set(text, entry)
  return entry
}
export function findCatalogModel(raw: string): CatalogModel | null {
  const text = modelText(raw)
  if (titleCache.has(text)) return titleCache.get(text)!
  for (const { entry, pattern } of matchers) {
    const match = pattern.exec(text)
    if (!match) continue
    const remaining = text.slice(match.index + match[0].length).trimStart()
    // Never silently turn an unsupported suffix into the cheaper base model.
    if (/^(?:pro|max|mini|plus|ultra|fe|lite|xl|nfc|play|prime|fold|flip)\b/.test(remaining))
      continue
    if (requiresNetworkVariant(entry.model) && /^(?:4\s*g|5\s*g)\b/.test(remaining)) continue
    return remember(text, entry)
  }
  return remember(text, null)
}
