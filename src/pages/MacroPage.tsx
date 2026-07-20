import { useEffect, useState } from 'react'
import { Landmark, Globe2, Fuel, DollarSign, CloudSun, ExternalLink } from 'lucide-react'
import { getMacroAlerts, type MacroAlert } from '../lib/marketData'
import PageHeader from '../components/PageHeader'

const categoryIcon: Record<MacroAlert['category'], typeof Landmark> = {
  Policy: Landmark,
  'FII/FDI': Globe2,
  Commodity: Fuel,
  Currency: DollarSign,
  Weather: CloudSun,
}

function timeAgo(iso: string) {
  const hrs = Math.round((Date.now() - new Date(iso).getTime()) / 3.6e6)
  if (hrs < 1) return 'just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default function MacroPage() {
  const [alerts, setAlerts] = useState<MacroAlert[]>([])

  useEffect(() => {
    getMacroAlerts().then(setAlerts)
  }, [])

  return (
    <div className="ledger-bg min-h-full pb-24">
      <PageHeader title="Macro & Policy Scan" subtitle="Government moves and global signals, matched to sectors" />

      <div className="px-5 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {alerts.map((alert) => {
          const Icon = categoryIcon[alert.category]
          const tint =
            alert.impact === 'positive' ? 'var(--color-gain)' : alert.impact === 'negative' ? 'var(--color-loss)' : 'var(--color-ink-soft)'
          const Wrapper = alert.url ? 'a' : 'div'
          const wrapperProps = alert.url ? { href: alert.url, target: '_blank', rel: 'noopener noreferrer' } : {}
          return (
            <Wrapper
              key={alert.id}
              {...wrapperProps}
              className={`rounded-lg border p-3.5 block ${alert.url ? 'tap-tile' : ''}`}
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-paper-line)' }}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0 rounded-full p-1.5" style={{ background: 'var(--color-ledger-green-deep)' }}>
                  <Icon size={14} color="var(--color-ledger-green)" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug" style={{ color: 'var(--color-ink)' }}>
                      {alert.headline}
                    </p>
                    {alert.url && <ExternalLink size={13} className="shrink-0 mt-0.5" color="var(--color-ink-soft)" />}
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-ink-soft)' }}>
                      {alert.category} · {timeAgo(alert.date)}
                      {alert.source && ` · ${alert.source.replace(/\.(com|in)$/, '')}`}
                    </span>
                    {alert.sectors.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
                        style={{ color: tint, background: `${tint}14` }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Wrapper>
          )
        })}
      </div>
    </div>
  )
}
