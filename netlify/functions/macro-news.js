// GET /api/macro-news
// Real stock-market and policy news via Marketaux — a finance-only news API
// (not a general news API with a category filter bolted on), so results
// stay confined to stocks, companies, and market-moving policy/macro
// stories rather than pulling in unrelated general news.
//
// IMPORTANT: Marketaux's `countries` parameter only filters articles that
// have a specific stock/entity identified AND that entity's exchange is in
// that country — it does NOT filter by the article's own subject/locale.
// Policy and macro stories (RBI, budget, monsoon) frequently don't tag any
// company entity at all, so `countries=in` alone lets global news through.
//
// Filtering approach: rather than asking Marketaux's API to combine a strict
// domain restriction AND a keyword search in one query (which returned zero
// results — likely too narrow for very few articles to satisfy both at
// once), this fetches more broadly with just the keyword search, then
// filters for Indian financial sources in our own code afterward. Easier to
// debug and tune without burning API quota on trial-and-error queries.
//
// Caching: uses a plain in-memory module-level variable rather than
// Netlify Blobs. Blobs' "zero-config" auto-detection has a well-documented,
// still-unresolved history of failing in production with
// MissingBlobsEnvironmentError even when set up exactly per their docs —
// not worth depending on for what's just a request-count optimization.
//
// Doesn't need Sharekhan at all — just MARKETAUX_API_KEY as an env var.

let cache = null // { fetchedAt: number, data: object[] }
// Free plan is 100 requests/day — 30 min cache keeps this comfortably under
// that even with multiple people using the app, while still feeling fresh.
const CACHE_TTL_MS = 30 * 60 * 1000

// Ordered most -> least reliable/prominent. Used when a story is covered by
// multiple outlets (Marketaux's `similar` grouping) — we show whichever
// outlet ranks best here rather than whatever Marketaux picked as the
// "main" article, which isn't necessarily the most recognizable source.
const INDIAN_FINANCIAL_DOMAINS = [
  'economictimes.indiatimes.com',
  'moneycontrol.com',
  'livemint.com',
  'business-standard.com',
  'financialexpress.com',
  'cnbctv18.com',
  'businesstoday.in',
  'bqprime.com',
  'thehindubusinessline.com',
  'zeebiz.com',
  'ndtvprofit.com',
  'forbesindia.com',
]

// Keywords steering toward the same categories the old mock data covered:
// government policy, FII/FDI flows, commodities, currency, and market-wide
// moves — not just single-company stock news.
const MACRO_QUERY = [
  // Monetary & fiscal policy
  'RBI', '"repo rate"', '"monetary policy"', 'budget', '"fiscal deficit"', '"fiscal policy"',
  // Tax & regulation
  'GST', 'tariff', 'subsidy', 'SEBI', 'regulation', 'ordinance', 'tax', '"income tax"', '"corporate tax"',
  // Government & political
  'government', 'cabinet', 'parliament', 'election', 'minister', 'policy',
  // Economic indicators
  'inflation', '"interest rate"', 'GDP', 'recession', 'disinvestment', 'privatization', 'stimulus',
  // Trade, geopolitics & currency
  '"trade war"', 'sanctions', 'geopolitical', 'FII', 'FDI', '"foreign investment"', 'rupee', 'dollar',
  // Commodities & market-wide
  '"crude oil"', 'gold', 'Nifty', 'Sensex', 'NSE', 'BSE', '"stock market"', 'IPO',
  // Corporate & legal events
  'merger', 'acquisition', '"stake sale"', 'buyback', 'delisting', 'bankruptcy', 'insolvency', 'NCLT', '"court ruling"', 'strike', '"block deal"',
  // Market activity & corporate finance
  'derivatives', 'F&O', '"mutual fund"', 'silver', '"52-week high"', '"52-week low"', 'earnings', '"quarterly results"', 'capex', 'NBFC', '"credit rating"', '"credit score"', 'divestment', '"fixed deposit"',
].join('|')

function getEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Set it in Netlify → Site settings → Environment variables.`)
  }
  return value
}

function domainOf(sourceOrUrl) {
  const haystack = (sourceOrUrl || '').toLowerCase()
  return INDIAN_FINANCIAL_DOMAINS.find((d) => haystack.includes(d)) || null
}

function isIndianSource(article) {
  return !!domainOf(`${article.source || ''} ${article.url || ''}`)
}

// Marketaux groups near-duplicate coverage of the same story and returns
// one "main" article plus a `similar` array of the others it grouped in.
// The main one isn't necessarily from the most recognizable outlet — this
// picks whichever of (main + similar) ranks best in INDIAN_FINANCIAL_DOMAINS.
function pickBestSource(article) {
  const candidates = [
    { headline: article.title, url: article.url, source: article.source, publishedAt: article.published_at },
    ...(Array.isArray(article.similar) ? article.similar : []).map((s) => ({
      headline: s.title,
      url: s.url,
      source: s.source,
      publishedAt: s.published_at,
    })),
  ]

  let best = null
  let bestRank = Infinity
  for (const c of candidates) {
    const domain = domainOf(`${c.source || ''} ${c.url || ''}`)
    const rank = domain ? INDIAN_FINANCIAL_DOMAINS.indexOf(domain) : Infinity
    if (rank < bestRank) {
      best = c
      bestRank = rank
    }
  }
  return best || candidates[0]
}

exports.handler = async function (event) {
  const debug = event.queryStringParameters && event.queryStringParameters.debug === '1'

  try {
    if (!debug && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cache.data) }
    }

    const apiToken = getEnv('MARKETAUX_API_KEY')
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const url =
      'https://api.marketaux.com/v1/news/all' +
      `?api_token=${apiToken}` +
      // `&domains=${INDIAN_FINANCIAL_DOMAINS.join(',')}` +
      '&language=en' +
      `&search=${encodeURIComponent(MACRO_QUERY)}` +
      `&published_after=${sevenDaysAgo}` +
      '&limit=50' +
      '&sort=published_on'

    const res = await fetch(url)
    const json = await res.json()
    if (!res.ok || json.error) {
      const message = json.error ? `${json.error.code}: ${json.error.message}` : `HTTP ${res.status}`
      return { statusCode: res.status, body: `Marketaux error: ${message}` }
    }

    const allArticles = (json.data || []).map((a) => {
      const best = pickBestSource(a)
      return {
        id: a.uuid,
        headline: best.headline || a.title,
        snippet: a.snippet || a.description || '',
        url: best.url || a.url,
        source: best.source || a.source,
        publishedAt: best.publishedAt || a.published_at,
        entities: (a.entities || []).map((e) => ({ symbol: e.symbol, name: e.name, sentiment: e.sentiment_score })),
      }
    })

    const indianOnly = allArticles.filter(isIndianSource)

    // ?debug=1 shows what came back before/after filtering, so we can see
    // exactly why something is or isn't showing up without guessing.
    if (debug) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            totalFromApi: allArticles.length,
            afterIndianFilter: indianOnly.length,
            sampleSources: allArticles.slice(0, 10).map((a) => ({ source: a.source, url: a.url, headline: a.headline })),
          },
          null,
          2
        ),
      }
    }

    const sorted = indianOnly.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    cache = { fetchedAt: Date.now(), data: sorted }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sorted) }
  } catch (error) {
    return { statusCode: 500, body: `Macro news fetch failed: ${error.message}` }
  }
}
