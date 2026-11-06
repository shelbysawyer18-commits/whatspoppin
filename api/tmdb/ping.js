const getKey = require('./_key.js')

module.exports = async function handler(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  const key = getKey()
  res.end(JSON.stringify({
    ok: true,
    configured: Boolean(key),
    keyLen: key.length,
    viaHalves: Boolean(process.env.TMDB_API_KEY_A && process.env.TMDB_API_KEY_B),
  }))
}
