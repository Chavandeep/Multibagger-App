import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { searchSymbols, getQuote } from '../lib/marketData'
import { db } from '../lib/db'
import PageHeader from '../components/PageHeader'

export default function AddStockPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ symbol: string; name: string; sector: string }[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [locked, setLocked] = useState<{ price: number } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    searchSymbols(query).then(setResults)
  }, [query])

  async function handleSelect(symbol: string) {
    setSelected(symbol)
    setConfirming(true)
    const q = await getQuote(symbol)
    if (q) setLocked({ price: q.price })
  }

  async function confirmLock() {
    if (!selected || !locked) return
    const stock = results.find((r) => r.symbol === selected) ?? (await searchSymbols(selected))[0]
    if (!stock) return
    await db.watchlist.add({
      symbol: selected,
      name: stock.name,
      sector: stock.sector,
      lockedPrice: locked.price,
      lockedDate: new Date().toISOString().slice(0, 10),
    })
    navigate('/watchlist')
  }

  if (confirming && selected && locked) {
    const stock = results.find((r) => r.symbol === selected)
    return (
      <div className="ledger-bg min-h-full pb-24 flex flex-col">
        <PageHeader title="Lock it in" subtitle="This price and date become your baseline" />
        <div className="px-5 md:px-6 mt-4">
          <div className="rounded-lg border p-6 text-center" style={{ background: 'var(--color-card)', borderColor: 'var(--color-gold)' }}>
            <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ledger-green)' }}>
              {selected}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-soft)' }}>
              {stock?.name ?? ''} · {stock?.sector ?? ''}
            </p>
            <p className="font-mono text-3xl font-semibold mt-4" style={{ color: 'var(--color-ink)' }}>
              ₹{locked.price.toFixed(2)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-ink-soft)' }}>
              Locked as of {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setConfirming(false)}
              className="tap-tile flex-1 rounded-md py-3 text-sm font-medium border"
              style={{ borderColor: 'var(--color-paper-line)', color: 'var(--color-ink-soft)' }}
            >
              Back
            </button>
            <button
              onClick={confirmLock}
              className="tap-tile flex-1 rounded-md py-3 text-sm font-medium flex items-center justify-center gap-1.5"
              style={{ background: 'var(--color-ledger-green)', color: 'var(--color-paper)' }}
            >
              <Check size={16} /> Confirm & track
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ledger-bg min-h-full pb-24">
      <PageHeader title="Add to Watchlist" subtitle="Tap a stock — no typing required" />

      <div className="px-5 md:px-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or symbol (optional)"
          className="w-full rounded-md border px-3 py-2.5 text-sm mb-4"
          style={{ borderColor: 'var(--color-paper-line)', background: 'var(--color-card)', color: 'var(--color-ink)' }}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => handleSelect(r.symbol)}
              className="tap-tile rounded-lg border p-3.5 text-left"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-paper-line)' }}
            >
              <p className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                {r.symbol}
              </p>
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-ink-soft)' }}>
                {r.name}
              </p>
              <p
                className="text-[10px] font-mono uppercase tracking-wide mt-1.5 inline-block px-1.5 py-0.5 rounded-sm"
                style={{ background: 'var(--color-ledger-green-deep)', color: 'var(--color-ledger-green)' }}
              >
                {r.sector}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
