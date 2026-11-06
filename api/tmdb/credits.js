const getKey = require('./_key.js')

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
  res.setHeader('Cache-Control', 'public, max-age=300')
  res.end(JSON.stringify(body))
}

/** Returns up to 2 Director names joined with " & ". */
module.exports = async function handler(req, res) {
  if (req.method && req.method !== 'GET') return send(res, 405, { error: 'method not allowed' })
  const key = getKey()
  const url = new URL(req.url || '/', 'http://local')
  const id = (url.searchParams.get('id') || '').trim()
  if (!key) return send(res, 503, { error: 'TMDB_API_KEY not configured' })
  if (!/^\d+$/.test(id)) return send(res, 400, { error: 'id required' })
  const upstream = withKey(new URL(`https://api.themoviedb.org/3/movie/${id}/credits`), key)
  upstream.searchParams.set('language', 'en-US')
  try {
    const r = await fetch(upstream, { headers: authHeaders(key), signal: AbortSignal.timeout(8000) })
    const body = await r.json()
    if (!r.ok) {
      return send(res, r.status === 401 ? 401 : 502, {
        error: r.status === 401 ? 'TMDB rejected the key' : `TMDB error ${r.status}`,
      })
    }
    const directors = (body.crew || [])
      .filter((c) => c && c.job === 'Director' && typeof c.name === 'string' && c.name.trim())
      .map((c) => c.name.trim())
    const unique = []
    for (const n of directors) {
      if (!unique.includes(n)) unique.push(n)
      if (unique.length >= 2) break
    }
    const director = unique.join(' & ').slice(0, 100) || null
    return send(res, 200, { id: Number(id), director, directors: unique })
  } catch {
    return send(res, 502, { error: 'TMDB unreachable' })
  }
}
