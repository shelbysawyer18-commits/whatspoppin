const getKey = require('./_key.js')

module.exports = async function handler(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'public, max-age=60')
  res.end(JSON.stringify({ configured: Boolean(getKey()) }))
}
