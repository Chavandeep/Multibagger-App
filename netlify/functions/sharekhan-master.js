// GET /api/master
// Returns the NSE equity scrip master (symbol -> scripCode mapping) needed
// by every other endpoint. See _sharekhan-client.js's getScripMaster() for
// the actual fetch/parse/cache logic (shared across master/history/quote).
const { getAccessTokenFromRequest, getScripMaster } = require('./_sharekhan-client')

exports.handler = async function (event) {
  try {
    const accessToken = getAccessTokenFromRequest(event)
    const data = await getScripMaster(accessToken)
    return { statusCode: 200, body: JSON.stringify(data) }
  } catch (error) {
    if (error.message.includes('no access token')) {
      return { statusCode: 401, body: 'Not logged in. Visit /api/login first.' }
    }
    return { statusCode: 500, body: `Master fetch failed: ${error.message}` }
  }
}
