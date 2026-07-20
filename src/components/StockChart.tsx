import { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Bell } from 'lucide-react'
import { getRangeHistory, withMovingAverages, type RangeKey } from '../lib/marketData'

const RANGES: RangeKey[] = ['1M', '6M', '1Yr', '3Yr', '5Yr', '10Yr', 'Max']

interface Props {
  symbol: string
  positive: boolean
}

function formatDateTick(iso: string, range: RangeKey) {
  const d = new Date(iso)
  if (range === '1M') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  if (range === '6M' || range === '1Yr') return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export default function StockChart({ symbol, positive }: Props) {
  const [range, setRange] = useState<RangeKey>('1Yr')
  const [showDma50, setShowDma50] = useState(false)
  const [showDma200, setShowDma200] = useState(false)
  const [showVolume, setShowVolume] = useState(true)
  const [data, setData] = useState<ReturnType<typeof withMovingAverages>>([])

  useEffect(() => {
    const raw = getRangeHistory(symbol, range)
    setData(withMovingAverages(symbol, raw))
  }, [symbol, range])

  const lineColor = positive ? '#1E6B4F' : '#A23B2E'

  const maxVolume = useMemo(() => Math.max(...data.map((d) => d.volume), 1), [data])

  return (
    <div>
      {/* Controls row */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="tap-tile rounded-md px-2 py-1 text-[11px] font-medium"
              style={{
                background: range === r ? 'var(--color-ledger-green-deep)' : 'transparent',
                color: range === r ? 'var(--color-ledger-green)' : 'var(--color-ink-soft)',
                border: `1px solid ${range === r ? 'var(--color-ledger-green)' : 'var(--color-paper-line)'}`,
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          className="tap-tile flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border"
          style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
        >
          <Bell size={12} /> Alerts
        </button>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-paper-line)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDateTick(v, range)}
              tick={{ fontSize: 10, fill: 'var(--color-ink-soft)' }}
              minTickGap={40}
              axisLine={{ stroke: 'var(--color-paper-line)' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="price"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--color-ink-soft)' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            {showVolume && (
              <YAxis yAxisId="volume" orientation="right" domain={[0, maxVolume * 4]} hide />
            )}
            <Tooltip
              formatter={(value, name) => {
                const v = typeof value === 'number' ? value : Number(value)
                if (name === 'volume') return [v.toLocaleString('en-IN'), 'Volume']
                if (name === 'close') return [`₹${v.toFixed(2)}`, 'Price']
                if (name === 'dma50') return [`₹${v.toFixed(2)}`, '50 DMA']
                if (name === 'dma200') return [`₹${v.toFixed(2)}`, '200 DMA']
                return [String(value), String(name)]
              }}
              labelFormatter={(v) => new Date(v as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              contentStyle={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-paper-line)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            {showVolume && (
              <Bar yAxisId="volume" dataKey="volume" fill="var(--color-gold)" opacity={0.22} isAnimationActive={false} />
            )}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
            {showDma50 && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="dma50"
                stroke="#C99A2E"
                strokeWidth={1.25}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}
            {showDma200 && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="dma200"
                stroke="#5B7DB1"
                strokeWidth={1.25}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / toggles */}
      <div className="flex items-center gap-4 mt-1 flex-wrap text-[11px]" style={{ color: 'var(--color-ink-soft)' }}>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked readOnly className="accent-[var(--color-ledger-green)]" />
          Price on NSE
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showDma50}
            onChange={(e) => setShowDma50(e.target.checked)}
            className="accent-[var(--color-gold)]"
          />
          50 DMA
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showDma200}
            onChange={(e) => setShowDma200(e.target.checked)}
            className="accent-[#5B7DB1]"
          />
          200 DMA
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showVolume}
            onChange={(e) => setShowVolume(e.target.checked)}
            className="accent-[var(--color-gold)]"
          />
          Volume
        </label>
      </div>
    </div>
  )
}
