export default async function handler(req, res) {
  // Vercel serverless function to proxy NEO feed requests to NASA and keep the API key secret.
  try {
    const query = req.query || {}
    const start = query.start_date || query.start || query.startDate || query.startDate
    const end = query.end_date || query.end || query.endDate || query.endDate

    if (!start || !end) {
      res.status(400).json({ error: 'Missing required query parameters: start_date and end_date' })
      return
    }

    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY'
    const nasaUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${encodeURIComponent(
      start,
    )}&end_date=${encodeURIComponent(end)}&api_key=${apiKey}`

    const r = await fetch(nasaUrl)
    const text = await r.text()

    if (!r.ok) {
      // Forward status and body (useful for debugging and rate-limit messages)
      res.status(r.status).setHeader('Content-Type', r.headers.get('content-type') || 'text/plain').send(text)
      return
    }

    // Return parsed JSON (or empty object)
    const data = text ? JSON.parse(text) : {}

    // Optional: set cache-control for a short duration to reduce NASA calls
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    res.status(200).json(data)
  } catch (err) {
    console.error('Error in /api/nasa/meteors:', err)
    res.status(500).json({ error: String(err.message || err) })
  }
}
