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
  const id = (url.searchParams.get('id') || '').trim()
  if (!key) return send(res, 503, { error: 'TMDB_API_KEY not configured' })
  if (!/^\d+$/.test(id)) return send(res, 400, { error: 'id required' })
  const upstream = withKey(new URL(`https://api.themoviedb.org/3/movie/${id}/images`), key)
  try {
    const r = await fetch(upstream, { headers: authHeaders(key), signal: AbortSignal.timeout(8000) })
    const body = await r.json()
    if (!r.ok) {
      return send(res, r.status === 401 ? 401 : 502, {
        error: r.status === 401 ? 'TMDB rejected the key' : `TMDB error ${r.status}`,
      })
    }
    const posters = (body.posters || []).map((p) => ({
      file_path: p.file_path,
      url: p.file_path ? `https://image.tmdb.org/t/p/w500${p.file_path}` : null,
      vote_average: p.vote_average,
      width: p.width,
      height: p.height,
    }))
    return send(res, 200, { id: Number(id), posters })
  } catch {
    return send(res, 502, { error: 'TMDB unreachable' })
  }
}
