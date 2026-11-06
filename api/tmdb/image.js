/** Same-origin TMDB image proxy for preview + html-to-image export (avoids canvas CORS). */
export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'method not allowed' }))
    return
  }
  const url = new URL(req.url || '/', 'http://local')
  const path = (url.searchParams.get('path') || '').trim()
  const size = (url.searchParams.get('size') || 'w500').trim()
  if (!/^\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(path)) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'bad path' }))
    return
  }
  if (!/^(w185|w342|w500|w780|original)$/.test(size)) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'bad size' }))
    return
  }
  try {
    const upstream = `https://image.tmdb.org/t/p/${size}${path}`
    const r = await fetch(upstream, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) {
      res.statusCode = r.status === 404 ? 404 : 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: `upstream ${r.status}` }))
      return
    }
    const buf = Buffer.from(await r.arrayBuffer())
    res.statusCode = 200
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end(buf)
  } catch {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'TMDB image unreachable' }))
  }
}
