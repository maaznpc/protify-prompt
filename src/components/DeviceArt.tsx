import { useId } from 'react'
import type { Listing } from '../lib/types'

export function DeviceArt({
  listing,
  large = false,
}: {
  listing: Pick<Listing, 'category' | 'model'>
  large?: boolean
}) {
  const id = useId().replaceAll(':', '')
  const isPro = /pro/i.test(listing.model),
    isPixel = /pixel/i.test(listing.model),
    isSamsung = /samsung/i.test(listing.model)
  const color = isPro ? '#54544e' : isPixel ? '#8b998a' : isSamsung ? '#b2a99e' : '#b7b9a7'
  return (
    <div
      className={`device-art art-${listing.category} ${large ? 'art-large' : ''}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 360 230" focusable="false">
        <defs>
          <linearGradient id={`${id}-case`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={color} />
            <stop offset="0.52" stopColor={isPro ? '#777770' : '#d1d0c0'} />
            <stop offset="1" stopColor={color} />
          </linearGradient>
          <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#d3c8ac" />
            <stop offset="0.42" stopColor="#7a8566" />
            <stop offset="1" stopColor="#233e35" />
          </linearGradient>
          <linearGradient id={`${id}-warm`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f6c5a5" />
            <stop offset="0.4" stopColor="#c78367" />
            <stop offset="1" stopColor="#6d4940" />
          </linearGradient>
          <radialGradient id={`${id}-shadow`}>
            <stop stopColor="#302f23" stopOpacity="0.16" />
            <stop offset="1" stopColor="#302f23" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="180" cy="206" rx="118" ry="17" fill={`url(#${id}-shadow)`} />
        {listing.category === 'phones' || listing.category === 'other' ? (
          <>
            <g transform="translate(113 21) rotate(-12 50 95)">
              <rect
                x="0"
                y="0"
                width="95"
                height="183"
                rx="17"
                fill="#84897d"
                stroke="#8b8c80"
                strokeWidth="1.5"
              />
              <rect x="2" y="2" width="91" height="179" rx="16" fill={`url(#${id}-case)`} />
              {isPixel ? (
                <>
                  <rect x="3" y="24" width="89" height="28" rx="1" fill="#4d5148" />
                  <rect x="9" y="30" width="51" height="16" rx="9" fill="#1e2522" />
                  <circle cx="22" cy="38" r="6" fill="#3a4340" />
                  <circle cx="44" cy="38" r="6" fill="#3a4340" />
                  <circle cx="77" cy="38" r="4" fill="#e4dfce" />
                </>
              ) : (
                <>
                  {!isSamsung && (
                    <rect
                      x="7"
                      y="8"
                      width={isPro ? 43 : 37}
                      height={isPro ? 46 : 38}
                      rx="12"
                      fill={isPro ? '#6b6d65' : '#c2c3b6'}
                      stroke="#969b89"
                    />
                  )}
                  {(isSamsung
                    ? [
                        [17, 20],
                        [17, 44],
                        [17, 68],
                      ]
                    : isPro
                      ? [
                          [19, 21],
                          [36, 37],
                          [19, 43],
                        ]
                      : [
                          [18, 20],
                          [35, 37],
                        ]
                  ).map(([x, y], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r={isPro ? 8 : 7.5} fill="#737b6f" />
                      <circle cx={x} cy={y} r={isPro ? 6 : 5.5} fill="#25312d" />
                      <circle cx={x - 1.5} cy={y - 1.5} r="2.4" fill="#637068" />
                      <circle cx={x + 1} cy={y + 1} r="1.4" fill="#19251f" />
                    </g>
                  ))}
                  <circle
                    cx={isSamsung ? 36 : isPro ? 39 : 36}
                    cy={isSamsung ? 27 : 16}
                    r="3"
                    fill="#efebd9"
                  />
                </>
              )}
              {!isPixel && !isSamsung && (
                <path
                  d="M52 93c-4-3-8-1-10-1-3 0-6-3-10 0-7 5-3 18 1 23 2 3 5 2 8 1 3-1 6 2 9 0 2-2 4-6 5-9-6-2-7-10-3-14ZM45 87c0-5 3-8 7-9 0 5-3 9-7 9Z"
                  fill="#8b927f"
                  opacity="0.65"
                  transform="translate(4 -4) scale(.9)"
                />
              )}
            </g>
            <g transform="translate(175 23) rotate(10 48 93)">
              <rect
                width="94"
                height="181"
                rx="17"
                fill="#45483f"
                stroke="#8a8c7f"
                strokeWidth="1.5"
              />
              <rect
                x="4"
                y="4"
                width="86"
                height="173"
                rx="13"
                fill={`url(#${id}-${isPro ? 'warm' : 'screen'})`}
              />
              <path
                d="M5 140C42 118 67 66 89 69v108H5Z"
                fill={isPro ? '#c8967c' : '#bac1a2'}
                opacity=".75"
              />
              <path
                d="M5 143c18-37 54-44 84-21v55H5Z"
                fill={isPro ? '#ebc9b0' : '#dce0c8'}
                opacity=".82"
              />
              <path
                d="M7 154c26-27 52-25 81-7v28H7Z"
                fill={isPro ? '#e9d9c5' : '#e9e7d3'}
                opacity=".55"
              />
              <rect
                x={isPro ? 32 : 27}
                y="7"
                width={isPro ? 30 : 40}
                height="9"
                rx="5"
                fill="#222a24"
              />
              <rect x="34" y="170" width="26" height="2" rx="1" fill="#f5f5e9" />
            </g>
          </>
        ) : listing.category === 'laptops' ? (
          <g>
            <path
              d="M75 40h210a7 7 0 0 1 7 7v132H68V47a7 7 0 0 1 7-7Z"
              fill="#555850"
              stroke="#77796e"
              strokeWidth="2"
            />
            <path d="M75 48h210v123H75Z" fill={`url(#${id}-screen)`} />
            <path d="M75 129c61-97 137-42 210-76v118H75Z" fill="#b9b68f" />
            <path d="M75 154c57-49 125-11 210-74v91H75Z" fill="#dad4b8" />
            <circle cx="180" cy="44" r="1" fill="#9c9e8e" />
            <path d="M68 179h224l36 22H32Z" fill="#c3c4b9" stroke="#9d9e92" />
            <path d="M32 201h296l-6 5H38Z" fill="#8d9084" />
            <path d="M150 181h60l9 15h-78Z" fill="#aeb1a5" />
            <path d="M77 181h63l-8 11H59m165-11h59l18 11h-68" fill="#989e90" />
          </g>
        ) : (
          <g>
            <rect
              x="56"
              y="30"
              width="248"
              height="151"
              rx="5"
              fill="#3e453e"
              stroke="#72776b"
              strokeWidth="2"
            />
            <path d="M63 37h234v132H63Z" fill={`url(#${id}-warm)`} />
            <path d="M63 145C120 59 181 57 297 99v70H63Z" fill="#cfae85" />
            <path d="M63 163c69-21 123-41 234-27v33H63Z" fill="#e6d4b3" />
            <circle cx="180" cy="175" r="1.4" fill="#abae9b" />
            <path d="M166 182h28l4 22h-36Z" fill="#a7ac9e" />
            <path d="M139 204h82l7 5h-96Z" fill="#8c9485" />
          </g>
        )}
      </svg>
    </div>
  )
}
