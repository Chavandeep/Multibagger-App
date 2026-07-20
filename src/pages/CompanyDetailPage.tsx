import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ArrowUp, ArrowDown, CircleCheck, CircleAlert } from 'lucide-react'
import { db } from '../lib/db'
import {
  getCompany,
  getOverview,
  getProsAndCons,
  getQuarterlyResults,
  getYearlyPL,
  getBalanceSheet,
  getCashFlow,
  getRatios,
  getShareholding,
  getPeers,
  getMultibaggerScore,
  type Overview,
} from '../lib/fundamentals'
import StockChart from '../components/StockChart'
import Section from '../components/Section'
import FinancialTable from '../components/FinancialTable'

function cr(n: number) {
  return n.toLocaleString('en-IN')
}

export default function CompanyDetailPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const company = symbol ? getCompany(symbol) : undefined
  const entry = useLiveQuery(() => (symbol ? db.watchlist.where('symbol').equals(symbol).first() : undefined), [symbol])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!symbol) return
    setOverview(getOverview(symbol))
  }, [symbol])

  if (!symbol || !company || !overview) {
    return (
      <div className="ledger-bg min-h-full flex items-center justify-center">
        <p style={{ color: 'var(--color-ink-soft)' }}>Loading…</p>
      </div>
    )
  }

  const { pros, cons } = getProsAndCons(symbol)
  const mbScore = getMultibaggerScore(symbol)
  const quarterly = getQuarterlyResults(symbol)
  const yearlyPL = getYearlyPL(symbol)
  const balanceSheet = getBalanceSheet(symbol)
  const cashFlow = getCashFlow(symbol)
  const ratios = getRatios(symbol)
  const shareholding = getShareholding(symbol)
  const peers = getPeers(symbol)

  const positive = overview.dayChangePct >= 0
  const lockedPct = entry ? ((overview.currentPrice - entry.lockedPrice) / entry.lockedPrice) * 100 : null

  return (
    <div className="ledger-bg min-h-full pb-24">
      <header className="px-5 md:px-6 pt-6 pb-1 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="tap-tile p-1 -ml-1" aria-label="Back">
          <ChevronLeft size={22} color="var(--color-ledger-green)" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ledger-green)' }}>
            {company.name}
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>
            {symbol} · {company.sector}
          </p>
        </div>
      </header>

      {/* Price header */}
      <div className="px-5 md:px-6 mt-3">
        <div className="flex items-end gap-2">
          <p className="font-mono text-4xl font-semibold" style={{ color: 'var(--color-ink)' }}>
            ₹{overview.currentPrice.toFixed(2)}
          </p>
          <span
            className="flex items-center gap-0.5 mb-1.5 font-mono text-sm font-medium"
            style={{ color: positive ? 'var(--color-gain)' : 'var(--color-loss)' }}
          >
            {positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(overview.dayChangePct).toFixed(2)}% today
          </span>
        </div>

        <div className="mt-3 rounded-lg border p-3" style={{ background: 'var(--color-card)', borderColor: 'var(--color-paper-line)' }}>
          <StockChart symbol={symbol} positive={positive} />
          <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--color-ink-soft)' }}>
            52w: ₹{overview.low52.toFixed(0)} – ₹{overview.high52.toFixed(0)}
          </p>
        </div>
      </div>

      {entry && lockedPct != null && (
        <div className="px-5 md:px-6 mt-3">
          <div className="rounded-lg border p-3.5" style={{ background: 'var(--color-ledger-green-deep)', borderColor: 'var(--color-gold)' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
              On your watchlist — since you locked it in
            </p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                ₹{entry.lockedPrice.toFixed(2)} on {entry.lockedDate}
              </p>
              <p className="font-mono text-lg font-semibold" style={{ color: lockedPct >= 0 ? 'var(--color-gain)' : 'var(--color-loss)' }}>
                {lockedPct >= 0 ? '+' : ''}
                {lockedPct.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {!entry && (
        <div className="px-5 md:px-6 mt-3">
          <button
            onClick={async () => {
              if (adding) return
              setAdding(true)
              await db.watchlist.add({
                symbol,
                name: company.name,
                sector: company.sector,
                lockedPrice: overview.currentPrice,
                lockedDate: new Date().toISOString().slice(0, 10),
              })
              setAdding(false)
            }}
            disabled={adding}
            className="tap-tile w-full text-center rounded-md py-2.5 text-sm font-medium disabled:opacity-60"
            style={{ background: 'var(--color-ledger-green)', color: 'var(--color-paper)' }}
          >
            {adding ? 'Adding…' : `+ Add ${symbol} to watchlist at ₹${overview.currentPrice.toFixed(2)}`}
          </button>
        </div>
      )}

      {/* Key stats */}
      <Section title="Key Stats">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2.5 text-sm">
          <Stat label="Market Cap" value={`₹${cr(overview.marketCapCr)} Cr`} />
          <Stat label="Stock P/E" value={overview.stockPE.toFixed(1)} />
          <Stat label="Book Value" value={`₹${overview.bookValue}`} />
          <Stat label="Dividend Yield" value={`${overview.dividendYield.toFixed(2)}%`} />
          <Stat label="ROCE" value={`${overview.roce.toFixed(1)}%`} />
          <Stat label="ROE" value={`${overview.roe.toFixed(1)}%`} />
          <Stat label="Face Value" value={`₹${overview.faceValue}`} />
          <Stat label="52W High/Low" value={`₹${overview.high52.toFixed(0)} / ₹${overview.low52.toFixed(0)}`} />
        </div>
      </Section>

      <Section title="About">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink)' }}>
          {overview.about}
        </p>
      </Section>

      {/* Pros / Cons */}
      <section className="px-5 md:px-6 mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border p-3.5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-gain)' }}>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-gain)' }}>
            <CircleCheck size={15} /> Pros
          </h3>
          <ul className="text-xs space-y-1.5" style={{ color: 'var(--color-ink)' }}>
            {pros.map((p, i) => (
              <li key={i} className="flex gap-1.5">
                <span style={{ color: 'var(--color-gain)' }}>•</span> {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border p-3.5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-loss)' }}>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-loss)' }}>
            <CircleAlert size={15} /> Cons
          </h3>
          <ul className="text-xs space-y-1.5" style={{ color: 'var(--color-ink)' }}>
            {cons.map((c, i) => (
              <li key={i} className="flex gap-1.5">
                <span style={{ color: 'var(--color-loss)' }}>•</span> {c}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <p className="px-5 md:px-6 mt-2 text-[10px]" style={{ color: 'var(--color-ink-soft)' }}>
        Pros and cons are generated from the mock fundamentals model for this demo.
      </p>

      {/* Peer comparison */}
      {peers.length > 0 && (
        <Section title="Peer Comparison" subtitle={`Other ${company.sector} names`}>
          <FinancialTable
            periods={peers.map((p) => p.symbol)}
            rows={[
              { label: 'CMP ₹', values: peers.map((p) => p.cmp.toFixed(2)) },
              { label: 'P/E', values: peers.map((p) => p.pe.toFixed(1)) },
              { label: 'Mkt Cap Cr', values: peers.map((p) => cr(p.marketCapCr)) },
              { label: 'Div Yld %', values: peers.map((p) => p.divYieldPct.toFixed(2)) },
              { label: 'NP Qtr Cr', values: peers.map((p) => cr(p.npQtrCr)) },
              { label: 'Qtr Profit Var %', values: peers.map((p) => (p.qtrProfitVarPct >= 0 ? '+' : '') + p.qtrProfitVarPct.toFixed(1)) },
              { label: 'ROCE %', values: peers.map((p) => p.rocePct.toFixed(1)) },
            ]}
          />
        </Section>
      )}

      {/* Quarterly Results */}
      <Section title="Quarterly Results" subtitle="Consolidated figures in ₹ Crores">
        <FinancialTable
          periods={quarterly.map((q) => q.label)}
          rows={[
            { label: 'Sales', values: quarterly.map((q) => cr(q.sales)) },
            { label: 'Expenses', values: quarterly.map((q) => cr(q.expenses)) },
            { label: 'Operating Profit', values: quarterly.map((q) => cr(q.operatingProfit)), bold: true },
            { label: 'OPM %', values: quarterly.map((q) => q.opmPct + '%') },
            { label: 'Other Income', values: quarterly.map((q) => cr(q.otherIncome)) },
            { label: 'Interest', values: quarterly.map((q) => cr(q.interest)) },
            { label: 'Depreciation', values: quarterly.map((q) => cr(q.depreciation)) },
            { label: 'Profit before tax', values: quarterly.map((q) => cr(q.pbt)), bold: true },
            { label: 'Tax %', values: quarterly.map((q) => q.taxPct + '%') },
            { label: 'Net Profit', values: quarterly.map((q) => cr(q.netProfit)), bold: true },
            { label: 'EPS ₹', values: quarterly.map((q) => q.eps.toFixed(2)) },
          ]}
        />
      </Section>

      {/* Profit & Loss */}
      <Section title="Profit & Loss" subtitle="Consolidated figures in ₹ Crores">
        <FinancialTable
          periods={yearlyPL.map((q) => q.label)}
          rows={[
            { label: 'Sales', values: yearlyPL.map((q) => cr(q.sales)) },
            { label: 'Expenses', values: yearlyPL.map((q) => cr(q.expenses)) },
            { label: 'Operating Profit', values: yearlyPL.map((q) => cr(q.operatingProfit)), bold: true },
            { label: 'OPM %', values: yearlyPL.map((q) => q.opmPct + '%') },
            { label: 'Net Profit', values: yearlyPL.map((q) => cr(q.netProfit)), bold: true },
            { label: 'EPS ₹', values: yearlyPL.map((q) => q.eps.toFixed(2)) },
          ]}
        />
      </Section>

      {/* Balance Sheet */}
      <Section title="Balance Sheet" subtitle="Consolidated figures in ₹ Crores">
        <FinancialTable
          periods={balanceSheet.map((b) => b.label)}
          rows={[
            { label: 'Equity Capital', values: balanceSheet.map((b) => cr(b.equityCapital)) },
            { label: 'Reserves', values: balanceSheet.map((b) => cr(b.reserves)) },
            { label: 'Borrowings', values: balanceSheet.map((b) => cr(b.borrowings)) },
            { label: 'Other Liabilities', values: balanceSheet.map((b) => cr(b.otherLiabilities)) },
            { label: 'Total Liabilities', values: balanceSheet.map((b) => cr(b.totalLiabilities)), bold: true },
            { label: 'Fixed Assets', values: balanceSheet.map((b) => cr(b.fixedAssets)) },
            { label: 'CWIP', values: balanceSheet.map((b) => cr(b.cwip)) },
            { label: 'Investments', values: balanceSheet.map((b) => cr(b.investments)) },
            { label: 'Other Assets', values: balanceSheet.map((b) => cr(b.otherAssets)) },
          ]}
        />
      </Section>

      {/* Cash Flow */}
      <Section title="Cash Flows" subtitle="Consolidated figures in ₹ Crores">
        <FinancialTable
          periods={cashFlow.map((c) => c.label)}
          rows={[
            { label: 'Cash from Operating', values: cashFlow.map((c) => cr(c.cfo)) },
            { label: 'Cash from Investing', values: cashFlow.map((c) => cr(c.cfi)) },
            { label: 'Cash from Financing', values: cashFlow.map((c) => cr(c.cff)) },
            { label: 'Net Cash Flow', values: cashFlow.map((c) => cr(c.netCashFlow)), bold: true },
            { label: 'Free Cash Flow', values: cashFlow.map((c) => cr(c.fcf)) },
            { label: 'CFO/OP %', values: cashFlow.map((c) => c.cfoOpPct + '%') },
          ]}
        />
      </Section>

      {/* Ratios */}
      <Section title="Ratios">
        <FinancialTable
          periods={ratios.map((r) => r.label)}
          rows={[
            { label: 'Debtor Days', values: ratios.map((r) => r.debtorDays) },
            { label: 'Inventory Days', values: ratios.map((r) => r.inventoryDays) },
            { label: 'Days Payable', values: ratios.map((r) => r.daysPayable) },
            { label: 'Cash Conversion Cycle', values: ratios.map((r) => r.cashConversionCycle), bold: true },
            { label: 'Working Capital Days', values: ratios.map((r) => r.workingCapitalDays) },
            { label: 'ROCE %', values: ratios.map((r) => r.rocePct + '%') },
          ]}
        />
      </Section>

      {/* Shareholding Pattern */}
      <Section title="Shareholding Pattern" subtitle="Numbers in percentages">
        <FinancialTable
          periods={shareholding.map((s) => s.label)}
          rows={[
            { label: 'Promoters', values: shareholding.map((s) => s.promoters.toFixed(2) + '%') },
            { label: 'FIIs', values: shareholding.map((s) => s.fii.toFixed(2) + '%') },
            { label: 'DIIs', values: shareholding.map((s) => s.dii.toFixed(2) + '%') },
            { label: 'Government', values: shareholding.map((s) => s.government.toFixed(2) + '%') },
            { label: 'Public', values: shareholding.map((s) => s.public_.toFixed(2) + '%') },
            { label: 'Others', values: shareholding.map((s) => s.others.toFixed(2) + '%') },
          ]}
        />
      </Section>

      {/* Multibagger Score — deliberately last: a research add-on, not the headline */}
      {mbScore && (
        <section className="px-5 md:px-6 mt-5">
          <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ledger-green)' }}>
            Multibagger Score
          </h2>
          <p className="text-[11px] mb-2.5" style={{ color: 'var(--color-ink-soft)' }}>
            A transparent factor screen, not a prediction — see how it's built below
          </p>
          <div
            className="rounded-lg border p-4"
            style={{
              background: 'var(--color-card)',
              borderColor: mbScore.score >= 72 ? 'var(--color-gold)' : 'var(--color-paper-line)',
              borderWidth: mbScore.score >= 72 ? 1.5 : 1,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 64,
                  height: 64,
                  background: `conic-gradient(${mbScore.score >= 72 ? 'var(--color-gold)' : mbScore.score >= 50 ? 'var(--color-gain)' : 'var(--color-loss)'} ${mbScore.score * 3.6}deg, var(--color-paper-line) 0deg)`,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full font-mono font-semibold"
                  style={{ width: 52, height: 52, background: 'var(--color-card)', color: 'var(--color-ink)' }}
                >
                  {mbScore.score}
                </div>
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: mbScore.score >= 72 ? 'var(--color-gold)' : mbScore.score >= 50 ? 'var(--color-gain)' : 'var(--color-loss)',
                  }}
                >
                  {mbScore.label}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-ink-soft)' }}>
                  Composite of 6 fundamental & momentum factors below
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              {mbScore.factors.map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span style={{ color: 'var(--color-ink)' }}>{f.label}</span>
                    <span className="font-mono" style={{ color: 'var(--color-ink-soft)' }}>
                      {f.score}/100
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-paper-line)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${f.score}%`,
                        background: f.score >= 65 ? 'var(--color-gain)' : f.score >= 40 ? 'var(--color-gold)' : 'var(--color-loss)',
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-ink-soft)' }}>
                    {f.detail}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-[10px] mt-3 pt-3 border-t" style={{ color: 'var(--color-ink-soft)', borderColor: 'var(--color-paper-line)' }}>
              This score is a research aid built from public-style fundamentals and mock momentum data — it is not
              investment advice, not a guarantee of future returns, and no model (including this one) can reliably
              predict which stock becomes a multibagger. Always do your own research or consult a licensed advisor.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-ink-soft)' }}>
        {label}
      </p>
      <p className="font-mono font-medium mt-0.5" style={{ color: 'var(--color-ink)' }}>
        {value}
      </p>
    </div>
  )
}
