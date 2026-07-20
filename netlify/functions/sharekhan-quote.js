// GET /api/quote?symbols=RELIANCE,TCS,INFY
// Sharekhan only streams live prices over a persistent WebSocket — there's
// no "give me one quote" REST call. Since a Netlify Function can't stay
// running to hold that connection open, this does a short-lived round trip:
// connect, subscribe to the requested symbols, collect whatever ticks arrive
// in a ~2.5s window, then disconnect and return what it got.
//
// This is deliberately a stopgap: fine for a personal app polling every
// 10-15s, but it's not true real-time push. If you eventually want
// sub-second live ticks, that needs a small always-on process (not
// serverless) that keeps one connection open continuously and caches the
// latest prices for the frontend to read — see README's "Phase 2.5" note.
//
// NOTE: the exact shape of tick messages isn't documented publicly and
// couldn't be verified without live credentials. `parseTick` below is a
// best-effort guess at the payload shape — log the raw message once you
// have real credentials and adjust it if the fields don't match.
const { WebSocket } = require('sharekhan-api/lib/index.js')
const { getAccessTokenFromRequest, getScripMaster } = require('./_sharekhan-client')

const COLLECT_WINDOW_MS = 2500

async function resolveScripCodes(symbols, accessToken) {
  const master = await getScripMaster(accessToken)
  const bySymbol = new Map(master.map((row) => [row.symbol.toUpperCase(), row]))
  return symbols.map((s) => {
    const match = bySymbol.get(s.toUpperCase())
    if (!match) throw new Error(`Symbol ${s} not found in scrip master.`)
    return { symbol: s, scripCode: match.scripCode }
  })
}

function parseTick(rawMessage) {
  // Best-effort parse — adjust once you've seen a real payload.
  try {
    const parsed = JSON.parse(rawMessage)
    return parsed
  } catch {
    return null
  }
}

exports.handler = async function (event) {
  const params = event.queryStringParameters || {}
  const symbolsParam = params.symbols
  if (!symbolsParam) {
    return { statusCode: 400, body: 'Missing ?symbols=A,B,C' }
  }
  const symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean)

  try {
    const accessToken = getAccessTokenFromRequest(event)
    if (!accessToken) {
      return { statusCode: 401, body: 'Not logged in. Visit /api/login first.' }
    }

    const resolved = await resolveScripCodes(symbols, accessToken)
    const instrumentValue = resolved.map((r) => `NC${r.scripCode}`).join(',')

    const ticks = []
    const ws = new WebSocket({ access_token: accessToken })

    await ws.connect()
    ws.on('tick', (raw) => {
      const parsed = parseTick(raw)
      if (parsed) ticks.push(parsed)
    })
    ws.subscribe({ action: 'subscribe', key: ['feed'], value: [''] })
    ws.fetchData({ action: 'feed', key: ['ltp'], value: [instrumentValue] })

    await new Promise((resolve) => setTimeout(resolve, COLLECT_WINDOW_MS))
    ws.close()

    return {
      statusCode: 200,
      body: JSON.stringify({ symbols: resolved, ticks }),
    }
  } catch (error) {
    return { statusCode: 500, body: `Quote fetch failed: ${error.message}` }
  }
}
