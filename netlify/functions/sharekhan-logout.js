// GET /api/logout
const { clearSessionCookie } = require('./_sharekhan-client')

exports.handler = async function () {
  return {
    statusCode: 302,
    headers: {
      Location: '/',
      'Set-Cookie': clearSessionCookie(),
    },
    body: '',
  }
}
