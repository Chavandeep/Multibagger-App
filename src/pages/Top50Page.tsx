import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { COMPANIES } from '../data/companies'
import { getOverview } from '../lib/fundamentals'
import PageHeader from '../components/PageHeader'

interface Tile {
  symbol: string
  changePct: number
}

const N = 50
const GAP = 10 // px
const ASPECT = 1.08 // tile width / height — a compact card, not a stretched rectangle

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'mobile'
  if (window.innerWidth > 1024) return 'desktop'
  if (window.innerWidth >= 768) return 'tablet'
  return 'mobile'
}

// Tablet: fixed at 10x5 (matches what already looked right there).
// Desktop: search every column count that divides the available space
// reasonably, and pick whichever produces the largest tile — i.e. best fits
// that screen's actual proportions — padding any leftover cells with
// invisible placeholders so the grid still reads as a clean rectangle.
function useFitGrid(breakpoint: Breakpoint) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ cols: 10, rows: 5, tileW: 0, tileH: 0, slots: N })

  useEffect(() => {
    if (breakpoint === 'mobile') return
    const el = containerRef.current
    if (!el) return

    const compute = () => {
      const rect = el.getBoundingClientRect()
      // Floor + a small safety margin: without this, float rounding from
      // getBoundingClientRect (worse under browser zoom / fractional device
      // pixel ratios) can let the search accept a tile size that's a hair
      // too wide once actually laid out, causing the grid to overflow.
      const safeW = (raw: number) => Math.max(0, Math.floor(raw) - 1)

      if (breakpoint === 'tablet') {
        const cols = 5
        const rows = 10
        const wFromWidth = (rect.width - GAP * (cols - 1)) / cols
        const wFromHeight = ((rect.height - GAP * (rows - 1)) / rows) * ASPECT
        const w = safeW(Math.min(wFromWidth, wFromHeight))
        setLayout({ cols, rows, tileW: w, tileH: w / ASPECT, slots: cols * rows })
        return
      }

      // Desktop: try column counts and keep whichever fits the largest tile
      let best = { cols: 10, rows: 5, tileW: 0, tileH: 0, slots: 50 }
      // Only exact divisors of 50 — guarantees a perfect rectangle at every
      // width, with no leftover row to center or pad. This is deliberately
      // more restrictive than "whatever fits best" because any non-divisor
      // column count (e.g. 9) leaves a partial row, which is exactly the
      // "broken" look this is meant to prevent.
      const DESKTOP_COL_OPTIONS = [5, 10, 25]
      for (const cols of DESKTOP_COL_OPTIONS) {
        const rows = Math.ceil(N / cols)
        const wFromWidth = (rect.width - GAP * (cols - 1)) / cols
        const wFromHeight = ((rect.height - GAP * (rows - 1)) / rows) * ASPECT
        const w = safeW(Math.min(wFromWidth, wFromHeight))
        if (w > best.tileW) {
          best = { cols, rows, tileW: w, tileH: w / ASPECT, slots: cols * rows }
        }
      }
      setLayout(best)
    }

    const scheduledCompute = () => requestAnimationFrame(compute)

    compute()
    const ro = new ResizeObserver(scheduledCompute)
    ro.observe(el)
    window.addEventListener('resize', scheduledCompute)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', scheduledCompute)
    }
  }, [breakpoint])

  return { containerRef, layout }
}

export default function Top50Page() {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile')

  useEffect(() => {
    Promise.resolve().then(() => {
      const next = COMPANIES.map((c) => {
        const ov = getOverview(c.symbol)
        return { symbol: c.symbol, changePct: ov?.dayChangePct ?? 0 }
      })
      setTiles(next)
    })
  }, [])

  useEffect(() => {
    const update = () => setBreakpoint(getBreakpoint())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const { containerRef, layout } = useFitGrid(breakpoint)

  function renderTile({ symbol, changePct }: Tile) {
    const positive = changePct >= 0
    const bg = positive ? '#1E6B4F14' : '#A23B2E14'
    const border = positive ? 'var(--color-gain)' : 'var(--color-loss)'
    const textColor = positive ? 'var(--color-gain)' : 'var(--color-loss)'
    return (
      <Link
        key={symbol}
        to={`/company/${symbol}`}
        className="tap-tile rounded-md border flex flex-col items-center justify-center py-2 px-0.5 text-center"
        style={{ background: bg, borderColor: border, borderWidth: 1 }}
      >
        <span
          className="font-mono font-semibold leading-tight truncate w-full"
          style={{ fontSize: '9.5px', color: 'var(--color-ink)' }}
          title={symbol}
        >
          {symbol.length > 9 ? symbol.slice(0, 8) + '…' : symbol}
        </span>
        <span className="flex items-center gap-0.5 mt-1" style={{ color: textColor }}>
          {positive ? <ArrowUp size={9} strokeWidth={3} /> : <ArrowDown size={9} strokeWidth={3} />}
          <span className="font-mono font-semibold" style={{ fontSize: '10px' }}>
            {Math.abs(changePct).toFixed(1)}%
          </span>
        </span>
      </Link>
    )
  }

  const fullRowTileCount = Math.floor(tiles.length / layout.cols) * layout.cols
  const fullRowTiles = tiles.slice(0, fullRowTileCount)
  const remainderTiles = tiles.slice(fullRowTileCount)

  return (
    <div className="ledger-bg min-h-full pb-24 md:pb-6 md:h-screen md:flex md:flex-col md:overflow-hidden">
      <div className="md:shrink-0">
        <PageHeader title="Top 50" subtitle="Tap any ticker for the full company profile" />
      </div>

      {/* Mobile: natural compact grid, page scrolls normally */}
      <div className="px-3 md:hidden">
        <div className="grid grid-cols-5 gap-1.5">{tiles.map(renderTile)}</div>
      </div>

      {/* Tablet / desktop: fills the available space, tile count per row chosen per screen.
          A leftover partial row (when 50 isn't a clean multiple of the chosen column
          count) is centered on its own line rather than left-padded with blank cells. */}
      <div ref={containerRef} className="hidden md:flex md:flex-1 md:min-h-0 md:flex-col md:items-center md:justify-center px-6 gap-2.5">
        {layout.tileW > 0 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${layout.cols}, ${layout.tileW}px)`,
                gridAutoRows: `${layout.tileH}px`,
                gap: `${GAP}px`,
              }}
            >
              {fullRowTiles.map(renderTile)}
            </div>
            {remainderTiles.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: `${GAP}px`,
                }}
              >
                {remainderTiles.map((t) => (
                  <div key={t.symbol} style={{ width: layout.tileW, height: layout.tileH }}>
                    {renderTile(t)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <p className="px-5 md:px-6 mt-4 md:mt-2 md:shrink-0 text-[11px]" style={{ color: 'var(--color-ink-soft)' }}>
        Showing {tiles.length} large-cap NSE names. Colors and % reflect mock live movement today — wired to Sharekhan live quotes in Phase 2.
      </p>
    </div>
  )
}
