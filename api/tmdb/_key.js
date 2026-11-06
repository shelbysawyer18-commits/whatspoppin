export default function getKey() {
  return (process.env.TMDB_API_KEY || '').trim()
}
