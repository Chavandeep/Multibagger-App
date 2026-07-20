// GET /api/login
// Redirects the browser to Sharekhan's own login page. After the person logs
// in there, Sharekhan redirects back to /api/callback with a request_token.
const { getClient } = require('./_sharekhan-client')

exports.handler = async function () {
  try {
    const client = getClient()
    const loginUrl = client.getLoginURL()
    return {
      statusCode: 302,
      headers: { Location: loginUrl },
      body: '',
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: `Login setup error: ${error.message}`,
    }
  }
}
