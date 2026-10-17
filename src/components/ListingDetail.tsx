import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bookmark,
  Calculator,
  CheckCircle2,
  Info,
  MapPin,
  Trash2,
} from 'lucide-react'
import { Modal } from './Modal'
import { DeviceArt } from './DeviceArt'
import {
  estimate,
  latest,
  money,
  profitEstimate,
  ptaLabel,
  signal,
  storageLabel,
} from '../lib/analytics'
import { safeUrl } from '../lib/normalize'
import type { Listing } from '../lib/types'
import { signalLabels } from './ListingCard'

export function ListingDetail({
  listing,
  listings,
  sample,
  saved,
  onSave,
  onClose,
  onUpdate,
  onDelete,
}: {
  listing: Listing
  listings: Listing[]
  sample: boolean
  saved: boolean
  onSave: () => void
  onClose: () => void
  onUpdate: (listing: Listing) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const comparison = useMemo(() => estimate(listing, listings), [listing, listings])
  const current = latest(listing),
    status = signal(listing, comparison)
  const [resale, setResale] = useState(comparison.low || current?.price || 0),
    [repairs, setRepairs] = useState(0),
    [transport, setTransport] = useState(1500),
    [fees, setFees] = useState(0)
  const [newPrice, setNewPrice] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false)
  const profit = profitEstimate(current?.price || 0, resale, repairs, transport, fees)
  const url = safeUrl(listing.url)
  return (
    <Modal
      title="A closer look"
      description={
        sample
          ? 'Illustrative listing · sample data, not an offer for sale'
          : 'Your saved observation · asking price, not a confirmed sale'
      }
      onClose={onClose}
      wide
    >
      <div className="detail-top">
        <div className="detail-art">
          <DeviceArt listing={listing} large />
          <span className={`signal-badge signal-${status}`}>{signalLabels[status]}</span>
        </div>
        <div className="detail-heading">
          <span className="section-eyebrow">{listing.source}</span>
          <h3>{listing.model}</h3>
          <p>
            {listing.storage ? storageLabel(listing.storage) + ' · ' : ''}
            {listing.category === 'phones'
              ? ptaLabel(listing.pta)
              : listing.category === 'monitors'
                ? 'Monitor'
                : 'Laptop'}{' '}
            · <span className="capitalize">{listing.condition}</span>
          </p>
          <span className="location">
            <MapPin size={14} />
            {listing.city}
          </span>
          <strong className="detail-price">{money(current?.price ?? null)}</strong>
          <div className="detail-buttons">
            <button className={`button ${saved ? 'saved-button' : 'secondary'}`} onClick={onSave}>
              <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved to watchlist' : 'Save listing'}
            </button>
            {url && !sample && (
              <a className="button primary" href={url} target="_blank" rel="noopener noreferrer">
                View source
                <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="detail-sections">
        <section className="detail-benchmark">
          <div className="section-title">
            <h3>Your price context</h3>
            <span className={`confidence confidence-${comparison.confidence}`}>
              {comparison.confidence} evidence
            </span>
          </div>
          <div className="benchmark-values">
            <div>
              <span>Comparable median</span>
              <strong>{money(comparison.median)}</strong>
            </div>
            <div>
              <span>Middle 50% of prices</span>
              <strong>
                {comparison.low !== null
                  ? `${money(comparison.low, true)} – ${money(comparison.high, true)}`
                  : 'Not enough data'}
              </strong>
            </div>
          </div>
          <p className="context-explanation">
            <Info size={15} />
            {comparison.reason}
          </p>
          {comparison.discount !== null && (
            <div className={`price-verdict ${status === 'deal' ? 'verdict-deal' : ''}`}>
              {status === 'deal' ? <CheckCircle2 size={17} /> : <Info size={17} />}
              <span>
                {Math.abs(comparison.discount).toFixed(1)}%{' '}
                {comparison.discount >= 0 ? 'below' : 'above'} the comparable median.
                {status === 'deal'
                  ? ' Worth a closer look; verify the device in person.'
                  : status === 'review'
                    ? ' Unusually low. Check the details before treating it as a deal.'
                    : ' Asking prices are a guide, not a resale guarantee.'}
              </span>
            </div>
          )}
          {listing.warnings.length > 0 && (
            <div className="warning-box">
              <strong>Details to review</strong>
              <ul>
                {listing.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section>
          <h3 className="detail-section-title">Original listing</h3>
          <blockquote className="raw-title">“{listing.title}”</blockquote>
          <p className="muted small">
            {listing.seller ? `Seller reference: ${listing.seller} · ` : ''}First observed{' '}
            {new Date(listing.firstSeen).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </section>
        <section className="calculator">
          <div className="section-title">
            <h3>
              <Calculator size={17} />
              Run the numbers
            </h3>
            <span className="small muted">Optional resale estimate</span>
          </div>
          <p className="muted small">
            Start conservatively. The default uses the lower quartile of asking prices, which may
            still exceed a final sale price.
          </p>
          <div className="calculator-inputs">
            <label className="field">
              Expected resale (Rs)
              <input
                type="number"
                min="0"
                max="10000000"
                value={resale}
                onChange={(e) => setResale(Math.max(0, Math.min(10000000, Number(e.target.value))))}
              />
            </label>
            <label className="field">
              Repairs (Rs)
              <input
                type="number"
                min="0"
                max="10000000"
                value={repairs}
                onChange={(e) =>
                  setRepairs(Math.max(0, Math.min(10000000, Number(e.target.value))))
                }
              />
            </label>
            <label className="field">
              Transport (Rs)
              <input
                type="number"
                min="0"
                max="10000000"
                value={transport}
                onChange={(e) =>
                  setTransport(Math.max(0, Math.min(10000000, Number(e.target.value))))
                }
              />
            </label>
            <label className="field">
              Selling fees (%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={fees}
                onChange={(e) => setFees(Math.max(0, Math.min(100, Number(e.target.value))))}
              />
            </label>
          </div>
          <div className="profit-result">
            <div>
              <span>Estimated net {profit.profit < 0 ? 'loss' : 'profit'}</span>
              <strong className={profit.profit < 0 ? 'text-orange' : 'text-green'}>
                {money(profit.profit)}
              </strong>
            </div>
            <p>
              {profit.roi.toFixed(1)}% return on total cost
              <br />
              <small>{money(profit.costs)} total cost, including fees</small>
            </p>
          </div>
        </section>
        <section>
          <h3 className="detail-section-title">
            Recorded price history{' '}
            <span className="count-label">{listing.observations.length}</span>
          </h3>
          <div className="history-list">
            {[...listing.observations]
              .sort((a, b) => b.at.localeCompare(a.at))
              .slice(0, 6)
              .map((o, i) => (
                <div key={`${o.at}-${i}`}>
                  <span>
                    {new Date(o.at).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <strong>{money(o.price)}</strong>
                </div>
              ))}
          </div>
          {listing.observations.length > 6 && (
            <p className="small muted">
              Showing the latest 6 observations. A CSV export includes the full history.
            </p>
          )}
          {!sample && (
            <form
              className="record-price"
              onSubmit={async (event) => {
                event.preventDefault()
                setError('')
                const price = Number(newPrice)
                if (!Number.isFinite(price) || price < 1000 || price > 10000000) {
                  setError('Use a price between Rs 1,000 and Rs 10,000,000.')
                  return
                }
                setBusy(true)
                try {
                  await onUpdate({
                    ...listing,
                    observations: [
                      ...listing.observations,
                      { price, at: new Date().toISOString() },
                    ].slice(-2000),
                  })
                  setNewPrice('')
                } catch {
                  setError('Could not save this observation. Please export a backup and try again.')
                } finally {
                  setBusy(false)
                }
              }}
            >
              <label className="field">
                Record a new asking price
                <input
                  required
                  type="number"
                  min="1000"
                  max="10000000"
                  placeholder="Updated price in PKR"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </label>
              <button className="button secondary" disabled={busy}>
                Record price
              </button>
            </form>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </section>
        {!sample && (
          <div className="danger-zone">
            {confirmDelete ? (
              <>
                <p>Delete this listing and all its observations?</p>
                <div>
                  <button className="button ghost" onClick={() => setConfirmDelete(false)}>
                    Keep listing
                  </button>
                  <button
                    className="button danger"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true)
                      try {
                        await onDelete()
                      } catch {
                        setBusy(false)
                        setError('Could not delete this listing.')
                      }
                    }}
                  >
                    Delete listing
                  </button>
                </div>
              </>
            ) : (
              <button className="text-button danger-text" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} />
                Delete this listing
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
