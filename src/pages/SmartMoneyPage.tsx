import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { getBulkDeals, type BulkDeal } from '../lib/marketData'
import PageHeader from '../components/PageHeader'

export default function SmartMoneyPage() {
  const [deals, setDeals] = useState<BulkDeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBulkDeals().then((d) => {
      setDeals(d)
      setLoading(false)
    })
  }, [])

  return (
    <div className="ledger-bg min-h-full pb-24">
      <PageHeader title="Smart Money" subtitle="Bulk & block deals from big bulls and institutions" />

      <div className="mx-5 md:mx-6 mb-4 rounded-md px-3 py-2 text-[11px]" style={{ background: 'var(--color-ledger-green-deep)', color: 'var(--color-ink-soft)' }}>
        Sourced from NSE/BSE end-of-day bulk deal reports — updated once daily, not real-time.
      </div>

      {loading && (
        <p className="px-5 md:px-6 text-sm" style={{ color: 'var(--color-ink-soft)' }}>
          Loading today's deals…
        </p>
      )}

      <div className="px-5 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {deals.map((deal, i) => (
          <div
            key={i}
            className="rounded-lg border p-3.5"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-paper-line)' }}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                {deal.investor}
              </p>
              <span className="text-[11px] font-mono" style={{ color: 'var(--color-ink-soft)' }}>
                {new Date(deal.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                {deal.dealType === 'BUY' ? (
                  <ArrowUpRight size={16} color="var(--color-gain)" />
                ) : (
                  <ArrowDownRight size={16} color="var(--color-loss)" />
                )}
                <span
                  className="text-[11px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded-sm"
                  style={{
                    color: deal.dealType === 'BUY' ? 'var(--color-gain)' : 'var(--color-loss)',
                    background: deal.dealType === 'BUY' ? '#1E6B4F14' : '#A23B2E14',
                  }}
                >
                  {deal.dealType}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                  {deal.symbol}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                {(deal.quantity / 100000).toFixed(1)}L shares @ ₹{deal.avgPrice.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
