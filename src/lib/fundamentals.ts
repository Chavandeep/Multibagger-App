// ─────────────────────────────────────────────────────────────────────────
// FUNDAMENTALS PROVIDER
//
// Same seam pattern as marketData.ts: pages only call these functions, never
// touch a data source directly. Today it's deterministic mock data shaped
// exactly like Screener.in's sections. Fundamentals (P&L, balance sheet,
// shareholding, etc.) are NOT something the Sharekhan trading API provides —
// that API is for quotes/orders/holdings. A real version of this file would
// call a fundamentals data vendor (e.g. screener.in has no public API;
// alternatives include Tijori Finance, Trendlyne, or licensed data from
// exchanges/rating agencies).
// ─────────────────────────────────────────────────────────────────────────

import { COMPANIES, type Company } from '../data/companies'

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return () => {
    h = (Math.imul(48271, h) + 12345) | 0
    return ((h >>> 0) % 10000) / 10000
  }
}

export function getCompany(symbol: string): Company | undefined {
  return COMPANIES.find((c) => c.symbol === symbol)
}

export interface Overview {
  currentPrice: number
  dayChangePct: number
  marketCapCr: number
  stockPE: number
  bookValue: number
  dividendYield: number
  roce: number
  roe: number
  faceValue: number
  high52: number
  low52: number
  about: string
}

export function getOverview(symbol: string): Overview | null {
  const c = getCompany(symbol)
  if (!c) return null
  const rand = seededRandom(symbol + new Date().toISOString().slice(0, 13))
  const dayChangePct = +((rand() - 0.48) * 3.4).toFixed(2)
  const currentPrice = +(c.basePrice * (1 + dayChangePct / 100)).toFixed(2)
  const roe = +(12 + rand() * 26).toFixed(1)
  const roce = +(roe * (0.9 + rand() * 0.35)).toFixed(1)
  const stockPE = +(10 + rand() * 35).toFixed(1)
  const bookValue = +(currentPrice / (1.2 + rand() * 3)).toFixed(0)
  const dividendYield = +(rand() * 4.5).toFixed(2)

  return {
    currentPrice,
    dayChangePct,
    marketCapCr: Math.round(c.baseMarketCapCr * (1 + dayChangePct / 100)),
    stockPE,
    bookValue,
    dividendYield,
    roce,
    roe,
    faceValue: [1, 2, 5, 10][Math.floor(rand() * 4)],
    high52: +(currentPrice * (1.08 + rand() * 0.25)).toFixed(0),
    low52: +(currentPrice * (0.6 + rand() * 0.2)).toFixed(0),
    about: `${c.name} operates in the ${c.sector} sector, offering products and services that serve both domestic and export markets across its core business lines.`,
  }
}

export function getProsAndCons(symbol: string): { pros: string[]; cons: string[] } {
  const rand = seededRandom(symbol + 'proscons')
  const ov = getOverview(symbol)
  const pros: string[] = []
  const cons: string[] = []

  if (ov && ov.dividendYield > 1.5) pros.push(`Stock is providing a good dividend yield of ${ov.dividendYield.toFixed(2)}%.`)
  if (ov && ov.roe > 20) pros.push(`Company has a good return on equity (ROE) track record: 3 Years ROE ${(ov.roe - rand() * 3).toFixed(1)}%.`)
  pros.push(`Company has been maintaining a healthy dividend payout of ${(50 + rand() * 25).toFixed(1)}%.`)
  if (rand() > 0.5) pros.push(`Company's working capital requirements have reduced from ${(35 + rand() * 15).toFixed(1)} days to ${(20 + rand() * 15).toFixed(1)} days.`)

  const promoterChange = +((rand() - 0.6) * 2).toFixed(2)
  if (promoterChange < 0) cons.push(`Promoter holding has decreased over last quarter: ${promoterChange.toFixed(2)}%`)
  if (rand() > 0.5) cons.push(`Company has a low interest coverage ratio.`)
  if (rand() > 0.6) cons.push(`The company has delivered a poor sales growth of ${(2 + rand() * 6).toFixed(1)}% over the past five years.`)
  if (cons.length === 0) cons.push(`Promoter holding is low: ${(10 + rand() * 15).toFixed(1)}%.`)

  return { pros: pros.slice(0, 4), cons: cons.slice(0, 3) }
}

export interface QuarterRow {
  label: string
  sales: number
  expenses: number
  operatingProfit: number
  opmPct: number
  otherIncome: number
  interest: number
  depreciation: number
  pbt: number
  taxPct: number
  netProfit: number
  eps: number
}

function buildPeriodSeries(symbol: string, seedSuffix: string, count: number, labels: string[], baseSalesCr: number): QuarterRow[] {
  const rand = seededRandom(symbol + seedSuffix)
  const rows: QuarterRow[] = []
  let sales = baseSalesCr
  for (let i = 0; i < count; i++) {
    sales = sales * (1 + (rand() - 0.35) * 0.08)
    const opmPct = +(18 + rand() * 14).toFixed(0)
    const operatingProfit = Math.round((sales * opmPct) / 100)
    const expenses = Math.round(sales - operatingProfit)
    const otherIncome = Math.round(sales * (0.01 + rand() * 0.03))
    const interest = Math.round(sales * (0.002 + rand() * 0.01))
    const depreciation = Math.round(sales * (0.02 + rand() * 0.02))
    const pbt = operatingProfit + otherIncome - interest - depreciation
    const taxPct = Math.round(20 + rand() * 8)
    const netProfit = Math.round(pbt * (1 - taxPct / 100))
    const eps = +(netProfit / (rand() * 40 + 20)).toFixed(2)
    rows.push({
      label: labels[i],
      sales: Math.round(sales),
      expenses,
      operatingProfit,
      opmPct,
      otherIncome,
      interest,
      depreciation,
      pbt: Math.round(pbt),
      taxPct,
      netProfit,
      eps,
    })
  }
  return rows
}

export function getQuarterlyResults(symbol: string): QuarterRow[] {
  const c = getCompany(symbol)
  if (!c) return []
  const labels = ['Sep 2023', 'Dec 2023', 'Mar 2024', 'Jun 2024', 'Sep 2024', 'Dec 2024', 'Mar 2025', 'Jun 2025', 'Dec 2025', 'Mar 2026']
  return buildPeriodSeries(symbol, 'quarterly', labels.length, labels, c.baseMarketCapCr * 0.028)
}

export function getYearlyPL(symbol: string): QuarterRow[] {
  const c = getCompany(symbol)
  if (!c) return []
  const startYear = 2017
  const labels = Array.from({ length: 10 }, (_, i) => `Mar ${startYear + i}`)
  return buildPeriodSeries(symbol, 'yearly-pl', labels.length, labels, c.baseMarketCapCr * 0.1)
}

export interface BalanceSheetRow {
  label: string
  equityCapital: number
  reserves: number
  borrowings: number
  otherLiabilities: number
  totalLiabilities: number
  fixedAssets: number
  cwip: number
  investments: number
  otherAssets: number
}

export function getBalanceSheet(symbol: string): BalanceSheetRow[] {
  const c = getCompany(symbol)
  if (!c) return []
  const rand = seededRandom(symbol + 'balance-sheet')
  const labels = Array.from({ length: 8 }, (_, i) => `Mar ${2019 + i}`)
  const rows: BalanceSheetRow[] = []
  let reserves = c.baseMarketCapCr * 0.16
  const equityCapital = Math.round(c.baseMarketCapCr * 0.0045)
  for (const label of labels) {
    reserves = reserves * (1 + 0.06 + rand() * 0.06)
    const borrowings = Math.round(reserves * (0.05 + rand() * 0.15))
    const otherLiabilities = Math.round(reserves * (0.25 + rand() * 0.2))
    const totalLiabilities = Math.round(equityCapital + reserves + borrowings + otherLiabilities)
    const fixedAssets = Math.round(totalLiabilities * (0.25 + rand() * 0.15))
    const cwip = Math.round(totalLiabilities * (0.01 + rand() * 0.02))
    const investments = Math.round(totalLiabilities * (0.1 + rand() * 0.15))
    const otherAssets = Math.round(totalLiabilities - fixedAssets - cwip - investments)
    rows.push({
      label,
      equityCapital,
      reserves: Math.round(reserves),
      borrowings,
      otherLiabilities,
      totalLiabilities,
      fixedAssets,
      cwip,
      investments,
      otherAssets,
    })
  }
  return rows
}

export interface CashFlowRow {
  label: string
  cfo: number
  cfi: number
  cff: number
  netCashFlow: number
  fcf: number
  cfoOpPct: number
}

export function getCashFlow(symbol: string): CashFlowRow[] {
  const c = getCompany(symbol)
  if (!c) return []
  const rand = seededRandom(symbol + 'cash-flow')
  const labels = Array.from({ length: 8 }, (_, i) => `Mar ${2019 + i}`)
  return labels.map((label) => {
    const cfo = Math.round(c.baseMarketCapCr * (0.015 + rand() * 0.02))
    const cfi = Math.round(-c.baseMarketCapCr * (0.005 + rand() * 0.015))
    const cff = Math.round(-c.baseMarketCapCr * (0.005 + rand() * 0.015))
    const netCashFlow = cfo + cfi + cff
    const fcf = Math.round(cfo * (0.75 + rand() * 0.2))
    const cfoOpPct = Math.round(80 + rand() * 30)
    return { label, cfo, cfi, cff, netCashFlow, fcf, cfoOpPct }
  })
}

export interface RatioRow {
  label: string
  debtorDays: number
  inventoryDays: number
  daysPayable: number
  cashConversionCycle: number
  workingCapitalDays: number
  rocePct: number
}

export function getRatios(symbol: string): RatioRow[] {
  const c = getCompany(symbol)
  if (!c) return []
  const rand = seededRandom(symbol + 'ratios')
  const labels = Array.from({ length: 8 }, (_, i) => `Mar ${2019 + i}`)
  return labels.map((label) => {
    const debtorDays = Math.round(30 + rand() * 50)
    const inventoryDays = Math.round(rand() * 40)
    const daysPayable = Math.round(20 + rand() * 40)
    const cashConversionCycle = debtorDays + inventoryDays - daysPayable
    const workingCapitalDays = Math.round(cashConversionCycle * (0.8 + rand() * 0.5))
    const rocePct = Math.round(20 + rand() * 25)
    return { label, debtorDays, inventoryDays, daysPayable, cashConversionCycle, workingCapitalDays, rocePct }
  })
}

export interface ShareholdingRow {
  label: string
  promoters: number
  fii: number
  dii: number
  government: number
  public_: number
  others: number
}

export function getShareholding(symbol: string): ShareholdingRow[] {
  const rand = seededRandom(symbol + 'shareholding')
  const labels = ['Sep 2023', 'Dec 2023', 'Mar 2024', 'Jun 2024', 'Sep 2024', 'Dec 2024', 'Mar 2025', 'Jun 2025', 'Sep 2025', 'Dec 2025', 'Mar 2026', 'Jun 2026']
  let promoters = 20 + rand() * 40
  const government = +(rand() * 0.4).toFixed(2)
  return labels.map((label) => {
    promoters = Math.max(10, promoters + (rand() - 0.52) * 1.2)
    const fii = 15 + rand() * 25
    const dii = 15 + rand() * 25
    const others = +(rand() * 0.4).toFixed(2)
    const public_ = +(100 - promoters - fii - dii - government - others).toFixed(2)
    return {
      label,
      promoters: +promoters.toFixed(2),
      fii: +fii.toFixed(2),
      dii: +dii.toFixed(2),
      government,
      public_,
      others,
    }
  })
}

export interface PeerRow {
  symbol: string
  name: string
  cmp: number
  pe: number
  marketCapCr: number
  divYieldPct: number
  npQtrCr: number
  qtrProfitVarPct: number
  salesQtrCr: number
  qtrSalesVarPct: number
  rocePct: number
}

// ─────────────────────────────────────────────────────────────────────────
// MULTIBAGGER SCORE
//
// This is a transparent, factor-based screening score — the same idea as
// Screener.in's "checklists" or Trendlyne's "durability/momentum/valuation"
// scores — NOT a prediction engine. No model, including ones built by
// professional fund managers, can reliably predict which stock becomes a
// multibagger; anyone claiming otherwise is overselling. What this *can*
// legitimately do is combine well-known fundamental signals (growth,
// profitability, balance-sheet strength, ownership trends, valuation) into
// one comparable number, so you can screen 50 names quickly — the same job
// a human analyst does manually, just faster. Treat it as a research
// starting point, not a recommendation. This is not investment advice.
// ─────────────────────────────────────────────────────────────────────────

export interface ScoreFactor {
  label: string
  score: number // 0-100
  detail: string
}

export interface MultibaggerScore {
  score: number // 0-100 composite
  label: 'High potential' | 'Moderate potential' | 'Low potential'
  factors: ScoreFactor[]
}

export function getMultibaggerScore(symbol: string): MultibaggerScore | null {
  const c = getCompany(symbol)
  if (!c) return null
  const overview = getOverview(symbol)!
  const yearly = getYearlyPL(symbol)
  const shareholding = getShareholding(symbol)
  const balanceSheet = getBalanceSheet(symbol)
  const quarterly = getQuarterlyResults(symbol)

  const first = yearly[0]
  const last = yearly[yearly.length - 1]
  const years = yearly.length - 1
  const salesCagr = (Math.pow(last.sales / first.sales, 1 / years) - 1) * 100
  const profitCagr = (Math.pow(Math.max(last.netProfit, 1) / Math.max(first.netProfit, 1), 1 / years) - 1) * 100

  const growthScore = clamp(((salesCagr + profitCagr) / 2) * 3, 0, 100)

  const profitabilityScore = clamp((overview.roce + overview.roe), 0, 100)

  const bs = balanceSheet[balanceSheet.length - 1]
  const debtToEquity = bs.borrowings / Math.max(bs.reserves + bs.equityCapital, 1)
  const balanceSheetScore = clamp(100 - debtToEquity * 180, 0, 100)

  const shStart = shareholding[0]
  const shEnd = shareholding[shareholding.length - 1]
  const promoterTrend = shEnd.promoters - shStart.promoters
  const institutionalTrend = (shEnd.fii + shEnd.dii) - (shStart.fii + shStart.dii)
  const ownershipScore = clamp(50 + promoterTrend * 6 + institutionalTrend * 2, 0, 100)

  // Rough PEG-style heuristic: lower P/E relative to earnings growth scores higher
  const peg = overview.stockPE / Math.max(profitCagr, 1)
  const valuationScore = clamp(100 - peg * 22, 0, 100)

  const lastQ = quarterly[quarterly.length - 1]
  const prevQ = quarterly[quarterly.length - 2]
  const qProfitGrowth = ((lastQ.netProfit - prevQ.netProfit) / Math.max(prevQ.netProfit, 1)) * 100
  const momentumScore = clamp(50 + qProfitGrowth * 1.6, 0, 100)

  const factors: ScoreFactor[] = [
    { label: 'Growth (Sales & Profit CAGR)', score: Math.round(growthScore), detail: `${salesCagr.toFixed(1)}% sales / ${profitCagr.toFixed(1)}% profit CAGR` },
    { label: 'Profitability (ROE + ROCE)', score: Math.round(profitabilityScore), detail: `ROE ${overview.roe.toFixed(1)}%, ROCE ${overview.roce.toFixed(1)}%` },
    { label: 'Balance Sheet Strength', score: Math.round(balanceSheetScore), detail: `Debt/Equity ≈ ${debtToEquity.toFixed(2)}` },
    { label: 'Ownership Trend', score: Math.round(ownershipScore), detail: `Promoter ${promoterTrend >= 0 ? '+' : ''}${promoterTrend.toFixed(1)}pp, Institutional ${institutionalTrend >= 0 ? '+' : ''}${institutionalTrend.toFixed(1)}pp` },
    { label: 'Valuation vs Growth', score: Math.round(valuationScore), detail: `P/E ${overview.stockPE.toFixed(1)} vs ${profitCagr.toFixed(1)}% profit CAGR` },
    { label: 'Recent Momentum', score: Math.round(momentumScore), detail: `Latest qtr profit ${qProfitGrowth >= 0 ? '+' : ''}${qProfitGrowth.toFixed(1)}% QoQ` },
  ]

  const weights = [0.25, 0.2, 0.15, 0.15, 0.15, 0.1]
  const composite = factors.reduce((sum, f, i) => sum + f.score * weights[i], 0)
  const score = Math.round(clamp(composite, 0, 100))

  const label: MultibaggerScore['label'] = score >= 72 ? 'High potential' : score >= 50 ? 'Moderate potential' : 'Low potential'

  return { score, label, factors }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function getPeers(symbol: string): PeerRow[] {
  const c = getCompany(symbol)
  if (!c) return []
  const peers = COMPANIES.filter((p) => p.sector === c.sector && p.symbol !== symbol).slice(0, 6)
  return peers.map((p) => {
    const ov = getOverview(p.symbol)!
    const q = getQuarterlyResults(p.symbol)
    const last = q[q.length - 1]
    const prev = q[q.length - 2]
    return {
      symbol: p.symbol,
      name: p.name,
      cmp: ov.currentPrice,
      pe: ov.stockPE,
      marketCapCr: ov.marketCapCr,
      divYieldPct: ov.dividendYield,
      npQtrCr: last.netProfit,
      qtrProfitVarPct: +(((last.netProfit - prev.netProfit) / prev.netProfit) * 100).toFixed(2),
      salesQtrCr: last.sales,
      qtrSalesVarPct: +(((last.sales - prev.sales) / prev.sales) * 100).toFixed(2),
      rocePct: ov.roce,
    }
  })
}
