// GET /api/history?symbol=RELIANCE&interval=1day&days=90
// Resolves the trading symbol to Sharekhan's numeric scripCode via the
// shared scrip master cache, then fetches historical candles. Shaped to
// match the HistoryPoint[] the frontend already expects
// (src/lib/marketData.ts).
const { getClient, getAccessTokenFromRequest, getScripMaster } = require('./_sharekhan-client')

exports.handler = async function (event) {
  const params = event.queryStringParameters || {}
  const { symbol, interval = '1day' } = params

  if (!symbol) {
    return { statusCode: 400, body: 'Missing ?symbol=' }
  }

  try {
    const accessToken = getAccessTokenFromRequest(event)
    if (!accessToken) {
      return { statusCode: 401, body: 'Not logged in. Visit /api/login first.' }
    }

    const master = await getScripMaster(accessToken)
    const match = master.find((row) => row.symbol.toUpperCase() === symbol.toUpperCase())
    if (!match) {
      return { statusCode: 404, body: `Symbol ${symbol} not found in scrip master.` }
    }

    const client = getClient({ withAccessToken: accessToken })
    const response = await client.getHistoricalIntervalData('NC', match.scripCode, interval)

    // Shape to match src/lib/marketData.ts's HistoryPoint[] — adjust field
    // names here once you can see a real response payload.
    const raw = response && response.data ? response.data : []
    const points = (Array.isArray(raw) ? raw : []).map((row) => ({
      date: row.date || row.timestamp || row.time,
      close: Number(row.close ?? row.ltp ?? row.c),
      volume: Number(row.volume ?? row.v ?? 0),
    }))

    return { statusCode: 200, body: JSON.stringify(points) }
  } catch (error) {
    return { statusCode: 500, body: `History fetch failed: ${error.message}` }
  }
}
