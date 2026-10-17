import { z } from 'zod'

export const cities = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Other',
] as const
export const conditions = ['excellent', 'good', 'fair', 'parts', 'unknown'] as const
export const ptaStatuses = ['approved', 'non-pta', 'unknown', 'n/a'] as const
export type City = (typeof cities)[number]
export type Condition = (typeof conditions)[number]
export type PtaStatus = (typeof ptaStatuses)[number]
export type Category = 'phones' | 'laptops' | 'monitors' | 'other'
export type Mode = 'sample' | 'personal'
export type Page = 'overview' | 'listings' | 'watchlist' | 'alerts' | 'data'

const safeText = z.string().max(2000)
export const observationSchema = z.object({
  at: z.string().datetime(),
  price: z.number().finite().min(1000).max(10000000),
})
export const listingSchema = z.object({
  id: z.string().min(1).max(100),
  title: safeText.min(3),
  model: z.string().min(1).max(100),
  category: z.enum(['phones', 'laptops', 'monitors', 'other']),
  storage: z.number().int().min(0).max(8192),
  pta: z.enum(ptaStatuses),
  condition: z.enum(conditions),
  city: z.enum(cities),
  source: z.string().max(80),
  seller: z.string().max(100),
  url: z
    .string()
    .max(2000)
    .refine((v) => !v || /^https?:\/\//i.test(v), 'Use an http or https listing URL'),
  firstSeen: z.string().datetime(),
  observations: z.array(observationSchema).min(1).max(2000),
  warnings: z.array(z.string().max(200)).max(20),
})
export type Listing = z.infer<typeof listingSchema>
export type Observation = z.infer<typeof observationSchema>
export const ruleSchema = z.object({
  id: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  city: z.string().max(30),
  budget: z.number().finite().min(1000).max(10000000),
  storage: z.number().int().min(0).max(8192),
  pta: z.enum(ptaStatuses),
  enabled: z.boolean(),
  minDiscount: z.number().finite().min(0).max(45).default(0),
})
export type AlertRule = z.infer<typeof ruleSchema>
const workspaceObjectSchema = z.object({
  version: z.literal(1),
  mode: z.enum(['sample', 'personal']),
  listings: z.array(listingSchema).max(5000),
  saved: z.array(z.string().max(100)).max(5000),
  rules: z.array(ruleSchema).max(100),
  sampleSaved: z.array(z.string().max(100)).max(5000),
  sampleRules: z.array(ruleSchema).max(100),
  sampleAnchor: z.string().datetime(),
})
export const workspaceSchema = workspaceObjectSchema.refine(
  (workspace) =>
    new Set(workspace.listings.map((l) => l.id)).size === workspace.listings.length &&
    new Set(workspace.rules.map((r) => r.id)).size === workspace.rules.length &&
    new Set(workspace.sampleRules.map((r) => r.id)).size === workspace.sampleRules.length,
  'Listing and alert identifiers must be unique.',
)
export type Workspace = z.infer<typeof workspaceSchema>
export interface RawListing {
  title: string
  price?: string | number
  city?: string
  source?: string
  seller?: string
  url?: string
  observed_at?: string
  condition?: string
  pta?: string
  storage?: string | number
}
export interface Estimate {
  median: number | null
  low: number | null
  high: number | null
  count: number
  excluded: number
  confidence: 'strong' | 'moderate' | 'limited'
  discount: number | null
  reason: string
}
