import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FolderOpen,
  LayoutDashboard,
  Leaf,
  ListFilter,
  LockKeyhole,
  MapPin,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Tag,
  Trash2,
  TrendingDown,
  Upload,
  X,
} from 'lucide-react'
import { loadWorkspace, saveWorkspace, validateBackup } from './lib/storage'
import { createWorkspace, modelCatalog, sampleListings } from './lib/sample'
import {
  alertMatches,
  eligible,
  buildEstimates,
  latest,
  money,
  priceTrend,
  ptaLabel,
  recent,
  signal,
  storageLabel,
} from './lib/analytics'
import { mergeListings } from './lib/normalize'
import { downloadFile, listingsCsv } from './lib/csv'
import { cities, workspaceSchema, type Listing, type Page, type Workspace } from './lib/types'
import { ListingCard } from './components/ListingCard'
import { ListingDetail } from './components/ListingDetail'
import { PriceChart } from './components/PriceChart'
import { DeviceArt } from './components/DeviceArt'
import { ImportDialog } from './components/ImportDialog'
import { AlertDialog } from './components/AlertDialog'
import { MethodDialog } from './components/MethodDialog'
import { Modal } from './components/Modal'

const navigation = [
  { id: 'overview' as const, label: 'Market overview', icon: LayoutDashboard },
  { id: 'listings' as const, label: 'All listings', icon: Tag },
  { id: 'watchlist' as const, label: 'Watchlist', icon: Bookmark },
  { id: 'alerts' as const, label: 'Price alerts', icon: Bell },
  { id: 'data' as const, label: 'Your data', icon: Database },
]
const pageTitles: Record<Page, string> = {
  overview: 'Market overview',
  listings: 'All listings',
  watchlist: 'Watchlist',
  alerts: 'Price alerts',
  data: 'Your data',
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const workspaceRef = useRef<Workspace | null>(null)
  const storageWritable = useRef(true)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 600px)').matches)
  const sidebarRef = useRef<HTMLElement>(null)
  const [page, setPage] = useState<Page>(() =>
    navigation.some((n) => n.id === location.hash.slice(1))
      ? (location.hash.slice(1) as Page)
      : 'overview',
  )
  const [modal, setModal] = useState<'import' | 'alert' | 'method' | 'restore' | 'reset' | null>(
    null,
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [city, setCity] = useState('Lahore'),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('all'),
    [sort, setSort] = useState('best'),
    [filter, setFilter] = useState('all')
  const [ptaFilter, setPtaFilter] = useState('all'),
    [conditionFilter, setConditionFilter] = useState('all'),
    [maxPrice, setMaxPrice] = useState(''),
    [showFilters, setShowFilters] = useState(false)
  const [model, setModel] = useState('iPhone 13'),
    [days, setDays] = useState(30),
    [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState(''),
    [storageError, setStorageError] = useState(''),
    [offline, setOffline] = useState(!navigator.onLine),
    [restore, setRestore] = useState<Workspace | null>(null)
  const backupInput = useRef<HTMLInputElement>(null),
    searchInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    loadWorkspace()
      .then((value) => {
        workspaceRef.current = value
        setWorkspace(value)
      })
      .catch(() => {
        storageWritable.current = false
        const value = createWorkspace()
        workspaceRef.current = value
        setWorkspace(value)
        setStorageError(
          'Your saved workspace could not be opened. This temporary session will not overwrite it. Export any new work before closing the tab.',
        )
      })
    const listener = () => setOffline(!navigator.onLine)
    const hashListener = () => {
      const next = location.hash.slice(1)
      if (navigation.some((n) => n.id === next)) setPage(next as Page)
    }
    window.addEventListener('online', listener)
    window.addEventListener('offline', listener)
    window.addEventListener('hashchange', hashListener)
    return () => {
      window.removeEventListener('online', listener)
      window.removeEventListener('offline', listener)
      window.removeEventListener('hashchange', hashListener)
    }
  }, [])
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)')
    const listener = () => setIsMobile(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])
  useEffect(() => {
    if (!isMobile || !mobileMenu) return
    const previous = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() =>
      sidebarRef.current?.querySelector<HTMLElement>('a, button')?.focus(),
    )
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenu(false)
      if (event.key === 'Tab') {
        const items = [...(sidebarRef.current?.querySelectorAll<HTMLElement>('a, button') || [])]
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault()
          items.at(-1)?.focus()
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault()
          items[0]?.focus()
        }
      }
    }
    document.addEventListener('keydown', listener)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', listener)
      previous?.focus()
    }
  }, [isMobile, mobileMenu])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    document.title = `${pageTitles[page]} · Nearmint`
  }, [page])
  const closeModal = useCallback(() => setModal(null), [])
  const closeDetail = useCallback(() => setSelectedId(null), [])
  const commit = useCallback(async (update: (value: Workspace) => Workspace) => {
    if (!workspaceRef.current) return false
    const next = workspaceSchema.parse(update(workspaceRef.current))
    workspaceRef.current = next
    if (!storageWritable.current) {
      setWorkspace(next)
      return false
    }
    try {
      await saveWorkspace(next)
      if (workspaceRef.current === next) setWorkspace(next)
      setStorageError('')
      return true
    } catch {
      if (workspaceRef.current === next) setWorkspace(next)
      setStorageError(
        'Changes are available in this tab but could not be saved to this browser. Export a JSON backup from Your data before closing.',
      )
      return false
    }
  }, [])
  const samples = useMemo(
    () => (workspace ? sampleListings(workspace.sampleAnchor) : []),
    [workspace?.sampleAnchor],
  )
  const sample = workspace?.mode === 'sample'
  const listings = sample ? samples : workspace?.listings || []
  const saved = (sample ? workspace?.sampleSaved : workspace?.saved) || []
  const rules = (sample ? workspace?.sampleRules : workspace?.rules) || []
  const analyses = useMemo(() => buildEstimates(listings), [listings])
  const localListings = useMemo(
    () => listings.filter((l) => city === 'All cities' || l.city === city),
    [listings, city],
  )
  const cleanListings = localListings.filter((l) => eligible(l) && recent(l))
  const deals = cleanListings
    .filter((l) => signal(l, analyses.get(l.id)!) === 'deal')
    .sort((a, b) => (analyses.get(b.id)!.discount || 0) - (analyses.get(a.id)!.discount || 0))
  const models = [
    ...new Set([
      ...modelCatalog.filter((m) => listings.some((l) => l.model === m)),
      ...listings.map((l) => l.model).filter((m) => m !== 'Unrecognized model'),
    ]),
  ]
  const trend = useMemo(
    () => priceTrend(listings, model, city, days),
    [listings, model, city, days],
  )
  const trendValues = trend.points.filter((p) => p.median !== null),
    currentMedian = trend.points.at(-1)?.median ?? null
  const firstMedian = trendValues[0]?.median ?? null
  const trendChange =
    firstMedian && currentMedian ? ((currentMedian - firstMedian) / firstMedian) * 100 : null
  const matches = rules.flatMap((r) =>
    alertMatches(r, listings, Date.now(), analyses).map((l) => ({ rule: r, listing: l })),
  )
  const selectedListing = listings.find((l) => l.id === selectedId)
  const filtered = localListings
    .filter((l) => {
      const text = `${l.model} ${l.title} ${l.source} ${l.city}`.toLowerCase(),
        comparison = analyses.get(l.id)!
      return (
        (!query || text.includes(query.toLowerCase())) &&
        (category === 'all' || l.category === category) &&
        (ptaFilter === 'all' || l.pta === ptaFilter) &&
        (conditionFilter === 'all' || l.condition === conditionFilter) &&
        (!maxPrice || (latest(l)?.price ?? Infinity) <= Number(maxPrice)) &&
        (page !== 'watchlist' || saved.includes(l.id)) &&
        (filter === 'all' ||
          (filter === 'deals' && signal(l, comparison) === 'deal') ||
          (filter === 'review' && !eligible(l)))
      )
    })
    .sort((a, b) =>
      sort === 'low'
        ? (latest(a)?.price ?? Infinity) - (latest(b)?.price ?? Infinity)
        : sort === 'high'
          ? (latest(b)?.price ?? 0) - (latest(a)?.price ?? 0)
          : sort === 'new'
            ? Date.parse(latest(b)?.at || '') - Date.parse(latest(a)?.at || '')
            : (analyses.get(b.id)?.discount ?? -Infinity) -
              (analyses.get(a.id)?.discount ?? -Infinity),
    )
  const [visibleLimit, setVisibleLimit] = useState(18)
  useEffect(
    () => setVisibleLimit(18),
    [query, category, city, filter, ptaFilter, conditionFilter, maxPrice, page, sort],
  )

  function navigate(next: Page) {
    setPage(next)
    location.hash = next
    setMobileMenu(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  async function toggleSave(id: string) {
    const wasSaved = saved.includes(id)
    const ok = await commit((w) => {
      const key = w.mode === 'sample' ? 'sampleSaved' : 'saved'
      return { ...w, [key]: w[key].includes(id) ? w[key].filter((s) => s !== id) : [...w[key], id] }
    })
    setToast(
      ok
        ? wasSaved
          ? 'Removed from watchlist'
          : 'Saved to your watchlist'
        : 'Updated in this tab. Export a backup to keep it.',
    )
  }
  async function importListings(incoming: Listing[]) {
    if (!incoming.length) throw new Error('No valid listings to import.')
    const result = mergeListings(workspaceRef.current?.listings || [], incoming)
    const ok = await commit((w) => ({ ...w, mode: 'personal', listings: result.listings }))
    setModal(null)
    navigate('listings')
    setCity('All cities')
    setFilter('all')
    setQuery('')
    setCategory('all')
    setPtaFilter('all')
    setConditionFilter('all')
    setMaxPrice('')
    if (incoming[0].model !== 'Unrecognized model') setModel(incoming[0].model)
    setToast(
      ok
        ? `${result.added} added · ${result.updated} observations updated · ${result.duplicates} duplicates skipped`
        : 'Imported in this tab. Export a backup to keep your work.',
    )
  }
  function cards(rows: Listing[]) {
    return rows.map((l) => (
      <ListingCard
        key={l.id}
        listing={l}
        comparison={analyses.get(l.id)!}
        saved={saved.includes(l.id)}
        onSave={() => void toggleSave(l.id)}
        onOpen={() => setSelectedId(l.id)}
      />
    ))
  }
  function clearFilters() {
    setQuery('')
    setCategory('all')
    setFilter('all')
    setPtaFilter('all')
    setConditionFilter('all')
    setMaxPrice('')
    setCity('All cities')
  }

  if (!workspace)
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          n<span />
        </div>
        <p>Opening your workspace…</p>
      </div>
    )
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to content
      </a>
      {mobileMenu && <div className="sidebar-overlay" onClick={() => setMobileMenu(false)} />}
      <aside
        ref={sidebarRef}
        inert={isMobile && !mobileMenu}
        role={isMobile && mobileMenu ? 'dialog' : undefined}
        aria-hidden={(isMobile && !mobileMenu) || undefined}
        aria-modal={(isMobile && mobileMenu) || undefined}
        className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}
        aria-label="Main navigation"
      >
        <a
          className="brand"
          href="#overview"
          onClick={() => navigate('overview')}
          aria-label="Nearmint home"
        >
          <span className="brand-mark">
            n<span />
          </span>
          <span>
            nearmint<span className="brand-period">.</span>
          </span>
        </a>
        <button
          className="workspace-switch"
          onClick={() =>
            void commit((w) => ({ ...w, mode: w.mode === 'sample' ? 'personal' : 'sample' }))
          }
        >
          <span className="workspace-icon">
            <FolderOpen size={17} />
          </span>
          <span>
            <strong>{sample ? 'The sample market' : 'Your workspace'}</strong>
            <small>
              {sample ? 'Take a look around' : `${workspace.listings.length} private listings`}
            </small>
          </span>
          <ChevronDown size={14} />
        </button>
        <p className="nav-eyebrow">YOUR MARKET, AT A GLANCE</p>
        <nav>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              aria-label={label}
              aria-current={page === id ? 'page' : undefined}
              onClick={() => {
                navigate(id)
                if (id !== 'listings') setFilter('all')
              }}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
              {id === 'watchlist' && saved.length > 0 && (
                <span className="nav-count">{saved.length}</span>
              )}
              {id === 'alerts' && matches.length > 0 && <span className="nav-alert-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="leaf-circle">
              <Leaf size={19} />
            </span>
            <strong>
              Second-hand.
              <br />
              First choice.
            </strong>
            <p>
              A little less waste.
              <br />A lot more possibility.
            </p>
          </div>
          <button className="sidebar-help" onClick={() => setModal('method')}>
            <CircleHelp size={17} />
            How Nearmint works
            <ArrowUpRight size={14} />
          </button>
          <div className="privacy-label">
            <LockKeyhole size={12} />
            On your device. In your hands.
          </div>
        </div>
      </aside>
      <div className="app-shell" inert={isMobile && mobileMenu}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu-button"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{pageTitles[page]}</strong>
          </div>
          <div className="topbar-actions">
            {offline && <span className="offline-label">Offline</span>}
            <span className="local-status">
              <span />
              Local-first
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              aria-label="Search listings"
              onClick={() => {
                navigate('listings')
                setTimeout(() => searchInput.current?.focus(), 50)
              }}
            >
              <Search size={19} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label={`Price alerts, ${matches.length} matches`}
              onClick={() => navigate('alerts')}
            >
              <Bell size={19} />
              {matches.length > 0 && <i />}
            </button>
            <span className="workspace-avatar" title="Private local workspace">
              Y
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {storageError && (
            <div className="storage-error" role="alert">
              <ShieldCheck size={18} />
              <span>{storageError}</span>
              <button
                className="text-button"
                onClick={() => {
                  navigate('data')
                  downloadFile(
                    'nearmint-recovery.json',
                    JSON.stringify(workspace, null, 2),
                    'application/json',
                  )
                }}
              >
                Export now
                <Download size={14} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="section-eyebrow">
                {page === 'overview'
                  ? 'LESS GUESSWORK. BETTER FINDS.'
                  : page === 'listings'
                    ? 'A LITTLE RESEARCH GOES A LONG WAY'
                    : page === 'watchlist'
                      ? 'THE ONES YOU’RE KEEPING AN EYE ON'
                      : page === 'alerts'
                        ? 'YOUR NEXT FIND, ON YOUR TERMS'
                        : 'PRIVATE BY DESIGN'}
              </div>
              <h1>
                {page === 'overview'
                  ? 'Good finds start here.'
                  : page === 'listings'
                    ? 'The local lineup.'
                    : page === 'watchlist'
                      ? 'Worth keeping close.'
                      : page === 'alerts'
                        ? 'Let the right price find you.'
                        : 'Your finds. Your data.'}
              </h1>
              <p>
                {page === 'overview'
                  ? 'A clearer picture of the second-hand market. A better feeling about your next buy.'
                  : page === 'listings'
                    ? 'Compare the details, understand the price, and find your next good thing.'
                    : page === 'watchlist'
                      ? 'Your saved listings, with the price context that matters.'
                      : page === 'alerts'
                        ? 'Set your budget. We’ll check your imported listings for a match.'
                        : 'No account. No uploads. Just a workspace that belongs to you.'}
              </p>
            </div>
            <div className="heading-actions">
              {page !== 'data' && (
                <label className="city-picker">
                  <MapPin size={16} />
                  <span className="sr-only">Market city</span>
                  <select
                    aria-label="Market city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option>All cities</option>
                    {cities
                      .filter((c) => c !== 'Other')
                      .map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                  </select>
                  <ChevronDown size={13} />
                </label>
              )}
              <button
                className="button primary"
                onClick={() => setModal(page === 'alerts' ? 'alert' : 'import')}
              >
                <Plus size={17} />
                {page === 'alerts' ? 'Create alert' : 'Add listings'}
              </button>
            </div>
          </div>
          {sample && (
            <div className="sample-banner">
              <span className="sample-label">
                <span />
                SAMPLE MARKET
              </span>
              <p>Real tools. Illustrative data. Make yourself at home.</p>
              <button
                className="text-button"
                onClick={() => {
                  void commit((w) => ({ ...w, mode: 'personal' }))
                  setFilter('all')
                  setQuery('')
                }}
              >
                Use my own data
                <ArrowRight size={14} />
              </button>
            </div>
          )}
          {page === 'overview' && (
            <>
              <div className="stats-grid">
                <Stat
                  icon={<Tag size={18} />}
                  title="Complete listings"
                  value={cleanListings.length.toString()}
                  note={`${localListings.length - cleanListings.length} incomplete or older observations`}
                />
                <Stat
                  icon={<TrendingDown size={19} />}
                  title="Below-market finds"
                  value={deals.length.toString().padStart(2, '0')}
                  note="At least 12% below comparable median"
                  accent
                />
                <Stat
                  icon={<Smartphone size={18} />}
                  title="Models in your market"
                  value={new Set(cleanListings.map((l) => l.model)).size
                    .toString()
                    .padStart(2, '0')}
                  note={`${city === 'All cities' ? 'Across your selected cities' : `Observed in ${city}`} · last 30 days`}
                />
                <Stat
                  icon={<Bookmark size={18} />}
                  title="On your watchlist"
                  value={saved
                    .filter((id) => listings.some((l) => l.id === id))
                    .length.toString()
                    .padStart(2, '0')}
                  note="A shortlist, ready when you are"
                />
              </div>
              <div className="overview-middle">
                <section className="panel trend-panel">
                  <div className="panel-top">
                    <div>
                      <h2>The price, in perspective</h2>
                      <p>Follow the market before making your move.</p>
                    </div>
                    <label className="model-picker">
                      <span className="sr-only">Chart model</span>
                      <select
                        aria-label="Chart model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      >
                        {[...new Set([model, ...models])].map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} />
                    </label>
                  </div>
                  <div className="trend-summary">
                    <div>
                      <strong>{money(currentMedian)}</strong>
                      <span
                        className={`trend-change ${trendChange !== null && trendChange > 0 ? 'text-orange' : ''}`}
                      >
                        {trendChange !== null ? (
                          <>
                            {trendChange <= 0 ? (
                              <ArrowDownRight size={14} />
                            ) : (
                              <ArrowUpRight size={14} />
                            )}
                            {Math.abs(trendChange).toFixed(1)}%<small>{days}D window</small>
                          </>
                        ) : (
                          <small>No price history yet</small>
                        )}
                      </span>
                    </div>
                    <div className="range-picker" role="group" aria-label="Chart time range">
                      {[30, 60, 90].map((d) => (
                        <button
                          key={d}
                          aria-pressed={days === d}
                          className={days === d ? 'selected' : ''}
                          onClick={() => setDays(d)}
                        >
                          {d}D
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="chart-cohort">
                    {trend.reference
                      ? `${storageLabel(trend.reference.storage)}${trend.reference.category === 'phones' ? ' · ' + ptaLabel(trend.reference.pta) : ''} · ${trend.reference.condition} · ${trend.reference.city}`
                      : 'Add comparable listings to see your market'}
                  </div>
                  <PriceChart points={trend.points} />
                  <div className="chart-footnote">
                    <span>Asking prices, not confirmed sales.</span>
                    <button className="text-button" onClick={() => setModal('method')}>
                      Our method
                      <CircleHelp size={12} />
                    </button>
                  </div>
                </section>
                <aside className="spotlight">
                  <div className="spotlight-eyebrow">
                    <span />
                    THE SHORTLIST
                  </div>
                  <h2>
                    {deals.length
                      ? 'A good place\nto start looking.'
                      : 'Your next good find\nstarts with a little data.'}
                  </h2>
                  {deals[0] ? (
                    <>
                      <div className="spotlight-art">
                        <DeviceArt listing={deals[0]} />
                      </div>
                      <div className="spotlight-device">
                        <div>
                          <h3>{deals[0].model}</h3>
                          <p>
                            {storageLabel(deals[0].storage)} · {deals[0].city}
                          </p>
                        </div>
                        <span className="spotlight-discount">
                          ↓ {analyses.get(deals[0].id)!.discount!.toFixed(0)}%
                        </span>
                      </div>
                      <div className="spotlight-price">
                        <strong>{money(latest(deals[0])!.price)}</strong>
                        <span>vs {money(analyses.get(deals[0].id)!.median, true)} median</span>
                      </div>
                      <button
                        className="spotlight-button"
                        onClick={() => setSelectedId(deals[0].id)}
                      >
                        Take a closer look
                        <ArrowUpRight size={17} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="spotlight-empty">
                        <Leaf size={65} strokeWidth={1} />
                        <p>
                          Bring a few listings together.
                          <br />
                          We’ll help you read between the prices.
                        </p>
                      </div>
                      <button className="spotlight-button" onClick={() => setModal('import')}>
                        Add your first listings
                        <Plus size={17} />
                      </button>
                    </>
                  )}
                </aside>
              </div>
              <section className="deals-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      Worth a closer look<span className="count-label">{deals.length}</span>
                    </h2>
                    <p>Good prices, with the evidence to back them up.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      navigate('listings')
                      setFilter('deals')
                      setQuery('')
                    }}
                  >
                    View all finds
                    <ArrowRight size={15} />
                  </button>
                </div>
                {deals.length ? (
                  <div className="listings-grid overview-cards">
                    {cards(
                      deals
                        .filter((l, i, all) => all.findIndex((p) => p.model === l.model) === i)
                        .slice(0, 3),
                    )}
                  </div>
                ) : (
                  <Empty
                    icon={<TrendingDown size={25} />}
                    title="No shortcuts. Just better comparisons."
                    text="Import at least six equivalent listings to begin spotting below-market prices. We’ll keep quiet until there’s enough evidence."
                    action="Add listings"
                    onAction={() => setModal('import')}
                  />
                )}
              </section>
              <section className="panel snapshot-panel">
                <div className="panel-top">
                  <div>
                    <h2>Around the market</h2>
                    <p>A quick read on the models you’re following.</p>
                  </div>
                  <span className="small muted">{city} · PKR</span>
                </div>
                <div className="table-scroll">
                  <table className="snapshot-table">
                    <thead>
                      <tr>
                        <th>Model & variant</th>
                        <th>Comparable median</th>
                        <th>30-day trend</th>
                        <th>Recent listings</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.slice(0, 5).map((m) => {
                        const t = priceTrend(listings, m, city, 30),
                          valid = t.points.filter((p) => p.median !== null),
                          first = valid[0]?.median,
                          last = valid.at(-1)?.median
                        const change = first && last ? ((last - first) / first) * 100 : null
                        return (
                          <tr key={m}>
                            <td>
                              <span className="table-model">
                                <DeviceArt
                                  listing={{
                                    model: m,
                                    category:
                                      listings.find((l) => l.model === m)?.category || 'phones',
                                  }}
                                />
                                <span>
                                  <strong>{m}</strong>
                                  <small>
                                    {t.reference
                                      ? `${storageLabel(t.reference.storage)} · ${t.reference.category === 'phones' ? ptaLabel(t.reference.pta) : t.reference.condition}`
                                      : 'No comparable group'}
                                  </small>
                                </span>
                              </span>
                            </td>
                            <td>
                              <strong>{money(last ?? null)}</strong>
                            </td>
                            <td>
                              <span
                                className={change !== null && change <= 0 ? 'text-green' : 'muted'}
                              >
                                {change !== null
                                  ? `${change <= 0 ? '↘' : '↗'} ${Math.abs(change).toFixed(1)}%`
                                  : '—'}
                              </span>
                            </td>
                            <td>
                              {
                                localListings.filter(
                                  (l) => l.model === m && eligible(l) && recent(l),
                                ).length
                              }
                              <span className="muted"> listings</span>
                            </td>
                            <td>
                              <button
                                className="icon-button"
                                aria-label={`View ${m} listings`}
                                onClick={() => {
                                  navigate('listings')
                                  setQuery(m)
                                  setCategory('all')
                                  setFilter('all')
                                  setPtaFilter('all')
                                  setConditionFilter('all')
                                  setMaxPrice('')
                                }}
                              >
                                <ArrowUpRight size={18} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {!models.length && (
                    <p className="table-empty">Your imported models will appear here.</p>
                  )}
                </div>
              </section>
            </>
          )}
          {(page === 'listings' || page === 'watchlist') && (
            <>
              <div className="listings-toolbar">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    ref={searchInput}
                    aria-label="Search by model, title or source"
                    placeholder="Search a model, keyword, or source…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      className="icon-button"
                      aria-label="Clear search"
                      onClick={() => setQuery('')}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <button
                  className={`button secondary ${showFilters ? 'filter-active' : ''}`}
                  aria-expanded={showFilters}
                  aria-controls="advanced-filters"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {[ptaFilter !== 'all', conditionFilter !== 'all', !!maxPrice].filter(Boolean)
                    .length > 0 && (
                    <span className="nav-count">
                      {
                        [ptaFilter !== 'all', conditionFilter !== 'all', !!maxPrice].filter(Boolean)
                          .length
                      }
                    </span>
                  )}
                </button>
                <label className="sort-picker">
                  <ListFilter size={16} />
                  <span className="sr-only">Sort listings</span>
                  <select
                    aria-label="Sort listings"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="best">Best value</option>
                    <option value="low">Price: low to high</option>
                    <option value="high">Price: high to low</option>
                    <option value="new">Recently observed</option>
                  </select>
                </label>
              </div>
              {showFilters && (
                <div id="advanced-filters" className="advanced-filters">
                  <label className="field">
                    PTA status
                    <select value={ptaFilter} onChange={(e) => setPtaFilter(e.target.value)}>
                      <option value="all">All PTA statuses</option>
                      <option value="approved">PTA approved</option>
                      <option value="non-pta">Non-PTA</option>
                      <option value="unknown">Unknown</option>
                      <option value="n/a">Not applicable</option>
                    </select>
                  </label>
                  <label className="field">
                    Condition
                    <select
                      value={conditionFilter}
                      onChange={(e) => setConditionFilter(e.target.value)}
                    >
                      <option value="all">All conditions</option>
                      {['excellent', 'good', 'fair', 'parts', 'unknown'].map((c) => (
                        <option key={c} value={c}>
                          {c[0].toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Maximum price (Rs)
                    <input
                      type="number"
                      min="0"
                      placeholder="No limit"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </label>
                  <button className="text-button" onClick={clearFilters}>
                    Reset filters
                    <X size={13} />
                  </button>
                </div>
              )}
              <div className="category-row">
                <div className="category-tabs" role="group" aria-label="Device category">
                  {[
                    ['all', 'All tech'],
                    ['phones', 'Phones'],
                    ['laptops', 'Laptops'],
                    ['monitors', 'Monitors'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={category === value}
                      className={category === value ? 'selected' : ''}
                      onClick={() => setCategory(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="signal-select">
                  <span className="sr-only">Listing signal</span>
                  <select
                    aria-label="Listing signal"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All price signals</option>
                    <option value="deals">Below-market finds</option>
                    <option value="review">Needs review</option>
                  </select>
                </label>
              </div>
              <p className="results-count">
                {filtered.length} {page === 'watchlist' ? 'saved ' : ''}listing
                {filtered.length === 1 ? '' : 's'}
                <span> · {city === 'All cities' ? 'Across your cities' : city}</span>
              </p>
              {filtered.length ? (
                <>
                  <div className="listings-grid">{cards(filtered.slice(0, visibleLimit))}</div>
                  {filtered.length > visibleLimit && (
                    <div className="load-more">
                      <button
                        className="button secondary"
                        onClick={() => setVisibleLimit((v) => v + 18)}
                      >
                        Show more listings
                        <ChevronDown size={16} />
                      </button>
                      <p className="small muted">
                        Showing {Math.min(visibleLimit, filtered.length)} of {filtered.length}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  icon={page === 'watchlist' ? <Bookmark size={29} /> : <Search size={29} />}
                  title={
                    page === 'watchlist' && !saved.length
                      ? 'A little space for your next find.'
                      : listings.length
                        ? 'Nothing quite matches. Yet.'
                        : 'Your market starts with a few finds.'
                  }
                  text={
                    page === 'watchlist' && !saved.length
                      ? 'Tap the bookmark on any listing to keep it here, alongside its price context.'
                      : listings.length
                        ? 'Try another city or relax your filters. There may be something good just outside your search.'
                        : 'Paste a listing from your community group or import a CSV. We’ll organize the details and help you compare.'
                  }
                  action={
                    page === 'watchlist' && !saved.length
                      ? 'Explore listings'
                      : listings.length
                        ? 'Clear filters'
                        : 'Add your first listings'
                  }
                  onAction={() => {
                    if (page === 'watchlist' && !saved.length) {
                      navigate('listings')
                      clearFilters()
                    } else if (listings.length) clearFilters()
                    else setModal('import')
                  }}
                />
              )}
            </>
          )}
          {page === 'alerts' && (
            <>
              <div className="notice-box alert-notice">
                <Bell size={18} />
                <p>
                  <strong>Your budget, your conditions.</strong> Matches use complete,
                  working-device listings observed in the last 30 days. Checked on open and whenever
                  your data changes.
                </p>
                <span className="device-only">On this device</span>
              </div>
              {rules.length ? (
                <div className="alert-rules">
                  {rules.map((rule) => {
                    const found = alertMatches(rule, listings, Date.now(), analyses)
                    return (
                      <section
                        className={`panel alert-rule ${!rule.enabled ? 'rule-paused' : ''}`}
                        key={rule.id}
                      >
                        <div className="alert-rule-header">
                          <span className="alert-rule-icon">
                            <Bell size={20} />
                          </span>
                          <div>
                            <h2>
                              {rule.model}
                              <span className="count-label">{found.length} matches</span>
                            </h2>
                            <p>
                              {rule.city || 'All cities'} ·{' '}
                              {rule.storage ? storageLabel(rule.storage) : 'Any storage'} ·{' '}
                              {rule.pta === 'unknown' ? 'Any PTA status' : ptaLabel(rule.pta)}
                              {rule.minDiscount > 0 ? ` · ${rule.minDiscount}%+ below median` : ''}
                            </p>
                          </div>
                          <strong className="alert-budget">Under {money(rule.budget)}</strong>
                          <button
                            className={`toggle ${rule.enabled ? 'toggle-on' : ''}`}
                            role="switch"
                            aria-checked={rule.enabled}
                            aria-label={`${rule.enabled ? 'Pause' : 'Enable'} ${rule.model} alert`}
                            onClick={() =>
                              void commit((w) => {
                                const key = w.mode === 'sample' ? 'sampleRules' : 'rules'
                                return {
                                  ...w,
                                  [key]: w[key].map((r) =>
                                    r.id === rule.id ? { ...r, enabled: !r.enabled } : r,
                                  ),
                                }
                              })
                            }
                          >
                            <span />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Delete ${rule.model} alert`}
                            onClick={() => {
                              void commit((w) => {
                                const key = w.mode === 'sample' ? 'sampleRules' : 'rules'
                                return { ...w, [key]: w[key].filter((r) => r.id !== rule.id) }
                              })
                              setToast('Alert removed')
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {found.length ? (
                          <div className="alert-matches">
                            {found.slice(0, 5).map((l) => (
                              <button key={l.id} onClick={() => setSelectedId(l.id)}>
                                <DeviceArt listing={l} />
                                <span>
                                  <strong>{l.model}</strong>
                                  <small>
                                    {l.city} · {l.source}
                                  </small>
                                </span>
                                <strong>{money(latest(l)!.price)}</strong>
                                <ArrowUpRight size={16} />
                              </button>
                            ))}
                            {found.length > 5 && (
                              <p className="small muted">
                                Showing the first 5 of {found.length} matches. Use All listings to
                                explore the rest.
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="no-matches">
                            {rule.enabled
                              ? 'No matching observations yet. Your next import could change that.'
                              : 'This alert is paused.'}
                          </p>
                        )}
                      </section>
                    )
                  })}
                </div>
              ) : (
                <Empty
                  icon={<Bell size={29} />}
                  title="A good deal starts with your number."
                  text="Create an alert for the model, city, and budget you have in mind. Matching imports will appear here."
                  action="Create your first alert"
                  onAction={() => setModal('alert')}
                />
              )}
            </>
          )}
          {page === 'data' && (
            <div className="data-layout">
              <div>
                <section className="panel data-card">
                  <div className="data-card-icon">
                    <Database size={23} />
                  </div>
                  <h2>A home for your market research.</h2>
                  <p>
                    Listings, price observations, bookmarks, and alerts are saved in this browser.
                    Take a backup whenever you need one.
                  </p>
                  <div className="data-counts">
                    <div>
                      <strong>{workspace.listings.length}</strong>
                      <span>Your listings</span>
                    </div>
                    <div>
                      <strong>
                        {workspace.listings.reduce((sum, l) => sum + l.observations.length, 0)}
                      </strong>
                      <span>Price observations</span>
                    </div>
                    <div>
                      <strong>{workspace.saved.length}</strong>
                      <span>Saved finds</span>
                    </div>
                  </div>
                  <div className="data-buttons">
                    <button
                      className="button primary"
                      onClick={() => {
                        downloadFile(
                          'nearmint-backup.json',
                          JSON.stringify(workspace, null, 2),
                          'application/json',
                        )
                        setToast('Backup exported. Keep it somewhere safe.')
                      }}
                    >
                      <Download size={16} />
                      Export full backup
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => {
                        downloadFile(
                          sample ? 'nearmint-sample-listings.csv' : 'nearmint-listings.csv',
                          listingsCsv(listings),
                          'text/csv;charset=utf-8',
                        )
                        setToast('CSV exported with all price observations.')
                      }}
                    >
                      <FileSpreadsheet size={16} />
                      Export {sample ? 'sample ' : ''}CSV
                    </button>
                  </div>
                </section>
                <section className="panel data-card">
                  <h2>Bring data in</h2>
                  <p>
                    Add listings one by one, import a CSV, or restore a previous Nearmint workspace.
                  </p>
                  <div className="data-action-row">
                    <span className="data-action-icon">
                      <Upload size={19} />
                    </span>
                    <div>
                      <h3>Listings & historical prices</h3>
                      <p>Paste details or upload a CSV. Duplicate observations are skipped.</p>
                    </div>
                    <button className="button secondary" onClick={() => setModal('import')}>
                      Import
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="data-action-row">
                    <span className="data-action-icon">
                      <RefreshCw size={18} />
                    </span>
                    <div>
                      <h3>Restore a workspace</h3>
                      <p>Replaces your workspace with an exported JSON backup.</p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => backupInput.current?.click()}
                    >
                      Choose backup
                    </button>
                    <input
                      ref={backupInput}
                      type="file"
                      className="sr-only"
                      accept=".json,application/json"
                      aria-label="Restore JSON backup"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          if (file.size > 30000000)
                            throw new Error('Choose a backup smaller than 30 MB.')
                          const parsed = validateBackup(await file.text())
                          setRestore(parsed)
                          setModal('restore')
                        } catch (error) {
                          setToast(
                            error instanceof Error ? error.message : 'Could not read the backup.',
                          )
                        }
                        e.target.value = ''
                      }}
                    />
                  </div>
                  <a
                    className="template-link"
                    href={`${import.meta.env.BASE_URL}sample-listings.csv`}
                    download
                  >
                    Download the CSV template
                    <Download size={14} />
                  </a>
                </section>
                <section className="panel data-card">
                  <div className="section-title">
                    <h2>Data quality, made visible</h2>
                    <button className="text-button" onClick={() => setModal('method')}>
                      Read our method
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div className="quality-row">
                    <span>
                      <CheckCircle2 size={16} />
                      Complete, recent listings
                    </span>
                    <strong>{listings.filter((l) => eligible(l) && recent(l)).length}</strong>
                  </div>
                  <div className="quality-row">
                    <span>
                      <SlidersHorizontal size={16} />
                      Missing details or excluded ads
                    </span>
                    <strong>{listings.filter((l) => !eligible(l)).length}</strong>
                  </div>
                  <div className="quality-row">
                    <span>
                      <RefreshCw size={16} />
                      Older than 30 days
                    </span>
                    <strong>{listings.filter((l) => eligible(l) && !recent(l)).length}</strong>
                  </div>
                  <p className="small muted">
                    {sample
                      ? 'These counts describe the sample market.'
                      : 'Your original text is preserved. Incomplete listings stay visible but do not influence the benchmark.'}
                  </p>
                </section>
              </div>
              <aside className="data-aside">
                <section className="privacy-card">
                  <ShieldCheck size={29} strokeWidth={1.4} />
                  <h2>
                    Private isn’t a setting.
                    <br />
                    It’s the starting point.
                  </h2>
                  <p>
                    No sign-up. No tracking scripts. No server holding your listings. Nearmint
                    stores your workspace on this device.
                  </p>
                  <p>
                    Clearing site data or changing browsers removes access to these local records. A
                    backup keeps you in control.
                  </p>
                  <span>
                    <LockKeyhole size={13} />
                    No data leaves this browser
                  </span>
                </section>
                <section className="panel data-card">
                  <h3>Explore without the setup</h3>
                  <p>
                    Switch between your own workspace and the illustrative sample market at any
                    time.
                  </p>
                  <button
                    className="button secondary full-width"
                    onClick={() => {
                      void commit((w) => ({
                        ...w,
                        mode: w.mode === 'sample' ? 'personal' : 'sample',
                      }))
                      setToast(
                        sample
                          ? 'Switched to your private workspace'
                          : 'Exploring illustrative sample data',
                      )
                    }}
                  >
                    {sample ? 'Open my workspace' : 'Explore sample market'}
                    <ArrowRight size={14} />
                  </button>
                  {sample && (
                    <button
                      className="text-button refresh-sample"
                      onClick={() => {
                        void commit((w) => ({ ...w, sampleAnchor: new Date().toISOString() }))
                        setToast('Sample observations regenerated for today')
                      }}
                    >
                      <RefreshCw size={13} />
                      Refresh sample dates
                    </button>
                  )}
                </section>
                <button
                  className="text-button danger-text clear-workspace"
                  onClick={() => setModal('reset')}
                >
                  <Trash2 size={14} />
                  Clear my workspace
                </button>
              </aside>
            </div>
          )}
          <footer className="footer">
            <span>
              <span className="footer-brand">nearmint.</span>Second-hand, well understood.
            </span>
            <div>
              <button onClick={() => setModal('method')}>
                How it works
                <ArrowUpRight size={12} />
              </button>
              <a
                href="https://github.com/maaznpc/protify-prompt"
                target="_blank"
                rel="noopener noreferrer"
              >
                Made in the open
                <ExternalLink size={12} />
              </a>
            </div>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {modal === 'import' && <ImportDialog onClose={closeModal} onImport={importListings} />}
      {modal === 'alert' && (
        <AlertDialog
          listings={listings}
          onClose={closeModal}
          onAdd={async (rule) => {
            const key = workspaceRef.current?.mode === 'sample' ? 'sampleRules' : 'rules'
            if ((workspaceRef.current?.[key].length || 0) >= 100)
              throw new Error(
                'A workspace supports up to 100 alerts. Remove an old alert before adding another.',
              )
            const ok = await commit((w) => ({ ...w, [key]: [...w[key], rule] }))
            setModal(null)
            navigate('alerts')
            setToast(
              ok
                ? 'Alert created. Matching listings are shown below.'
                : 'Alert created in this tab. Export a backup to keep it.',
            )
          }}
        />
      )}
      {modal === 'method' && <MethodDialog onClose={closeModal} />}
      {modal === 'restore' && restore && (
        <Modal
          title="Restore this workspace?"
          description="This replaces your current listings, watchlist, and alerts."
          onClose={closeModal}
        >
          <div className="confirm-content">
            <p>
              The backup contains <strong>{restore.listings.length} listings</strong>,{' '}
              {restore.saved.length} saved finds, and {restore.rules.length} alerts.
            </p>
            <p className="muted">Export your current workspace first if you want to keep it.</p>
            <div className="dialog-footer">
              <button
                className="button secondary"
                onClick={() =>
                  downloadFile(
                    'nearmint-before-restore.json',
                    JSON.stringify(workspace, null, 2),
                    'application/json',
                  )
                }
              >
                <Download size={15} />
                Back up current
              </button>
              <button
                className="button primary"
                onClick={async () => {
                  const ok = await commit(() => restore)
                  setModal(null)
                  setSelectedId(null)
                  clearFilters()
                  setToast(
                    ok ? 'Workspace restored' : 'Restored in this tab. Export a backup to keep it.',
                  )
                }}
              >
                Restore backup
              </button>
            </div>
          </div>
        </Modal>
      )}
      {modal === 'reset' && (
        <Modal
          title="Clear your private workspace?"
          description="This deletes your imported listings, their price history, saved finds, and alerts from this browser."
          onClose={closeModal}
        >
          <div className="confirm-content">
            <p>The sample market stays available. This cannot be undone without a backup.</p>
            <div className="dialog-footer">
              <button
                className="button secondary"
                onClick={() =>
                  downloadFile(
                    'nearmint-before-clear.json',
                    JSON.stringify(workspace, null, 2),
                    'application/json',
                  )
                }
              >
                <Download size={15} />
                Back up first
              </button>
              <button
                className="button danger"
                onClick={async () => {
                  const ok = await commit((w) => ({
                    ...w,
                    listings: [],
                    saved: [],
                    rules: [],
                    mode: 'personal',
                  }))
                  setModal(null)
                  setSelectedId(null)
                  clearFilters()
                  setToast(
                    ok
                      ? 'Private workspace cleared'
                      : 'Cleared in this tab. Browser storage could not be updated.',
                  )
                }}
              >
                Clear workspace
              </button>
            </div>
          </div>
        </Modal>
      )}
      {selectedListing && !modal && (
        <ListingDetail
          key={selectedListing.id}
          listing={selectedListing}
          listings={listings}
          sample={sample}
          saved={saved.includes(selectedListing.id)}
          onSave={() => void toggleSave(selectedListing.id)}
          onClose={closeDetail}
          onUpdate={async (updated) => {
            const ok = await commit((w) => ({
              ...w,
              listings: w.listings.map((l) => (l.id === updated.id ? updated : l)),
            }))
            setToast(
              ok
                ? 'New price observation recorded'
                : 'Recorded in this tab. Export a backup to keep it.',
            )
          }}
          onDelete={async () => {
            const id = selectedListing.id
            const ok = await commit((w) => ({
              ...w,
              listings: w.listings.filter((l) => l.id !== id),
              saved: w.saved.filter((s) => s !== id),
            }))
            setSelectedId(null)
            setToast(
              ok ? 'Listing deleted' : 'Deleted in this tab only. Storage could not be updated.',
            )
          }}
        />
      )}
    </>
  )
}

function Stat({
  icon,
  title,
  value,
  note,
  accent = false,
}: {
  icon: React.ReactNode
  title: string
  value: string
  note: string
  accent?: boolean
}) {
  return (
    <div className={`stat-card ${accent ? 'stat-accent' : ''}`}>
      <div className="stat-label">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>
        {accent && <span className="small-dot" />}
        {note}
      </p>
    </div>
  )
}
function Empty({
  icon,
  title,
  text,
  action,
  onAction,
}: {
  icon: React.ReactNode
  title: string
  text: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="button primary" onClick={onAction}>
        {action}
        <ArrowRight size={15} />
      </button>
    </div>
  )
}
