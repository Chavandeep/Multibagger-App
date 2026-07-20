// ─────────────────────────────────────────────────────────────────────────
// MARKET DATA PROVIDER
//
// This is the single seam between the UI and live data. Every screen calls
// these functions — none of them talk to a data source directly. Today
// they return realistic mock data generated client-side. When the Sharekhan
// API backend is ready, replace the function bodies below with real fetch
// calls (e.g. `fetch('/api/quote/' + symbol)`) and nothing else in the app
// needs to change.
//
// Sharekhan auth needs a secret-key exchange, which can't happen safely in
// a pure client-side PWA — that piece will live in a small backend/
// serverless function. See README.md → "Wiring in Sharekhan" for the plan.
// ─────────────────────────────────────────────────────────────────────────

export interface Quote {
  symbol: string
  name: string
  sector: string
  price: number
  prevClose: number
  dayHigh: number
  dayLow: number
  volume: number
}

export interface HistoryPoint {
  date: string // ISO date
  close: number
}

export interface BulkDeal {
  date: string
  investor: string
  symbol: string
  companyName: string
  dealType: 'BUY' | 'SELL'
  quantity: number
  avgPrice: number
}

export interface MacroAlert {
  id: string
  date: string
  headline: string
  category: 'Policy' | 'FII/FDI' | 'Commodity' | 'Currency' | 'Weather'
  sectors: string[]
  impact: 'positive' | 'negative' | 'neutral'
  url?: string // present for real news (Marketaux); absent for mock fallback
  source?: string
}

// ---- Universe -----------------------------------------------------------
// Backed by the same 50-company list that drives the Top 50 dashboard and
// the fundamentals engine (src/data/companies.ts) — one source of truth.

import { COMPANIES } from '../data/companies'

const UNIVERSE: { symbol: string; name: string; sector: string; base: number }[] = COMPANIES.map((c) => ({
  symbol: c.symbol,
  name: c.name,
  sector: c.sector,
  base: c.basePrice,
}))

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return () => {
    h = (Math.imul(48271, h) + 12345) | 0
    return ((h >>> 0) % 10000) / 10000
  }
}

export async function searchSymbols(query: string): Promise<{ symbol: string; name: string; sector: string }[]> {
  const q = query.trim().toUpperCase()
  if (!q) return UNIVERSE.map(({ symbol, name, sector }) => ({ symbol, name, sector }))
  return UNIVERSE.filter(
    (u) => u.symbol.includes(q) || u.name.toUpperCase().includes(q)
  ).map(({ symbol, name, sector }) => ({ symbol, name, sector }))
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const stock = UNIVERSE.find((u) => u.symbol === symbol)
  if (!stock) return null
  const rand = seededRandom(symbol + new Date().toISOString().slice(0, 13))
  const drift = (rand() - 0.48) * 0.03
  const price = +(stock.base * (1 + drift)).toFixed(2)
  const prevClose = stock.base
  return {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    price,
    prevClose,
    dayHigh: +(price * 1.015).toFixed(2),
    dayLow: +(price * 0.985).toFixed(2),
    volume: Math.floor(rand() * 5_000_000) + 200_000,
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const results = await Promise.all(symbols.map(getQuote))
  return results.filter((q): q is Quote => q !== null)
}

export async function getHistory(symbol: string, days = 90): Promise<HistoryPoint[]> {
  const stock = UNIVERSE.find((u) => u.symbol === symbol)
  if (!stock) return []
  const rand = seededRandom(symbol)
  const points: HistoryPoint[] = []
  let price = stock.base * 0.72
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const drift = (rand() - 0.47) * 0.045
    price = Math.max(price * (1 + drift), 1)
    points.push({ date: d.toISOString().slice(0, 10), close: +price.toFixed(2) })
  }
  // anchor the last point near today's live price for continuity
  points[points.length - 1].close = stock.base
  return points
}

export interface FullHistoryPoint {
  date: string
  close: number
  volume: number
}

const RANGE_DAYS: Record<string, number> = {
  '1M': 30,
  '6M': 182,
  '1Yr': 365,
  '3Yr': 1095,
  '5Yr': 1825,
  '10Yr': 3650,
  Max: 3650,
}

// One deterministic ~10-year daily series per symbol, sliced/resampled per
// range so switching tabs feels like the same underlying data (as it would
// with a real feed) rather than regenerating a different-looking chart.
const fullHistoryCache = new Map<string, FullHistoryPoint[]>()

function buildFullHistory(symbol: string): FullHistoryPoint[] {
  const cached = fullHistoryCache.get(symbol)
  if (cached) return cached
  const stock = UNIVERSE.find((u) => u.symbol === symbol)
  if (!stock) return []
  const rand = seededRandom(symbol + 'full-history')
  const totalDays = RANGE_DAYS['10Yr']
  const points: FullHistoryPoint[] = []
  let price = stock.base * 0.16
  const now = new Date()
  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const drift = (rand() - 0.475) * 0.032
    price = Math.max(price * (1 + drift), 1)
    const volume = Math.floor(rand() * 4_500_000) + 150_000
    points.push({ date: d.toISOString().slice(0, 10), close: +price.toFixed(2), volume })
  }
  points[points.length - 1].close = stock.base
  fullHistoryCache.set(symbol, points)
  return points
}

export type RangeKey = keyof typeof RANGE_DAYS

export function getRangeHistory(symbol: string, range: RangeKey): FullHistoryPoint[] {
  const full = buildFullHistory(symbol)
  const days = RANGE_DAYS[range]
  const sliceStart = range === 'Max' ? 0 : Math.max(0, full.length - days)
  const sliced = full.slice(sliceStart)

  // Downsample longer ranges so the chart stays fast and legible — a real
  // chart library does the same thing under the hood.
  const maxPoints = 260
  if (sliced.length <= maxPoints) return sliced
  const step = Math.ceil(sliced.length / maxPoints)
  return sliced.filter((_, i) => i % step === 0 || i === sliced.length - 1)
}

// Simple moving average, computed against the *full* series so early points
// in a shorter range still have correct lookback, then aligned to the
// (possibly downsampled) output series by date.
export function withMovingAverages(symbol: string, series: FullHistoryPoint[]) {
  const full = buildFullHistory(symbol)
  const closesByDate = new Map(full.map((p, i) => [p.date, i]))
  function smaAt(index: number, window: number): number | null {
    if (index < window - 1) return null
    let sum = 0
    for (let i = index - window + 1; i <= index; i++) sum += full[i].close
    return +(sum / window).toFixed(2)
  }
  return series.map((p) => {
    const idx = closesByDate.get(p.date) ?? -1
    return {
      ...p,
      dma50: idx >= 0 ? smaAt(idx, 50) : null,
      dma200: idx >= 0 ? smaAt(idx, 200) : null,
    }
  })
}

// ---- Smart money / bulk deals (NSE public EOD reports in production) ----

const INVESTORS = ['Mukul Agarwal', 'Vijay Kedia', 'Ashish Kacholia', 'Sunil Singhania', 'Dolly Khanna']

export async function getBulkDeals(): Promise<BulkDeal[]> {
  const rand = seededRandom('bulk-deals-' + new Date().toISOString().slice(0, 10))
  const deals: BulkDeal[] = []
  for (let i = 0; i < 8; i++) {
    const stock = UNIVERSE[Math.floor(rand() * UNIVERSE.length)]
    const investor = INVESTORS[Math.floor(rand() * INVESTORS.length)]
    const d = new Date()
    d.setDate(d.getDate() - Math.floor(rand() * 5))
    deals.push({
      date: d.toISOString().slice(0, 10),
      investor,
      symbol: stock.symbol,
      companyName: stock.name,
      dealType: rand() > 0.35 ? 'BUY' : 'SELL',
      quantity: Math.floor(rand() * 900_000) + 50_000,
      avgPrice: +(stock.base * (0.9 + rand() * 0.2)).toFixed(2),
    })
  }
  return deals.sort((a, b) => (a.date < b.date ? 1 : -1))
}

// ---- Macro & policy scanner ----
// Real data via /api/macro-news (Marketaux — finance-only news, see that
// function's comments). Falls back to the old mock generator if the
// endpoint isn't set up yet (no API key configured, network error, etc.)
// so the page never breaks — just silently stays on mock data until
// MARKETAUX_API_KEY is added in Netlify.

interface MarketauxArticle {
  id: string
  headline: string
  snippet: string
  url: string
  source: string
  publishedAt: string
  entities: { symbol: string; name: string; sentiment: number }[]
}

const CATEGORY_KEYWORDS: Record<MacroAlert['category'], string[]> = {
  Policy: ['rbi', 'budget', 'government', 'cabinet', 'scheme', 'policy', 'gst', 'regulation'],
  'FII/FDI': ['fii', 'fdi', 'foreign investor', 'foreign investment'],
  Commodity: ['crude', 'oil', 'gold', 'commodity', 'metal'],
  Currency: ['rupee', 'dollar', 'currency', 'forex'],
  Weather: ['monsoon', 'rainfall', 'imd', 'weather', 'cyclone'],
}

function classifyCategory(text: string): MacroAlert['category'] {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return category as MacroAlert['category']
  }
  return 'Policy'
}

function transformArticle(article: MarketauxArticle, index: number): MacroAlert {
  const sectors = article.entities
    .map((e) => COMPANIES.find((c) => c.symbol === e.symbol)?.sector)
    .filter((s): s is string => !!s)
  const uniqueSectors = [...new Set(sectors)]

  const avgSentiment = article.entities.length
    ? article.entities.reduce((sum, e) => sum + (e.sentiment || 0), 0) / article.entities.length
    : 0
  const impact: MacroAlert['impact'] = avgSentiment > 0.15 ? 'positive' : avgSentiment < -0.15 ? 'negative' : 'neutral'

  return {
    id: article.id || 'a' + index,
    date: article.publishedAt,
    headline: article.headline,
    category: classifyCategory(article.headline + ' ' + article.snippet),
    sectors: uniqueSectors.length ? uniqueSectors : ['Market-wide'],
    impact,
    url: article.url,
    source: article.source,
  }
}

async function getMockMacroAlerts(): Promise<MacroAlert[]> {
  const rand = seededRandom('macro-' + new Date().toISOString().slice(0, 10))
  const templates: Omit<MacroAlert, 'id' | 'date'>[] = [
    { headline: 'Government expands PLI scheme allocation for defence manufacturing', category: 'Policy', sectors: ['Defence'], impact: 'positive' },
    { headline: 'Crude oil rises above $85/barrel on supply concerns', category: 'Commodity', sectors: ['Oil & Gas', 'Chemicals'], impact: 'negative' },
    { headline: 'FII inflows turn positive for the third straight session', category: 'FII/FDI', sectors: ['Financials', 'Telecom'], impact: 'positive' },
    { headline: 'Rupee weakens past 87.5 against the US dollar', category: 'Currency', sectors: ['Oil & Gas', 'Chemicals'], impact: 'negative' },
    { headline: 'IMD flags below-normal monsoon risk in key agri belts', category: 'Weather', sectors: ['Chemicals'], impact: 'negative' },
    { headline: 'New railway electrification budget cleared by cabinet', category: 'Policy', sectors: ['Railways/Infra'], impact: 'positive' },
    { headline: 'Green hydrogen mission gets fresh funding tranche', category: 'Policy', sectors: ['Renewable Energy'], impact: 'positive' },
  ]
  return templates
    .map((t, i) => {
      const d = new Date()
      d.setHours(d.getHours() - Math.floor(rand() * 48))
      return { ...t, id: 'm' + i, date: d.toISOString() }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getMacroAlerts(): Promise<MacroAlert[]> {
  try {
    const res = await fetch('/api/macro-news')
    if (!res.ok) throw new Error('macro-news endpoint not ready')
    const articles: MarketauxArticle[] = await res.json()
    if (!Array.isArray(articles) || articles.length === 0) throw new Error('empty response')
    return articles.map(transformArticle)
  } catch {
    return getMockMacroAlerts()
  }
}
