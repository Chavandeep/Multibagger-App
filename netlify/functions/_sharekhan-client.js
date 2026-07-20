// Shared helper for constructing an authenticated Sharekhan SDK client and
// reading/writing the session cookie. Every function in this folder goes
// through here so there's one place that knows how auth actually works.

// NOTE: sharekhan-api's own package.json has a broken "main" field (points
// to a non-existent index.js at the package root — the real entry point is
// lib/index.js). Requiring the deep path directly works around it.
const { SharekhanApi } = require('sharekhan-api/lib/index.js')

const COOKIE_NAME = 'sk_session'

function getEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it in Netlify → Site settings → Environment variables.`
    )
  }
  return value
}

function parseCookies(headerValue) {
  const out = {}
  if (!headerValue) return out
  headerValue.split(';').forEach((pair) => {
    const idx = pair.indexOf('=')
    if (idx === -1) return
    const key = pair.slice(0, idx).trim()
    const val = pair.slice(idx + 1).trim()
    out[key] = decodeURIComponent(val)
  })
  return out
}

function getAccessTokenFromRequest(event) {
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie)
  return cookies[COOKIE_NAME] || null
}

function buildSessionCookie(accessToken) {
  // httpOnly + Secure so the token is never readable from client-side JS.
  // 8-hour expiry roughly matches a trading-day session; the user just logs
  // in again via /api/login if it expires.
  const maxAge = 60 * 60 * 8
  return `${COOKIE_NAME}=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

function getClient({ withAccessToken } = {}) {
  const api_key = getEnv('SHAREKHAN_API_KEY')
  const params = { api_key }
  if (withAccessToken) params.access_token = withAccessToken
  return new SharekhanApi(params)
}

// ---- Scrip master (symbol -> scripCode) ----
//
// Each function file that needs this (master.js, history.js, quote.js) runs
// as its own separate, isolated process — a module-level cache in one file
// is invisible to the others. So this cache-and-fetch logic lives here as
// shared *code*, but each function ends up with its own independent copy of
// the *data* at runtime. That's a deliberate tradeoff for reliability: no
// dependency on Netlify Blobs (see macro-news.js for why that's avoided),
// at the cost of Sharekhan's master endpoint getting hit once per cold
// start per function rather than truly globally-shared. Fine in practice —
// the master list only changes daily, not per-request.
let masterCache = null // { fetchedAt: number, data: object[] }
const MASTER_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

const CSV_COLUMNS = {
  symbol: ['tradingsymbol', 'symbol', 'scripname'],
  scripCode: ['scripcode', 'code', 'securityid', 'token'],
  name: ['companyname', 'name', 'description'],
}

function findColumn(header, candidates) {
  const lower = header.map((h) => h.trim().toLowerCase())
  for (const candidate of candidates) {
    const idx = lower.indexOf(candidate)
    if (idx !== -1) return idx
  }
  return -1
}

function parseMasterCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const header = lines[0].split(',')

  const symbolIdx = findColumn(header, CSV_COLUMNS.symbol)
  const codeIdx = findColumn(header, CSV_COLUMNS.scripCode)
  const nameIdx = findColumn(header, CSV_COLUMNS.name)

  if (symbolIdx === -1 || codeIdx === -1) {
    throw new Error(`Could not find symbol/scripCode columns in master CSV header: ${header.join(',')}`)
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(',')
    return {
      symbol: (cols[symbolIdx] || '').trim(),
      scripCode: (cols[codeIdx] || '').trim(),
      name: nameIdx !== -1 ? (cols[nameIdx] || '').trim() : '',
    }
  })
}

// Fetches (or returns cached) scrip master. Requires an access token the
// first time (or whenever the cache has expired) since it's an
// authenticated Sharekhan call; returns the cached copy without needing a
// token if one's already warm.
async function getScripMaster(accessToken) {
  if (masterCache && Date.now() - masterCache.fetchedAt < MASTER_CACHE_TTL_MS) {
    return masterCache.data
  }
  if (!accessToken) {
    throw new Error('Scrip master not cached yet and no access token provided to fetch it.')
  }
  const client = getClient({ withAccessToken: accessToken })
  const response = await client.getActiveScriptOfDay('NC') // NC = NSE Cash segment
  const csvText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
  const data = parseMasterCsv(csvText)
  masterCache = { fetchedAt: Date.now(), data }
  return data
}

module.exports = {
  COOKIE_NAME,
  getEnv,
  getAccessTokenFromRequest,
  buildSessionCookie,
  clearSessionCookie,
  getClient,
  getScripMaster,
}
