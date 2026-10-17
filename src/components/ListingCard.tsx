import { ArrowDownRight, ArrowUpRight, Bookmark, Check, MapPin, Minus } from 'lucide-react'
import { ageLabel, latest, money, ptaLabel, signal, storageLabel } from '../lib/analytics'
import type { Estimate, Listing } from '../lib/types'
import { DeviceArt } from './DeviceArt'

export const signalLabels = {
  deal: 'Below market',
  fair: 'Fairly priced',
  above: 'Above market',
  review: 'Needs review',
  limited: 'More data needed',
  stale: 'Older observation',
}

export function ListingCard({
  listing,
  comparison,
  saved,
  onSave,
  onOpen,
  compact = false,
}: {
  listing: Listing
  comparison: Estimate
  saved: boolean
  onSave: () => void
  onOpen: () => void
  compact?: boolean
}) {
  const status = signal(listing, comparison),
    observation = latest(listing)
  return (
    <article className={`listing-card ${compact ? 'listing-compact' : ''}`}>
      <div className="listing-image">
        <button
          className="art-open"
          onClick={onOpen}
          aria-label={`Inspect ${listing.model} listing`}
        >
          <DeviceArt listing={listing} />
        </button>
        <span className={`signal-badge signal-${status}`}>
          {status === 'deal' ? (
            <ArrowDownRight size={13} />
          ) : status === 'fair' ? (
            <Check size={12} />
          ) : null}
          {signalLabels[status]}
        </span>
        <button
          className={`save-button ${saved ? 'is-saved' : ''}`}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${listing.model} listing`}
          aria-pressed={saved}
          onClick={onSave}
        >
          <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="listing-body">
        <div className="listing-source">
          <span>{listing.source}</span>
          <span>{observation ? ageLabel(observation.at) : 'No current observation'}</span>
        </div>
        <button className="listing-title" onClick={onOpen}>
          {listing.model}
        </button>
        <p className="listing-spec">
          {listing.storage ? storageLabel(listing.storage) + ' · ' : ''}
          {listing.category === 'phones'
            ? ptaLabel(listing.pta)
            : listing.category === 'monitors'
              ? 'Monitor'
              : 'Laptop'}{' '}
          · <span className="capitalize">{listing.condition}</span>
        </p>
        <div className="listing-price-row">
          <strong>{money(observation?.price ?? null)}</strong>
          <span className="listing-location">
            <MapPin size={12} />
            {listing.city}
          </span>
        </div>
        <div className={`comparison-line comparison-${status}`}>
          {comparison.discount !== null &&
          status !== 'limited' &&
          status !== 'review' &&
          status !== 'stale' ? (
            <>
              <span>
                {comparison.discount >= 0 ? (
                  <ArrowDownRight size={14} />
                ) : (
                  <ArrowUpRight size={14} />
                )}
                {Math.abs(comparison.discount).toFixed(0)}%{' '}
                {comparison.discount >= 0 ? 'below' : 'above'} median
              </span>
              <span>{money(comparison.median, true)}</span>
            </>
          ) : (
            <>
              <span>
                <Minus size={13} />
                {status === 'review'
                  ? 'Check listing details'
                  : status === 'stale'
                    ? 'Observe again to refresh'
                    : `${comparison.count} comparable${comparison.count === 1 ? '' : 's'}`}
              </span>
              <span>
                View details <ArrowUpRight size={12} />
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
