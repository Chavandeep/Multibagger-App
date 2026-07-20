// GET /api/status
// Lets the frontend check whether there's a valid Sharekhan session before
// deciding whether to show a "Connect to Sharekhan" prompt.
const { getAccessTokenFromRequest, clearSessionCookie } = require('./_sharekhan-client')

exports.handler = async function (event) {
  const accessToken = getAccessTokenFromRequest(event)
  return {
    statusCode: 200,
    body: JSON.stringify({ loggedIn: !!accessToken }),
  }
}

module.exports.clearSessionCookie = clearSessionCookie
