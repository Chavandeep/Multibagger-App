import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { COMPANIES } from '../data/companies'
import { getMultibaggerScore, type MultibaggerScore } from '../lib/fundamentals'
import PageHeader from '../components/PageHeader'

interface Pick {
  symbol: string
  name: string
  sector: string
  mb: MultibaggerScore
}

export default function MultibaggerPicksPage() {
  const [picks, setPicks] = useState<Pick[]>([])

  useEffect(() => {
    Promise.resolve().then(() => {
      const scored = COMPANIES.map((c) => ({
        symbol: c.symbol,
        name: c.name,
        sector: c.sector,
        mb: getMultibaggerScore(c.symbol)!,
      }))
        .sort((a, b) => b.mb.score - a.mb.score)
        .slice(0, 4)
      setPicks(scored)
    })
  }, [])

  return (
    <div className="ledger-bg min-h-full pb-24">
      <PageHeader title="Multibagger Picks" subtitle="Today's shortlist — how this actually works, below" />

      <div className="px-5 md:px-6">
        <div
          className="rounded-lg border p-4 mb-5"
          style={{ background: 'var(--color-ledger-green-deep)', borderColor: 'var(--color-gold)' }}
        >
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--color-gold)' }}>
            <Sparkles size={15} /> This is a preview, not the real engine yet
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink)' }}>
            The 4 stocks below are today's highest scorers on the same transparent 6-factor Multibagger Score shown
            on each company page — nothing more. The real version of this feature is a much bigger build: modeling
            how specific well-known investors actually read markets and cycles, then cross-referencing that against
            current fundamentals and sector timing to surface genuine multibagger candidates. That's a separate
            phase we'll build next — this page is here so you can see the shortlist format while we design it.
          </p>
        </div>
      </div>

      <div className="px-5 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {picks.map((p, i) => (
          <Link
            key={p.symbol}
            to={`/company/${p.symbol}`}
            className="tap-tile rounded-lg border p-4 block relative"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-gold)', borderWidth: 1.5 }}
          >
            <span
              className="absolute -top-2 -left-2 flex items-center justify-center rounded-full font-mono font-semibold text-xs"
              style={{ width: 22, height: 22, background: 'var(--color-gold)', color: 'var(--color-ledger-green)' }}
            >
              {i + 1}
            </span>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                  {p.symbol}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                  {p.name} · {p.sector}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-semibold" style={{ color: 'var(--color-gold)' }}>
                  {p.mb.score}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-ink-soft)' }}>
                  {p.mb.label}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-col gap-1">
              {p.mb.factors
                .slice()
                .sort((a, b) => b.score - a.score)
                .slice(0, 2)
                .map((f) => (
                  <p key={f.label} className="text-[11px]" style={{ color: 'var(--color-ink-soft)' }}>
                    <span style={{ color: 'var(--color-gain)' }}>▲</span> {f.label}: {f.detail}
                  </p>
                ))}
            </div>
            <p
              className="mt-2.5 text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--color-ledger-green)' }}
            >
              View full profile <ArrowRight size={13} />
            </p>
          </Link>
        ))}
      </div>

      <p className="px-5 md:px-6 mt-5 text-[10px]" style={{ color: 'var(--color-ink-soft)' }}>
        Not investment advice. Scores run on mock fundamentals today — see each company's page for the full factor
        breakdown and the Wiring in Sharekhan section of the README for what's real vs. placeholder.
      </p>
    </div>
  )
}
