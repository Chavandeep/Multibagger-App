// GET /api/callback?request_token=...
// Sharekhan redirects here after login. Exchanges the request_token for a
// real access_token using the secret key (which never leaves this server),
// stores it in an httpOnly cookie, then bounces the browser back to the app.
const { getClient, getEnv, buildSessionCookie } = require('./_sharekhan-client')

exports.handler = async function (event) {
  const requestToken = event.queryStringParameters && event.queryStringParameters.request_token
  const versionId = event.queryStringParameters && event.queryStringParameters.version_id

  if (!requestToken) {
    return { statusCode: 400, body: 'Missing request_token from Sharekhan redirect.' }
  }

  try {
    const secretKey = getEnv('SHAREKHAN_SECRET_KEY')
    const client = getClient()

    const session = versionId
      ? await client.generateSessionWithVersionID(requestToken, secretKey, versionId)
      : await client.generateSessionWithoutVersionID(requestToken, secretKey)

    const accessToken = session && session.data && session.data.token
    if (!accessToken) {
      return { statusCode: 502, body: `Sharekhan did not return an access token: ${JSON.stringify(session)}` }
    }

    const appUrl = process.env.APP_URL || '/'

    return {
      statusCode: 302,
      headers: {
        Location: appUrl,
        'Set-Cookie': buildSessionCookie(accessToken),
      },
      body: '',
    }
  } catch (error) {
    return { statusCode: 500, body: `Token exchange failed: ${error.message}` }
  }
}
