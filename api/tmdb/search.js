import getKey from './_key.js'

function authHeaders(key) {
  const headers = { accept: 'application/json' }
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  return headers
}
function withKey(url, key) {
  if (!key.startsWith('eyJ')) url.searchParams.set('api_key', key)
  return url
}
function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'public, max-age=60')
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') return send(res, 405, { error: 'method not allowed' })
  const key = getKey()
  const url = new URL(req.url || '/', 'http://local')
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100)
  if (!key) return send(res, 503, { error: 'TMDB_API_KEY not configured' })
  if (!q) return send(res, 200, { results: [] })
  const upstream = withKey(new URL('https://api.themoviedb.org/3/search/movie'), key)
  upstream.searchParams.set('query', q)
  upstream.searchParams.set('include_adult', 'false')
  try {
    const r = await fetch(upstream, { headers: authHeaders(key), signal: AbortSignal.timeout(8000) })
    const body = await r.json()
    if (!r.ok) {
      return send(res, r.status === 401 ? 401 : 502, {
        error: r.status === 401 ? 'TMDB rejected the key' : `TMDB error ${r.status}`,
      })
    }
    return send(res, 200, { results: body.results || [] })
  } catch {
    return send(res, 502, { error: 'TMDB unreachable' })
  }
}
