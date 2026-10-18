import { useState, type FormEvent } from 'react'
import { Bell, Plus } from 'lucide-react'
import { Modal } from './Modal'
import { cities, type AlertRule, type Listing } from '../lib/types'
import { brandForModel, catalogGroups, categoryForModel, modelCatalog } from '../lib/catalog'
import { ModelOptions } from './ModelOptions'

export function AlertDialog({
  listings,
  onClose,
  onAdd,
}: {
  listings: Listing[]
  onClose: () => void
  onAdd: (rule: AlertRule) => Promise<void>
}) {
  const models = [
    ...new Set([
      ...modelCatalog,
      ...listings.map((l) => l.model).filter((m) => m !== 'Unrecognized model'),
    ]),
  ]
  const [model, setModel] = useState('iPhone 13'),
    [brand, setBrand] = useState('all'),
    [city, setCity] = useState('Lahore'),
    [budget, setBudget] = useState('100000'),
    [storage, setStorage] = useState('128'),
    [minDiscount, setMinDiscount] = useState('0'),
    [pta, setPta] = useState<AlertRule['pta']>('approved'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  function chooseModel(next: string) {
    setModel(next)
    const category = categoryForModel(next)
    setPta(category === 'phones' ? 'approved' : 'n/a')
    setStorage(category === 'monitors' ? '0' : category === 'laptops' ? '256' : '128')
  }
  const visibleModels = brand === 'all' ? models : models.filter((m) => brandForModel(m) === brand)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onAdd({
        id: 'a-' + crypto.randomUUID(),
        model,
        city,
        budget: Number(budget),
        storage: Number(storage),
        pta,
        enabled: true,
        minDiscount: Number(minDiscount),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this alert.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title="Find your kind of deal"
      description="Set a budget. We’ll highlight matching listings in your workspace."
      onClose={onClose}
    >
      <form onSubmit={submit} className="import-form">
        <label className="field">
          Brand
          <select
            value={brand}
            onChange={(e) => {
              const next = e.target.value
              setBrand(next)
              if (next !== 'all' && brandForModel(model) !== next)
                chooseModel(models.find((m) => brandForModel(m) === next)!)
            }}
          >
            <option value="all">All brands</option>
            {catalogGroups.map((group) => (
              <option key={group.brand} value={group.brand}>
                {group.brand}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Model
          <select value={model} onChange={(e) => chooseModel(e.target.value)}>
            <ModelOptions models={visibleModels} />
          </select>
        </label>
        <div className="form-grid">
          <label className="field">
            City
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option>All cities</option>
              {cities
                .filter((c) => c !== 'Other')
                .map((c) => (
                  <option key={c}>{c}</option>
                ))}
            </select>
          </label>
          <label className="field">
            Maximum asking price (Rs)
            <input
              required
              type="number"
              min="1000"
              max="10000000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </label>
          <label className="field">
            Storage
            <select value={storage} onChange={(e) => setStorage(e.target.value)}>
              <option value="0">Any storage</option>
              {[64, 128, 256, 512, 1024, 2048].map((s) => (
                <option value={s} key={s}>
                  {s >= 1024 ? `${s / 1024} TB` : `${s} GB`}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            PTA status
            <select value={pta} onChange={(e) => setPta(e.target.value as AlertRule['pta'])}>
              <option value="unknown">Any PTA status</option>
              <option value="approved">PTA approved</option>
              <option value="non-pta">Non-PTA</option>
              <option value="n/a">Not applicable</option>
            </select>
          </label>
          <label className="field">
            Minimum discount below median
            <select
              aria-label="Minimum discount below median"
              aria-describedby="discount-help"
              value={minDiscount}
              onChange={(e) => setMinDiscount(e.target.value)}
            >
              <option value="0">Any price within budget</option>
              <option value="12">At least 12% below median</option>
              <option value="15">At least 15% below median</option>
              <option value="20">At least 20% below median</option>
              <option value="25">At least 25% below median</option>
            </select>
            <span className="field-note" id="discount-help">
              Discount alerts need 5 equivalent peers and exclude unusually low prices.
            </span>
          </label>
        </div>
        <div className="notice-box">
          <Bell size={17} />
          <p>
            Alerts are checked when you open Nearmint or update your listings. They run on this
            device, with no background scraping or push notifications.
          </p>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <button className="button ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? 'Saving…' : 'Create alert'}
            <Plus size={15} />
          </button>
        </div>
      </form>
    </Modal>
  )
}
