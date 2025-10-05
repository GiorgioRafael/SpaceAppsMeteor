"use client"

import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet"
import "./App.css"

import * as L from "leaflet"
import "leaflet/dist/leaflet.css"

const defaultIcon = L.icon({
  iconUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAOzSURBVFiFtZhLaBxVGIW/e2dSSTQxCZo0aqzRRDAaFRVEQRBBBEGhUBFEEBcuXLhw5UpwIYILFy5cuHDhQhAXIohQEBEUH4iKj0SNj5jEJE2TZJLMTGbmXhczSWrSZDLTmT/c1b3n3PO/c+65/z0wYjQajWnADmAncBfQDEwCJgAXgQvAGeAE8BXwcblcPjVqkEajMQV4HHgU2A7MBq4BfUAXcBnwgElAE9AKzAXuBu4BtgCfAB+Uy+WuoYI0Go1pwMvAi8Ak4BfgQ+Bb4GS5XO4ZwmcjsAl4AHgKmA98BLxWLpf/GhCk0WhMAV4BXgKuAe8D75TL5fOjCQ4gIjOBZ4HngRbgXeClcrl8pV+QRqMxHXgDeAb4E3i5XC5/M5aAg4jIXOBN4EngXeD5crl8qV+QRqMxA/gYuB94pVwuvzfegP0RkXnAJ8BG4IlyufxNvyDtwCfASeChcrl8YbxB+iMiC4AvgT+AreVy+Wy/IIuBH4Hd5XL5q3GH+x8RWQocAnaXy+Wv+wW5G/gO2FEul38Yd7j/EZHlwPfAznK5fKRfkM3AYWBruVw+Oe5w/yMiK4EjwJZyuXy8X5D1wGFgXblcPjXucP8jIquBw8C6crn8S78grcBRYHW5XD4z7nD/IyJrgKPAqnK5fLZfkOnAcWBFuVzuHHe4/xGRdcBxYHm5XD7XL8hE4BdgSblc/nPc4f5HRDYAvwJLy+Xy+X5BPPALsLhcLv8+7nD/IyKbgF+AxeVy+UK/IB5wDFhYLpf/GHe4/xGRzcAxYEG5XL7YL4gHHAXml8vlv8cd7n9EZCtwFFhQLpf/7hfEAw4Dc8vl8j/jDvc/IrIdOATMLZfLl/oF8YADwJxyuXx13OH+R0R2AAeB2eVy+XK/IB7wOTCrXC5fHXe4/xGRncDnwMxyudzVL4gHfAbMLJfL18Yd7n9EZBfwKTCjXC539wviAZ8AM8rlcs+4w/2PiOwGPgaml8vlnn5BPOAjYFq5XO4dd7j/EZE9wIfA1HK53NcviAd8AEwpl8vXxx3uf0RkL/A+MLlcLvf1C+IB7wGTy+Vy/7jD/Y+I7APeASaVy+Ub/YJ4wNvApHK5fHPc4f5HRPYDbwGN5XL51oAgHvAmMKFcLt8ed7j/EZEDwOtAQ7lcvjMgiAe8BtTL5fKdcYf7HxE5CLwK1Mvl8t0BQTzgFaBWLpfvjTvc/4jIIeBlYEK5XP4XOQ3Ycmvt5UYAAAAASUVORK5CYII=",
  shadowUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAQAAAACach9AAACMUlEQVR4Ae3ShY7jQBAE0Aoz/f9/HTMzhg1zrdKUrJbdx+Kd2nD8VNudfsL/Th///dyQN2TH6f3y/BGpC379rV+S+qqetBOxImNQXL8JCAr2V4iMQXHGNJxeCfZXhSRBcQMfvkOWUdtfzlLgAENmZDcmo2TVmt8OSM2eXxBp3DjHSMFutqS7SbmemzBiR+xpKCNUIRkdkkYxhAkyGoBvyQFEJEefwSmmvBfJuJ6aKqKWnAkvGZOaZXTUgFqYULWNSHUckZuR1HIIimUExutRxwzOLROIG4vKmCKQt364mIlhSyzAf1m9lHZHJZrlAOMMztRRiKimp/rpdJDc9Awry5xTZCte7FHtuS8wJgeYGrex28xNTd086Dik7vUMscQOa8y4DoGtCCSkAKlNwpgNtphjrC6MIHUkR6YWxxs6Sc5xqn222mmCRFzIt8lEdKx+ikCtg91qS2WpwVfBelJCiQJwvzixfI9cxZQWgiSJelKnwBElKYtDOb2MFbhmUigbReQBV0Cg4+qMXSxXSyGUn4UbF8l+7qdSGnTC0XLCmahIgUHLhLOhpVCtw4CzYXvLQWQbJNmxoCsOKAxSgBJno75avolkRw8iIAFcsdc02e9iyCd8tHwmeSSoKTowIgvscSGZUOA7PuCN5b2BX9mQM7S0wYhMNU74zgsPBj3HU7wguAfnxxjFQGBE6pwN+GjME9zHY7zGp8wVxMShYX9NXvEWD3HbwJf4giO4CFIQxXScH1/TM+04kkBiAAAAAElFTkSuQmCC",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Icon.Default.mergeOptions({
  iconUrl: defaultIcon.options.iconUrl,
  iconRetinaUrl: defaultIcon.options.iconRetinaUrl,
  shadowUrl: defaultIcon.options.shadowUrl,
})

const asteroidSvg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
  <g>
    <ellipse cx='33' cy='24' rx='18' ry='12' fill='%23b89a6f' />
    <path d='M12 32c4-8 16-14 25-8s18 18 10 26-28 8-34 0-5-14-1-18z' fill='%23806b4b' opacity='0.9'/>
    <circle cx='24' cy='20' r='2.5' fill='%23fff' opacity='0.9' />
    <circle cx='40' cy='28' r='2' fill='%23ffd27f' opacity='0.9' />
  </g>
</svg>
`

const asteroidIcon = L.icon({
  iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(asteroidSvg)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

function buildApiUrl(startDate, endDate) {
  return `/api/nasa/meteors?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
}

function App() {
  const [currentStep, setCurrentStep] = useState(1)
  const [meteors, setMeteors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const today = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [hazardousOnly, setHazardousOnly] = useState(false)

  const [selectedMeteor, setSelectedMeteor] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)

  const [userVelocity, setUserVelocity] = useState(20000)
  const [userAngle, setUserAngle] = useState(45)
  const [userDensity, setUserDensity] = useState(3000)

  const [simulationResults, setSimulationResults] = useState(null)
  const [populationData, setPopulationData] = useState(null)

  const meteorSectionRef = useRef(null)
  const mapSectionRef = useRef(null)
  const resultsSectionRef = useRef(null)

  useEffect(() => {
    if (!selectedMeteor) return
    const approach = selectedMeteor.close_approach_data?.[0]
    if (approach) {
      const vks = Number.parseFloat(approach.relative_velocity?.kilometers_per_second)
      if (!Number.isNaN(vks)) {
        setUserVelocity(vks * 1000)
      } else {
        const vkh = Number.parseFloat(approach.relative_velocity?.kilometers_per_hour)
        if (!Number.isNaN(vkh)) setUserVelocity((vkh * 1000) / 3600)
      }
    } else {
      setUserVelocity(20000)
    }

    setUserAngle(45)
    setUserDensity(selectedMeteor.is_potentially_hazardous_asteroid ? 3500 : 3000)
  }, [selectedMeteor])

  // Clear population results when changing location or meteor; we only recompute on simulate
  useEffect(() => {
    if (!selectedLocation || !selectedMeteor) {
      setPopulationData(null)
      return
    }
    // Do not auto-recompute; keep last results visible until next simulation, or clear on change
    setPopulationData(null)
  }, [selectedLocation, selectedMeteor])

  function MapClickHandler({ onMapClick }) {
    useMapEvents({
      click(e) {
        onMapClick && onMapClick(e)
      },
    })
    return null
  }

  function handleMapClick(e) {
    const latlng = e?.latlng || (e && e.lat && e.lng ? { lat: e.lat, lng: e.lng } : null)
    if (!latlng) return
    const { lat, lng } = latlng
    setSelectedLocation({ lat: Number(lat.toFixed(6)), lon: Number(lng.toFixed(6)) })
    setCurrentStep(4)
  }

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

    const daysDiff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24))
    if (daysDiff > 7) {
      setError("O período máximo é de 7 dias")
      return
    }

    const url = buildApiUrl(start, end)
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(url)
        const bodyText = await res.text()

        if (!res.ok) {
          const snippet = bodyText ? ` - ${bodyText.slice(0, 500)}` : ""
          throw new Error(`HTTP ${res.status} ${res.statusText}${snippet}`)
        }

        let data
        try {
          data = bodyText ? JSON.parse(bodyText) : {}
        } catch (parseErr) {
          const snippet = bodyText ? bodyText.slice(0, 500) : "[vazio]"
          const lower = snippet.toLowerCase()
          if (lower.includes("<!doctype") || lower.includes("<html")) {
            try {
              const apiKey = import.meta.env.VITE_NASA_API_KEY || "XO0W1Kz2NafloPaPFMp2UebjtaOUrZVVWw2bW5Ah"
              const nasaUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}&api_key=${apiKey}`
              const nres = await fetch(nasaUrl)
              const ntext = await nres.text()
              if (!nres.ok) throw new Error(`NASA API HTTP ${nres.status} - ${ntext.slice(0, 300)}`)
              const ndata = ntext ? JSON.parse(ntext) : {}
              const neo = ndata.near_earth_objects || {}
              const keys = Object.keys(neo)
              const list = keys.flatMap((k) => neo[k])
              setMeteors(list)
              setCurrentStep(2)
              setTimeout(() => {
                meteorSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }, 100)
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

        setCurrentStep(2)
        setTimeout(() => {
          meteorSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 100)
      } catch (err) {
        console.error("Erro ao buscar meteoros:", err)
        setError(err.message)
        setMeteors([])
      } finally {
        setLoading(false)
      }
    })()
  }

  function handleSelectMeteor(meteor) {
    setSelectedMeteor(meteor)
    setCurrentStep(3)
    setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  function startSimulation() {
    if (!selectedMeteor || !selectedLocation) return

    const zones = computeImpactZones(selectedMeteor, {
      velocity: userVelocity,
      angle: userAngle,
      density: userDensity,
    })

    setSimulationResults(zones)
    setCurrentStep(5)

    // Compute population estimates only when starting the simulation
    if (zones) {
      const areaFor = (radiusMeters) => (Math.PI * Math.pow(radiusMeters, 2)) / 1e6 // km^2
      // Default density assumption (people/km²). Could be replaced by an API-based lookup later
      const estimatedDensity = 500
      const estimates = {
        crater: Math.round(estimatedDensity * areaFor(zones.craterRadius)),
        severe: Math.round(estimatedDensity * areaFor(zones.severeRadius)),
        moderate: Math.round(estimatedDensity * areaFor(zones.moderateRadius)),
        light: Math.round(estimatedDensity * areaFor(zones.lightRadius)),
      }
      setPopulationData({
        estimates,
        source: "Estimativa baseada em densidade populacional média",
        confidence: "medium",
      })
    }
  }

  function resetSimulation() {
    setSelectedMeteor(null)
    setSelectedLocation(null)
    setSimulationResults(null)
    setPopulationData(null)
    setCurrentStep(1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function computeImpactZones(meteor, opts = {}) {
    if (!meteor) return null
    const diameterObj = meteor.estimated_diameter?.meters
    if (!diameterObj) return null

    const avgDiameter = (diameterObj.estimated_diameter_min + diameterObj.estimated_diameter_max) / 2

    const r = avgDiameter / 2
    const density = opts.density || userDensity || 3000
    const volume = (4 / 3) * Math.PI * Math.pow(r, 3)
    const mass = volume * density

    const v = opts.velocity || userVelocity || 20000

    const angleDeg = opts.angle || userAngle || 45
    const angleRad = (angleDeg * Math.PI) / 180

    const energyJ = 0.5 * mass * v * v
    const energyMt = energyJ / 4.184e15

    const effectiveFactor = Math.max(Math.sin(angleRad), 0.1)
    const energyEffectiveMt = energyMt * effectiveFactor

    const craterFromEnergy = 1000 * Math.pow(Math.max(energyEffectiveMt, 1e-12), 1 / 3)
    const craterFromSize = avgDiameter * 10
    const craterRadius = Math.max(craterFromEnergy, craterFromSize)

    const severeRadius = craterRadius * 1.5
    const moderateRadius = craterRadius * 3
    const lightRadius = craterRadius * 6

    return {
      avgDiameter,
      mass,
      density,
      velocity: v,
      angleDeg,
      energyJ,
      energyMt,
      craterRadius,
      severeRadius,
      moderateRadius,
      lightRadius,
    }
  }

  const filteredMeteors = hazardousOnly ? meteors.filter((m) => m.is_potentially_hazardous_asteroid) : meteors

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🌍 Simulador de Impacto de Asteroide</h1>
          <p className="subtitle">Simule o impacto de asteroides reais da NASA na Terra</p>
        </div>
      </header>

      <main className="main-content">
        <div className="step-indicator">
          <div className={`step-item ${currentStep >= 1 ? "active" : ""} ${currentStep > 1 ? "completed" : ""}`}>
            <div className="step-number">1</div>
            <div className="step-label">Buscar Meteoros</div>
          </div>
          <div className="step-arrow">→</div>
          <div className={`step-item ${currentStep >= 2 ? "active" : ""} ${currentStep > 2 ? "completed" : ""}`}>
            <div className="step-number">2</div>
            <div className="step-label">Escolher Meteoro</div>
          </div>
          <div className="step-arrow">→</div>
          <div className={`step-item ${currentStep >= 3 ? "active" : ""} ${currentStep > 3 ? "completed" : ""}`}>
            <div className="step-number">3</div>
            <div className="step-label">Selecionar Local</div>
          </div>
          <div className="step-arrow">→</div>
          <div className={`step-item ${currentStep >= 4 ? "active" : ""} ${currentStep > 4 ? "completed" : ""}`}>
            <div className="step-number">4</div>
            <div className="step-label">Ajustar Parâmetros</div>
          </div>
          <div className="step-arrow">→</div>
          <div className={`step-item ${currentStep >= 5 ? "active" : ""}`}>
            <div className="step-number">5</div>
            <div className="step-label">Ver Resultados</div>
          </div>
        </div>

        <section className="section">
          <div className="section-header">
            <div className="section-number">1</div>
            <div className="section-title">
              <h2>Buscar Meteoros</h2>
              <p>Selecione um período de até 7 dias para buscar asteroides próximos à Terra</p>
            </div>
          </div>

          <form
            className="date-form"
            onSubmit={(e) => {
              e.preventDefault()
              fetchForRange(startDate, endDate)
            }}
          >
            <div className="date-inputs">
              <div className="date-input-group">
                <label>Data Inicial</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="date-input-group">
                <label>Data Final</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>

            <div className="filter-options">
              <input
                type="checkbox"
                id="hazardous-filter"
                checked={hazardousOnly}
                onChange={(e) => setHazardousOnly(e.target.checked)}
              />
              <label htmlFor="hazardous-filter">Mostrar apenas asteroides perigosos</label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "🔄 Buscando..." : "🔍 Buscar Meteoros"}
            </button>
          </form>

          {error && <div className="error-message">❌ {error}</div>}
        </section>

        {meteors.length > 0 && (
          <section ref={meteorSectionRef} className="section">
            <div className="section-header">
              <div className="section-number">2</div>
              <div className="section-title">
                <h2>Escolher Meteoro</h2>
                <p>
                  Encontramos {filteredMeteors.length} asteroide{filteredMeteors.length !== 1 ? "s" : ""} no período
                  selecionado
                </p>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Carregando meteoros da NASA...</p>
              </div>
            ) : (
              <div className="meteor-grid">
                {filteredMeteors.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#a0a0c0" }}>
                    Nenhum meteoro corresponde ao filtro aplicado.
                  </div>
                ) : (
                  filteredMeteors.map((meteor) => {
                    const diameter = meteor.estimated_diameter
                    const avgDiameter = diameter
                      ? ((diameter.meters.estimated_diameter_min + diameter.meters.estimated_diameter_max) / 2).toFixed(
                          2,
                        )
                      : "—"
                    const approach = meteor.close_approach_data?.[0]

                    return (
                      <div
                        key={meteor.id}
                        className={`meteor-card ${meteor.is_potentially_hazardous_asteroid ? "hazardous" : ""}`}
                      >
                        <div className="meteor-card-header">
                          <h3>{meteor.name}</h3>
                          {meteor.is_potentially_hazardous_asteroid && <span className="hazard-badge">⚠️ PERIGOSO</span>}
                        </div>
                        <div className="meteor-card-body">
                          <div className="meteor-stat">
                            <span className="stat-label">Diâmetro médio</span>
                            <span className="stat-value">{avgDiameter} m</span>
                          </div>
                          <div className="meteor-stat">
                            <span className="stat-label">Magnitude</span>
                            <span className="stat-value">{meteor.absolute_magnitude_h}</span>
                          </div>
                          {approach && (
                            <div className="meteor-stat">
                              <span className="stat-label">Velocidade</span>
                              <span className="stat-value">
                                {Number.parseFloat(approach.relative_velocity.kilometers_per_hour).toLocaleString()}{" "}
                                km/h
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="meteor-card-footer">
                          <button className="btn btn-select" onClick={() => handleSelectMeteor(meteor)}>
                            Selecionar este meteoro →
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </section>
        )}

        {selectedMeteor && (
          <section ref={mapSectionRef} className="section">
            <div className="section-header">
              <div className="section-number">3</div>
              <div className="section-title">
                <h2>Selecionar Local e Ajustar Parâmetros</h2>
                <p>Clique no mapa para escolher o ponto de impacto e ajuste os parâmetros da simulação</p>
              </div>
            </div>

            <div className="selected-meteor-banner">
              <div className="selected-meteor-info">
                <h4>🌠 {selectedMeteor.name}</h4>
                <p>
                  {selectedMeteor.is_potentially_hazardous_asteroid ? "⚠️ Asteroide Perigoso" : "Asteroide Não Perigoso"}{" "}
                  • Diâmetro:{" "}
                  {(
                    (selectedMeteor.estimated_diameter.meters.estimated_diameter_min +
                      selectedMeteor.estimated_diameter.meters.estimated_diameter_max) /
                    2
                  ).toFixed(2)}{" "}
                  m
                </p>
              </div>
              <button className="btn btn-secondary" onClick={resetSimulation}>
                ← Escolher outro meteoro
              </button>
            </div>

            <div className="map-layout">
              <div className="map-container">
                <div className="map-wrapper">
                  <MapContainer
                    center={selectedLocation ? [selectedLocation.lat, selectedLocation.lon] : [0, 0]}
                    zoom={selectedLocation ? 8 : 2}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onMapClick={handleMapClick} />

                    {selectedLocation && (
                      <Marker position={[selectedLocation.lat, selectedLocation.lon]} icon={asteroidIcon} />
                    )}

                    {selectedLocation &&
                      simulationResults && (
                        <>
                          <Circle
                            center={[selectedLocation.lat, selectedLocation.lon]}
                            radius={simulationResults.craterRadius}
                            pathOptions={{ color: "#ff0000", fillColor: "#ff0000", fillOpacity: 0.3 }}
                          />
                          <Circle
                            center={[selectedLocation.lat, selectedLocation.lon]}
                            radius={simulationResults.severeRadius}
                            pathOptions={{ color: "#ff6600", fillColor: "#ff6600", fillOpacity: 0.2 }}
                          />
                          <Circle
                            center={[selectedLocation.lat, selectedLocation.lon]}
                            radius={simulationResults.moderateRadius}
                            pathOptions={{ color: "#ffcc00", fillColor: "#ffcc00", fillOpacity: 0.15 }}
                          />
                          <Circle
                            center={[selectedLocation.lat, selectedLocation.lon]}
                            radius={simulationResults.lightRadius}
                            pathOptions={{ color: "#00ff00", fillColor: "#00ff00", fillOpacity: 0.1 }}
                          />
                        </>
                      )}
                  </MapContainer>
                </div>

                {!selectedLocation ? (
                  <div className="location-info location-info-empty">
                    👆 Clique no mapa para selecionar o ponto de impacto
                  </div>
                ) : !populationData ? (
                  <div className="location-info">
                    📍 Local selecionado: {selectedLocation.lat}°, {selectedLocation.lon}°
                  </div>
                ) : (
                  <div className="population-display">
                    <div className="population-header">
                      <h4>👥 Pessoas Afetadas por Zona</h4>
                      <div className="population-meta">
                        <span className="population-source">{populationData.source}</span>
                        <span className={`confidence-badge confidence-${populationData.confidence}`}>
                          {populationData.confidence === "high"
                            ? "Alta Confiança"
                            : populationData.confidence === "medium"
                              ? "Média Confiança"
                              : "Baixa Confiança"}
                        </span>
                      </div>
                    </div>
                    <div className="population-grid">
                      <div className="population-card crater-zone">
                        <div className="population-card-header">
                          <span className="zone-indicator" style={{ background: "#ff0000" }}></span>
                          <span className="zone-name">Cratera</span>
                        </div>
                        <div className="population-count">{populationData.estimates.crater.toLocaleString()}</div>
                        <div className="population-description">Destruição total</div>
                      </div>
                      <div className="population-card severe-zone">
                        <div className="population-card-header">
                          <span className="zone-indicator" style={{ background: "#ff6600" }}></span>
                          <span className="zone-name">Severa</span>
                        </div>
                        <div className="population-count">{populationData.estimates.severe.toLocaleString()}</div>
                        <div className="population-description">Danos estruturais graves</div>
                      </div>
                      <div className="population-card moderate-zone">
                        <div className="population-card-header">
                          <span className="zone-indicator" style={{ background: "#ffcc00" }}></span>
                          <span className="zone-name">Moderada</span>
                        </div>
                        <div className="population-count">{populationData.estimates.moderate.toLocaleString()}</div>
                        <div className="population-description">Danos significativos</div>
                      </div>
                      <div className="population-card light-zone">
                        <div className="population-card-header">
                          <span className="zone-indicator" style={{ background: "#00ff00" }}></span>
                          <span className="zone-name">Leve</span>
                        </div>
                        <div className="population-count">{populationData.estimates.light.toLocaleString()}</div>
                        <div className="population-description">Danos menores</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <aside className="parameters-panel">
                <h3>⚙️ Parâmetros</h3>

                <div className="parameter-group">
                  <div className="parameter-label">
                    <span>Velocidade</span>
                    <span className="parameter-value">{(userVelocity / 1000).toFixed(1)} km/s</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={70000}
                    step={500}
                    value={userVelocity}
                    onChange={(e) => setUserVelocity(Number(e.target.value))}
                  />
                </div>

                <div className="parameter-group">
                  <div className="parameter-label">
                    <span>Ângulo de entrada</span>
                    <span className="parameter-value">{userAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={90}
                    step={1}
                    value={userAngle}
                    onChange={(e) => setUserAngle(Number(e.target.value))}
                  />
                </div>

                <div className="parameter-group">
                  <div className="parameter-label">
                    <span>Densidade</span>
                    <span className="parameter-value">{userDensity} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={8000}
                    step={50}
                    value={userDensity}
                    onChange={(e) => setUserDensity(Number(e.target.value))}
                  />
                </div>

                {selectedLocation && simulationResults && (
                  <div className="impact-zones">
                    <h4>Zonas de Impacto</h4>
                    <div className="zone-item">
                      <div className="zone-label">
                        <span className="zone-color" style={{ background: "#ff0000" }}></span>
                        Cratera
                      </div>
                      <span className="zone-value">{Math.round(simulationResults.craterRadius)} m</span>
                    </div>
                    <div className="zone-item">
                      <div className="zone-label">
                        <span className="zone-color" style={{ background: "#ff6600" }}></span>
                        Severa
                      </div>
                      <span className="zone-value">{Math.round(simulationResults.severeRadius)} m</span>
                    </div>
                    <div className="zone-item">
                      <div className="zone-label">
                        <span className="zone-color" style={{ background: "#ffcc00" }}></span>
                        Moderada
                      </div>
                      <span className="zone-value">{Math.round(simulationResults.moderateRadius)} m</span>
                    </div>
                    <div className="zone-item">
                      <div className="zone-label">
                        <span className="zone-color" style={{ background: "#00ff00" }}></span>
                        Leve
                      </div>
                      <span className="zone-value">{Math.round(simulationResults.lightRadius)} m</span>
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary simulate-button"
                  onClick={startSimulation}
                  disabled={!selectedLocation}
                >
                  🚀 Iniciar Simulação
                </button>
              </aside>
            </div>
          </section>
        )}

        {simulationResults && (
          <section ref={resultsSectionRef} className="section">
            <div className="section-header">
              <div className="section-number">5</div>
              <div className="section-title">
                <h2>Resultados da Simulação</h2>
                <p>Análise completa do impacto do asteroide {selectedMeteor.name}</p>
              </div>
            </div>

            <div className="results-grid">
              <div className="result-card highlight">
                <div className="result-icon">💥</div>
                <div className="result-label">Energia</div>
                <div className="result-value">{simulationResults.energyMt.toExponential(2)} Mt</div>
              </div>

              <div className="result-card">
                <div className="result-icon">⚖️</div>
                <div className="result-label">Massa</div>
                <div className="result-value">{Number(simulationResults.mass).toExponential(2)} kg</div>
              </div>

              <div className="result-card">
                <div className="result-icon">📏</div>
                <div className="result-label">Diâmetro</div>
                <div className="result-value">{simulationResults.avgDiameter.toFixed(1)} m</div>
              </div>

              <div className="result-card">
                <div className="result-icon">⚡</div>
                <div className="result-label">Velocidade</div>
                <div className="result-value">{(simulationResults.velocity / 1000).toFixed(1)} km/s</div>
              </div>

              <div className="result-card">
                <div className="result-icon">🎯</div>
                <div className="result-label">Ângulo</div>
                <div className="result-value">{simulationResults.angleDeg}°</div>
              </div>

              <div className="result-card">
                <div className="result-icon">🕳️</div>
                <div className="result-label">Raio da Cratera</div>
                <div className="result-value">{Math.round(simulationResults.craterRadius)} m</div>
              </div>
            </div>

            <div className="impact-description">
              <h4>📊 Análise do Impacto</h4>
              <p>
                <strong>Energia liberada:</strong> O impacto liberaria aproximadamente{" "}
                <strong>{simulationResults.energyMt.toExponential(2)} megatons</strong> de energia TNT equivalente.
                {simulationResults.energyMt > 1 && " Isso é comparável a uma explosão nuclear de grande escala."}
              </p>
              <p>
                <strong>Cratera:</strong> Uma cratera com raio de aproximadamente{" "}
                <strong>{Math.round(simulationResults.craterRadius)} metros</strong> seria formada no ponto de impacto.
              </p>
              <p>
                <strong>Zona de destruição severa:</strong> Até{" "}
                <strong>{Math.round(simulationResults.severeRadius)} metros</strong> do ponto de impacto, haveria
                destruição quase total de estruturas.
              </p>
              <p>
                <strong>Zona de danos moderados:</strong> Até{" "}
                <strong>{Math.round(simulationResults.moderateRadius)} metros</strong>, estruturas sofreriam danos
                significativos e haveria risco de ferimentos graves.
              </p>
              <p>
                <strong>Zona de danos leves:</strong> Até{" "}
                <strong>{Math.round(simulationResults.lightRadius)} metros</strong>, janelas quebrariam e haveria danos
                menores a estruturas.
              </p>
            </div>

            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <button className="btn btn-primary" onClick={resetSimulation}>
                🔄 Nova Simulação
              </button>
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
