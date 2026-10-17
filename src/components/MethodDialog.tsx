import { ArrowUpRight, CircleCheck, ShieldCheck } from 'lucide-react'
import { Modal } from './Modal'

export function MethodDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      title="Good data. Clear expectations."
      description="Here’s how Nearmint makes a comparison you can inspect."
      onClose={onClose}
      wide
    >
      <div className="method-content">
        <div className="method-intro">
          <ShieldCheck size={28} />
          <p>
            Your next purchase deserves more than a hunch. Nearmint helps you organize asking prices
            and understand the evidence behind them.
          </p>
        </div>
        {[
          [
            '01',
            'Compare like with like',
            'A benchmark uses the same model, storage, city, PTA status, and condition. A non-PTA phone never lowers the PTA-approved median. Missing details, parts, wanted ads, and installment amounts are excluded.',
          ],
          [
            '02',
            'Keep the comparison independent',
            'The listing you’re inspecting is left out of its own benchmark. Only the latest observation from each comparable listing, recorded in the last 30 days, is counted. Repeated imports of the same URL update one listing.',
          ],
          [
            '03',
            'Use a robust price range',
            'With 8 or more peers, prices outside 1.5 times the interquartile range are excluded (with a 5% minimum spread). The middle 50% of remaining prices is shown alongside the median. A median needs 3 peers; a deal label needs 5.',
          ],
          [
            '04',
            'Treat a deal as a starting point',
            'A listing 12% or more below the comparable median is highlighted. Anything more than 45% below goes to review. Neither label verifies a seller, a device, or a resale price. Inspect hardware, verify PTA status, and avoid advance payments.',
          ],
          [
            '05',
            'Read history honestly',
            'The chart uses the largest exact comparable group for your selected model and city. Each day uses only observations known by that day, carried forward for at most 14 days. A point needs 3 listings. Gaps mean missing evidence; the dashed line averages up to 7 days of available points.',
          ],
          [
            '06',
            'Keep ownership of your data',
            'Your listings, watchlists, and alerts are stored in this browser using IndexedDB. There are no accounts, analytics, or remote uploads. Data is not synced between devices. Export a JSON backup before clearing browser storage.',
          ],
        ].map(([number, title, text]) => (
          <section className="method-step" key={number}>
            <span>{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </section>
        ))}
        <div className="notice-box">
          <CircleCheck size={18} />
          <p>
            The sample market is entirely synthetic. It demonstrates the tools; it is not current
            market research, a live feed, or an offer for sale.
          </p>
        </div>
        <p className="small muted">
          Nearmint is an independent tool, not affiliated with OLX or any marketplace. Product
          illustrations are original. Research reference:{' '}
          <a
            href="https://github.com/dgtlmoon/changedetection.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            ChangeDetection’s history and watch patterns
            <ArrowUpRight size={12} />
          </a>
          .
        </p>
      </div>
    </Modal>
  )
}
