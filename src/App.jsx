import { useEffect, useState } from 'react'
import './App.css'

// Prefer API key from Vite env (VITE_NASA_API_KEY). Falls back to the key you provided.
const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'XO0W1Kz2NafloPaPFMp2UebjtaOUrZVVWw2bW5Ah'

function buildNasaFeedUrl(startDate, endDate) {
  return `https://api.nasa.gov/neo/rest/v1/feed?start_date=${encodeURIComponent(
    startDate,
  )}&end_date=${encodeURIComponent(endDate)}&api_key=${API_KEY}`
}

function formatKmRange(diameter) {
  if (!diameter) return '—'
  const min = diameter.kilometers.estimated_diameter_min.toFixed(3)
  const max = diameter.kilometers.estimated_diameter_max.toFixed(3)
  return `${min} — ${max} km`
}

function MeteorItem({ m }) {
  const approach = m.close_approach_data && m.close_approach_data[0]
  return (
    <li className={"meteor" + (m.is_potentially_hazardous_asteroid ? ' hazardous' : '')}>
      <div className="meteor-header">
        <h3 className="meteor-name">{m.name}</h3>
        {m.is_potentially_hazardous_asteroid ? (
          <span className="hazard yes" title="Perigoso">⚠️ PERIGOSO</span>
        ) : (
          <span className="hazard no" title="Não perigoso">✓ Seguro</span>
        )}
      </div>

      <div className="meteor-body">
        <div>
          <strong>ID:</strong> {m.id}
        </div>
        <div>
          <strong>Magnitude:</strong> {m.absolute_magnitude_h}
        </div>
        <div>
          <strong>Estimated diameter:</strong> {formatKmRange(m.estimated_diameter)}
        </div>
        {approach && (
          <div className="approach">
            <div>
              <strong>Close approach:</strong> {approach.close_approach_date}
            </div>
            <div>
              <strong>Miss distance:</strong> {parseFloat(approach.miss_distance.kilometers).toLocaleString()} km
            </div>
            <div>
              <strong>Relative velocity:</strong> {parseFloat(approach.relative_velocity.kilometers_per_hour).toLocaleString()} km/h
            </div>
            <div>
              <strong>Orbiting body:</strong> {approach.orbiting_body}
            </div>
          </div>
        )}
      </div>
    </li>
  )
}

function MeteorList({ items, hazardousOnly }) {
  if (!items || items.length === 0)
    return <p className="empty">Nenhum meteoro encontrado para a data selecionada.</p>

  const filtered = hazardousOnly ? items.filter((i) => i.is_potentially_hazardous_asteroid) : items

  if (filtered.length === 0)
    return <p className="empty">Nenhum meteoro corresponde ao filtro aplicado.</p>

  return (
    <ul className="meteor-list">
      {filtered.map((m) => (
        <MeteorItem key={m.id} m={m} />
      ))}
    </ul>
  )
}

function App() {
  const [meteors, setMeteors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // default dates: today (or 2025-10-04 if you prefer fixed)
  const today = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [hazardousOnly, setHazardousOnly] = useState(false)

  useEffect(() => {
    // initial load for default dates
    fetchForRange(startDate, endDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function daysBetween(a, b) {
    const A = new Date(a)
    const B = new Date(b)
    const ms = B - A
    return Math.round(ms / (1000 * 60 * 60 * 24))
  }

  function fetchForRange(start, end) {
    // validation
    setError(null)
    if (!start || !end) {
      setError('Selecione ambas as datas')
      return
    }
    if (new Date(start) > new Date(end)) {
      setError('A data inicial deve ser anterior ou igual à data final')
      return
    }
    const diff = daysBetween(start, end)
    if (diff < 0) {
      setError('Intervalo inválido')
      return
    }
    if (diff > 6) {
      // diff counts days between inclusive? If start==end => 0. So max 6 difference for 7 days range.
      setError('O intervalo máximo permitido é de 7 dias')
      return
    }

    const url = buildNasaFeedUrl(start, end)
    let mounted = true
    setLoading(true)
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!mounted) return
        const neo = data.near_earth_objects || {}
        const keys = Object.keys(neo)
        const list = keys.flatMap((k) => neo[k])
        setMeteors(list)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message)
        setMeteors([])
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }

  return (
    <div>
      <header className="app-header">
        <div className="logos">
        </div>
        <h1>Meteoros próximos à atmosfera</h1>
        <p className="subtitle">Fonte: NASA NEO Feed (próximo objeto à Terra). Lista com informações básicas.</p>
      </header>

      <main>
        <section className="controls">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchForRange(startDate, endDate)
            }}
          >
            <label>
              Data inicial:{' '}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              Data final:{' '}
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={hazardousOnly}
                onChange={(e) => setHazardousOnly(e.target.checked)}
              />{' '}
              Apenas perigosos
            </label>
            <button type="submit" className="btn">Buscar</button>
          </form>
        </section>

        {loading && <p className="loading">Carregando meteoros…</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && <MeteorList items={meteors} hazardousOnly={hazardousOnly} />}
      </main>

      <footer className="footer">
        <small>Dados fornecidos pela NASA - Near Earth Object Web Service (NEO)</small>
      </footer>
    </div>
  )
}

export default App
