import { useId, useState } from 'react'
import { money, type TrendPoint } from '../lib/analytics'

export function PriceChart({ points }: { points: TrendPoint[] }) {
  const id = useId().replaceAll(':', '')
  const [hover, setHover] = useState<number | null>(null)
  const values = points.flatMap((p) => (p.median === null ? [] : [p.median]))
  if (values.length < 2)
    return (
      <div className="chart-empty">
        <span className="empty-chart-line" />
        <p>A little more history, a clearer picture.</p>
        <span>
          Import dated observations to see a price trend. At least 3 comparable listings are needed
          on each day.
        </span>
      </div>
    )
  const minimum = Math.min(...values),
    maximum = Math.max(...values),
    padding = Math.max((maximum - minimum) * 0.45, maximum * 0.025)
  const low = minimum - padding,
    high = maximum + padding
  const width = 720,
    height = 235,
    left = 56,
    right = 12,
    top = 18,
    bottom = 31
  const x = (i: number) => left + (i / Math.max(points.length - 1, 1)) * (width - left - right)
  const y = (value: number) => top + ((high - value) / (high - low)) * (height - top - bottom)
  const line = (key: 'median' | 'movingAverage') => {
    let path = '',
      connected = false
    points.forEach((p, i) => {
      if (p[key] === null) {
        connected = false
        return
      }
      path += `${connected ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]!).toFixed(1)} `
      connected = true
    })
    return path
  }
  const segments: { start: number; end: number; path: string }[] = []
  points.forEach((p, i) => {
    if (p.median === null) return
    if (!i || points[i - 1].median === null)
      segments.push({
        start: i,
        end: i,
        path: `M${x(i)},${height - bottom} L${x(i)},${y(p.median)}`,
      })
    else {
      const s = segments.at(-1)!
      s.path += ` L${x(i)},${y(p.median)}`
      s.end = i
    }
  })
  const current = hover === null ? null : points[hover]
  return (
    <div className="chart-wrap">
      <svg
        className="price-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Daily median asking price: ${money(values[0])} at the beginning, ${money(values.at(-1)!)} at the end. Dashed line shows the seven-day moving average.`}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setHover(
            Math.max(
              0,
              Math.min(
                points.length - 1,
                Math.round(
                  ((((event.clientX - rect.left) / rect.width) * width - left) /
                    (width - left - right)) *
                    (points.length - 1),
                ),
              ),
            ),
          )
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#96b29c" stopOpacity=".3" />
            <stop offset="1" stopColor="#96b29c" stopOpacity=".015" />
          </linearGradient>
        </defs>
        {Array.from({ length: 4 }, (_, i) => {
          const value = low + ((high - low) * i) / 3
          return (
            <g key={i}>
              <line
                x1={left}
                y1={y(value)}
                x2={width - right}
                y2={y(value)}
                stroke="#e8e9e2"
                strokeDasharray="3 5"
              />
              <text x={left - 12} y={y(value) + 4} textAnchor="end" fill="#797d72" fontSize="11">
                {Math.round(value / 1000)}k
              </text>
            </g>
          )
        })}
        {segments.map((s, i) => (
          <path
            key={i}
            d={`${s.path} L${x(s.end)},${height - bottom} Z`}
            fill={`url(#${id}-fill)`}
          />
        ))}
        <path
          d={line('movingAverage')}
          fill="none"
          stroke="#baa68a"
          strokeWidth="1.6"
          strokeDasharray="5 5"
        />
        <path
          d={line('median')}
          fill="none"
          stroke="#3e7057"
          strokeWidth="2.7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {Array.from(
          new Set([
            0,
            Math.round((points.length - 1) / 3),
            Math.round(((points.length - 1) * 2) / 3),
            points.length - 1,
          ]),
        ).map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 7}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            fill="#797d72"
            fontSize="11"
          >
            {new Date(points[i].at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </text>
        ))}
        {current?.median !== null && current && hover !== null && (
          <g>
            <line
              x1={x(hover)}
              y1={top}
              x2={x(hover)}
              y2={height - bottom}
              stroke="#aab7a5"
              strokeDasharray="3 3"
            />
            <circle
              cx={x(hover)}
              cy={y(current.median!)}
              r="5"
              fill="#285749"
              stroke="white"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      {current && (
        <div className="chart-tooltip">
          {new Date(current.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          <strong>{money(current.median)}</strong>
          <span>{current.count} observations</span>
        </div>
      )}
      <div className="chart-legend">
        <span>
          <i />
          Median asking price
        </span>
        <span>
          <i className="dashed" />
          7-day average
        </span>
        <span className="chart-currency">PKR</span>
      </div>
    </div>
  )
}
