import { useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, FileSpreadsheet, Upload, AlertCircle } from 'lucide-react'
import { Modal } from './Modal'
import { cities, type Listing, type RawListing } from '../lib/types'
import { normalize } from '../lib/normalize'
import { importCsv } from '../lib/csv'
import { money, ptaLabel, storageLabel } from '../lib/analytics'

export function ImportDialog({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: (listings: Listing[]) => Promise<void>
}) {
  const [tab, setTab] = useState<'manual' | 'csv'>('manual')
  const [raw, setRaw] = useState<RawListing>({
    title: '',
    price: '',
    city: 'Lahore',
    source: 'Manual entry',
    condition: '',
    pta: '',
  })
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const [parsed, setParsed] = useState<ReturnType<typeof importCsv> | null>(null)
  const [filename, setFilename] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => {
    try {
      return normalize({ ...raw, price: raw.price || 1000 })
    } catch {
      return null
    }
  }, [raw])
  function field(name: keyof RawListing, value: string) {
    setRaw((previous) => ({ ...previous, [name]: value }))
    setError('')
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onImport(tab === 'csv' ? parsed?.accepted || [] : [normalize(raw)])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import. Your existing data is safe.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title="Bring your finds together"
      description="Paste a listing or import a CSV. Everything stays on this device."
      onClose={onClose}
      wide
    >
      <div className="dialog-tabs" role="tablist" aria-label="Import method">
        <button
          role="tab"
          id="manual-tab"
          aria-controls="manual-panel"
          aria-selected={tab === 'manual'}
          onClick={() => {
            setTab('manual')
            setError('')
          }}
        >
          Add a listing
        </button>
        <button
          role="tab"
          id="csv-tab"
          aria-controls="csv-panel"
          aria-selected={tab === 'csv'}
          onClick={() => {
            setTab('csv')
            setError('')
          }}
        >
          Import CSV
        </button>
      </div>
      <form onSubmit={submit} className="import-form">
        {tab === 'manual' ? (
          <div id="manual-panel" role="tabpanel" aria-labelledby="manual-tab">
            <label className="field">
              Listing title{' '}
              <span className="field-note">
                Keep the original wording. We’ll pick out the details.
              </span>
              <textarea
                required
                maxLength={500}
                placeholder="e.g. iPhone 13 128gb PTA approved good condition"
                value={raw.title}
                onChange={(e) => field('title', e.target.value)}
                rows={2}
              />
            </label>
            <div className="form-grid">
              <label className="field">
                Asking price (PKR)
                <input
                  required
                  placeholder="e.g. 95,000 or 95k"
                  value={raw.price}
                  onChange={(e) => field('price', e.target.value)}
                  inputMode="decimal"
                />
              </label>
              <label className="field">
                City
                <select value={raw.city} onChange={(e) => field('city', e.target.value)}>
                  {cities.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label className="field">
                Condition
                <select value={raw.condition} onChange={(e) => field('condition', e.target.value)}>
                  <option value="">Detect from title</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="parts">Parts / repair</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>
              <label className="field">
                PTA status
                <select value={raw.pta} onChange={(e) => field('pta', e.target.value)}>
                  <option value="">Detect from title</option>
                  <option value="approved">PTA approved</option>
                  <option value="non-pta">Non-PTA</option>
                  <option value="unknown">Unknown</option>
                  <option value="n/a">Not applicable</option>
                </select>
              </label>
            </div>
            <details className="optional-fields">
              <summary>
                Source, seller & other details <span>Optional</span>
              </summary>
              <div className="form-grid">
                <label className="field">
                  Source
                  <select value={raw.source} onChange={(e) => field('source', e.target.value)}>
                    {['Manual entry', 'OLX', 'Community group', 'Local shop', 'Other'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Seller identifier
                  <input
                    maxLength={100}
                    placeholder="A nickname or your own reference"
                    value={raw.seller || ''}
                    onChange={(e) => field('seller', e.target.value)}
                  />
                </label>
                <label className="field">
                  Listing URL
                  <input
                    type="url"
                    placeholder="https://…"
                    value={raw.url || ''}
                    onChange={(e) => field('url', e.target.value)}
                  />
                </label>
                <label className="field">
                  Storage override (GB)
                  <input
                    type="number"
                    min="0"
                    max="8192"
                    placeholder="Detect from title"
                    value={raw.storage || ''}
                    onChange={(e) => field('storage', e.target.value)}
                  />
                </label>
              </div>
            </details>
            {preview && raw.title && (
              <div className="parse-preview">
                <div className="section-eyebrow">
                  <CheckCircle2 size={14} />
                  NORMALIZED PREVIEW
                </div>
                <strong>{preview.model}</strong>
                <p>
                  {storageLabel(preview.storage)} · {ptaLabel(preview.pta)} · {preview.condition} ·{' '}
                  {preview.city}
                </p>
                {preview.warnings.length > 0 && <small>{preview.warnings.join(' · ')}</small>}
              </div>
            )}
          </div>
        ) : (
          <div id="csv-panel" role="tabpanel" aria-labelledby="csv-tab">
            <input
              type="file"
              accept=".csv,text/csv"
              ref={file}
              className="sr-only"
              aria-label="CSV file"
              onChange={async (event) => {
                const selected = event.target.files?.[0]
                if (!selected) return
                setError('')
                setParsed(null)
                setFilename(selected.name)
                try {
                  if (selected.size > 10_000_000)
                    throw new Error('Choose a CSV smaller than 10 MB.')
                  setParsed(importCsv(await selected.text()))
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not read this file.')
                }
                event.target.value = ''
              }}
            />
            <button type="button" className="file-drop" onClick={() => file.current?.click()}>
              <span className="upload-icon">
                <Upload size={25} />
              </span>
              <strong>{filename || 'Choose your listings CSV'}</strong>
              <span>Up to 5,000 rows · 10 MB maximum</span>
            </button>
            <div className="template-row">
              <FileSpreadsheet size={16} />
              <p>
                Start with our{' '}
                <a href={`${import.meta.env.BASE_URL}sample-listings.csv`} download>
                  CSV template
                </a>
                . Only title and price are required.
              </p>
            </div>
            <p className="muted small">
              Use observed_at for historical prices (ISO date or date-time). Reuse a listing URL or
              seller and title to record price changes without adding duplicates.
            </p>
            {parsed && (
              <div className="import-preview">
                <div className="import-summary">
                  <span>
                    <CheckCircle2 size={16} />
                    {parsed.accepted.length} ready to import
                  </span>
                  {parsed.rejected.length > 0 && (
                    <span className="text-orange">{parsed.rejected.length} skipped</span>
                  )}
                </div>
                {parsed.accepted.slice(0, 4).map((l, i) => (
                  <div className="preview-row" key={i}>
                    <span>
                      {l.model}
                      <small>
                        {l.city} · {l.condition}
                      </small>
                    </span>
                    <strong>{money(l.observations[0].price)}</strong>
                  </div>
                ))}
                {parsed.rejected.length > 0 && (
                  <details>
                    <summary>Review skipped rows</summary>
                    <ul className="rejected-rows">
                      {parsed.rejected.slice(0, 30).map((r) => (
                        <li key={r.row}>
                          Row {r.row}: {r.reason}
                        </li>
                      ))}
                      {parsed.rejected.length > 30 && (
                        <li>And {parsed.rejected.length - 30} more rejected rows.</li>
                      )}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            <AlertCircle size={16} />
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <p>
            <span className="privacy-dot" />
            Private by default. No uploads.
          </p>
          <button
            className="button primary"
            disabled={busy || (tab === 'csv' && !parsed?.accepted.length)}
            type="submit"
          >
            {busy
              ? 'Saving…'
              : tab === 'csv'
                ? `Import ${parsed?.accepted.length || ''} listings`
                : 'Add listing'}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  )
}
