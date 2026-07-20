import { useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Trash2, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { db, type WatchlistEntry } from '../lib/db'
import { getQuotes, getHistory, type Quote } from '../lib/marketData'
import Sparkline from '../components/Sparkline'
import PageHeader from '../components/PageHeader'

export default function WatchlistPage() {
  const entries = useLiveQuery(() => db.watchlist.toArray(), [])
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [histories, setHistories] = useState<Record<string, number[]>>({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (list: WatchlistEntry[]) => {
    if (list.length === 0) {
      setLoading(false)
      return
    }
    const symbols = list.map((e) => e.symbol)
    const [qs, hists] = await Promise.all([
      getQuotes(symbols),
      Promise.all(symbols.map(async (s) => [s, (await getHistory(s, 30)).map((h) => h.close)] as const)),
    ])
    setQuotes(Object.fromEntries(qs.map((q) => [q.symbol, q])))
    setHistories(Object.fromEntries(hists))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (entries) refresh(entries)
  }, [entries, refresh])

  async function removeEntry(id?: number) {
    if (id == null) return
    await db.watchlist.delete(id)
  }

  return (
    <div className="ledger-bg min-h-full pb-24">
      <PageHeader
        title="Smart Watchlist"
        subtitle="Locked entry price vs. today, at a glance"
        action={
          <Link
            to="/add"
            aria-label="Add stock to watchlist"
            className="tap-tile shrink-0 flex flex-col items-center justify-center rounded-lg gap-0.5"
            style={{ width: 48, height: 48, background: 'var(--color-ledger-green)' }}
          >
            <Plus size={18} color="var(--color-paper)" strokeWidth={2.4} />
            <span className="text-[8.5px] font-medium leading-none" style={{ color: 'var(--color-paper)' }}>
              Add
            </span>
          </Link>
        }
      />

      {!loading && entries && entries.length === 0 && (
        <div className="mx-5 md:mx-6 mt-8 rounded-lg border border-dashed p-8 text-center" style={{ borderColor: 'var(--color-paper-line)' }}>
          <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>
            Nothing locked in yet. Tap the green <span className="font-semibold">+</span> button to start tracking a stock from today's price.
          </p>
        </div>
      )}

      <div className="px-5 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        {entries?.map((entry) => {
          const q = quotes[entry.symbol]
          const hist = histories[entry.symbol]
          if (!q) return null
          const change = q.price - entry.lockedPrice
          const pct = (change / entry.lockedPrice) * 100
          const positive = change >= 0
          const isMultibagger = pct >= 100

          return (
            <Link
              key={entry.id}
              to={`/company/${entry.symbol}`}
              className="tap-tile rounded-lg border p-4 block relative"
              style={{
                background: 'var(--color-card)',
                borderColor: isMultibagger ? 'var(--color-gold)' : 'var(--color-paper-line)',
                borderWidth: isMultibagger ? 1.5 : 1,
              }}
            >
              {isMultibagger && (
                <span
                  className="absolute -top-2 left-3 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm"
                  style={{ background: 'var(--color-gold)', color: 'var(--color-ledger-green)' }}
                >
                  Multibagger
                </span>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[15px]" style={{ color: 'var(--color-ink)' }}>
                    {entry.symbol}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                    {entry.sector} · locked {entry.lockedDate}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    removeEntry(entry.id)
                  }}
                  className="tap-tile p-1.5 -mr-1.5 -mt-1"
                  aria-label={`Remove ${entry.symbol} from watchlist`}
                >
                  <Trash2 size={16} color="var(--color-ink-soft)" />
                </button>
              </div>

              <div className="flex items-end justify-between mt-3">
                <div>
                  <p className="font-mono text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                    ₹{q.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {positive ? (
                      <TrendingUp size={14} color="var(--color-gain)" />
                    ) : (
                      <TrendingDown size={14} color="var(--color-loss)" />
                    )}
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: positive ? 'var(--color-gain)' : 'var(--color-loss)' }}
                    >
                      {positive ? '+' : ''}
                      {pct.toFixed(1)}% since ₹{entry.lockedPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                {hist && <Sparkline points={hist} positive={positive} />}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
