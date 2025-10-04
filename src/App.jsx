"use client"

import { useState, useEffect } from "react"
import "./App.css"

// react-leaflet + leaflet for interactive map
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function buildApiUrl(startDate, endDate) {
  return `/api/nasa/meteors?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
}

// This app now only fetches and lists meteors; simulation logic was removed

function App() {
  const [meteors, setMeteors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // simulation-related state removed

  const today = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [hazardousOnly, setHazardousOnly] = useState(false)

  // small state to keep map instance if needed
  const [mapInstance, setMapInstance] = useState(null)

  useEffect(() => {
    fetchForRange(startDate, endDate)
  }, [])

  // deterministic pseudo-random lat/lng from a string id
  function idToLatLng(id) {
    let h1 = 0
    for (let i = 0; i < id.length; i++) {
      h1 = (h1 * 31 + id.charCodeAt(i)) >>> 0
    }
    // Map hash to ranges: lat in [-75,75], lon in [-180,180]
    const lat = ((h1 % 15000) / 15000) * 150 - 75
    const lon = ((Math.floor(h1 / 15000) % 36000) / 36000) * 360 - 180
    return [Number(lat.toFixed(6)), Number(lon.toFixed(6))]
  }

  useEffect(() => {
    if (mapInstance) {
      // optional: fit bounds to markers when meteors change
      const list = (hazardousOnly ? meteors.filter((m) => m.is_potentially_hazardous_asteroid) : meteors)
      if (list.length === 0) return
      const coords = list.slice(0, 200).map((m) => idToLatLng(m.id))
      const bounds = coords.map((c) => [c[0], c[1]])
      try {
        mapInstance.fitBounds(bounds, { maxZoom: 6, padding: [40, 40] })
      } catch (e) {
        // ignore if bounds invalid
      }
    }
  }, [meteors, hazardousOnly, mapInstance])

  // no simulation effects

  function fetchForRange(start, end) {
    setError(null)
    if (!start || !end) {
      setError("Selecione ambas as datas")
      return
    }
    if (new Date(start) > new Date(end)) {
      setError("A data inicial deve ser anterior ou igual à data final")
      return
    }
    const url = buildApiUrl(start, end)
    setLoading(true)

    ;(async () => {
      try {
        const res = await fetch(url)
        const bodyText = await res.text()

        if (!res.ok) {
          // include part of body in the error to help debugging (e.g., HTML error page)
          const snippet = bodyText ? ` - ${bodyText.slice(0, 500)}` : ''
          throw new Error(`HTTP ${res.status} ${res.statusText}${snippet}`)
        }

        let data
        try {
          data = bodyText ? JSON.parse(bodyText) : {}
        } catch (parseErr) {
          // Provide helpful message instead of throwing raw JSON.parse error
          const snippet = bodyText ? bodyText.slice(0, 500) : '[vazio]'
          // If the server returned the SPA index (HTML), try fetching the public NASA API directly as a fallback
          const lower = snippet.toLowerCase()
          if (lower.includes('<!doctype') || lower.includes('<html')) {
            // attempt direct NASA fetch as fallback
            try {
              const apiKey = import.meta.env.VITE_NASA_API_KEY || 'XO0W1Kz2NafloPaPFMp2UebjtaOUrZVVWw2bW5Ah'
              const nasaUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}&api_key=${apiKey}`
              const nres = await fetch(nasaUrl)
              const ntext = await nres.text()
              if (!nres.ok) throw new Error(`NASA API HTTP ${nres.status} - ${ntext.slice(0, 300)}`)
              const ndata = ntext ? JSON.parse(ntext) : {}
              const neo = ndata.near_earth_objects || {}
              const keys = Object.keys(neo)
              const list = keys.flatMap((k) => neo[k])
              setMeteors(list)
              return
            } catch (nerr) {
              const nsnippet = String(nerr.message).slice(0, 500)
              throw new Error(`Resposta inválida do servidor e fallback NASA falhou: ${nsnippet}`)
            }
          }
          throw new Error(`Resposta inválida: não é JSON. Conteúdo: ${snippet}`)
        }

        const neo = data.near_earth_objects || {}
        const keys = Object.keys(neo)
        const list = keys.flatMap((k) => neo[k])
        setMeteors(list)
      } catch (err) {
        console.error('Erro ao buscar meteoros:', err)
        setError(err.message)
        setMeteors([])
      } finally {
        setLoading(false)
      }
    })()
  }

  // selection/simulation handlers removed

  const filteredMeteors = hazardousOnly ? meteors.filter((m) => m.is_potentially_hazardous_asteroid) : meteors

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🌍 Simulador de Impacto de Meteoro</h1>
          <p className="subtitle">Escolha um meteoro da base de dados da NASA e veja o impacto na Terra</p>
        </div>
      </header>

      <main className="main-content">
        <section className="controls">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchForRange(startDate, endDate)
            }}
          >
            <div className="date-inputs">
              <label>
                Data inicial
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label>
                Data final
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
            </div>
            <label className="checkbox-inline">
              <input type="checkbox" checked={hazardousOnly} onChange={(e) => setHazardousOnly(e.target.checked)} />{' '}
              Apenas perigosos
            </label>
            <button type="submit" className="btn btn-primary">
              🔍 Buscar Meteoros
            </button>
          </form>
        </section>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando meteoros da NASA...</p>
          </div>
        )}

        {error && <div className="error-message">❌ {error}</div>}

        {/* Map: square cropped container above the list */}
        {!loading && !error && meteors.length > 0 && (
          <section className="map-section">
            <div className="map-crop">
              <div className="map-square">
                <div className="map-inner">
                  <MapContainer
                    center={[0, 0]}
                    zoom={2}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    whenCreated={(map) => setMapInstance(map)}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {filteredMeteors.slice(0, 200).map((meteor) => {
                      const [lat, lon] = idToLatLng(meteor.id)
                      const approach = meteor.close_approach_data?.[0]
                      return (
                        <Marker key={meteor.id} position={[lat, lon]}>
                          <Popup>
                            <div style={{ maxWidth: 240 }}>
                              <strong>{meteor.name}</strong>
                              <div>Diâmetro aprox: {meteor.estimated_diameter ? (((meteor.estimated_diameter.meters.estimated_diameter_min + meteor.estimated_diameter.meters.estimated_diameter_max) / 2).toFixed(3)) + " m" : "—"}</div>
                              {approach && <div>Data de aproximação: {approach.close_approach_date}</div>}
                              <div>Perigoso: {meteor.is_potentially_hazardous_asteroid ? "Sim" : "Não"}</div>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    })}
                  </MapContainer>
                </div>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && meteors.length > 0 && (
          <section className="meteor-selection">
            <h2>Meteoros encontrados</h2>
            <div className="meteor-grid">
              {filteredMeteors.length === 0 ? (
                <div className="empty">Nenhum meteoro corresponde ao filtro aplicado.</div>
              ) : (
                filteredMeteors.map((meteor) => {
                  const diameter = meteor.estimated_diameter
                  const avgDiameter = diameter
                    ? (
                        (diameter.meters.estimated_diameter_min + diameter.meters.estimated_diameter_max) /
                        2
                      ).toFixed(3)
                    : "—"
                  const approach = meteor.close_approach_data?.[0]

                  return (
                    <div key={meteor.id} className={`meteor-card ${meteor.is_potentially_hazardous_asteroid ? "hazardous" : ""}`}>
                      <div className="meteor-card-header">
                        <h3>{meteor.name}</h3>
                        {meteor.is_potentially_hazardous_asteroid && <span className="hazard-badge">⚠️ PERIGOSO</span>}
                      </div>
                      <div className="meteor-card-body">
                        <div className="meteor-stat">
                          <span className="stat-label">Diâmetro:</span>
                          <span className="stat-value">{avgDiameter} Meters</span>
                        </div>
                        <div className="meteor-stat">
                          <span className="stat-label">Magnitude:</span>
                          <span className="stat-value">{meteor.absolute_magnitude_h}</span>
                        </div>
                        {approach && (
                          <div className="meteor-stat">
                            <span className="stat-label">Velocidade:</span>
                            <span className="stat-value">
                              {Number.parseFloat(approach.relative_velocity.kilometers_per_hour).toLocaleString()}{" "}
                              km/h
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Dados fornecidos pela NASA - Near Earth Object Web Service (NEO)</p>
        <p className="disclaimer">
          ⚠️ Esta é uma simulação educacional. Os cálculos são aproximações baseadas em modelos científicos
          simplificados.
        </p>
      </footer>
    </div>
  )
}

export default App
