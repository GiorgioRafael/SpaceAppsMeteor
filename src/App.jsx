"use client"

import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet"
import "./App.css"

// react-leaflet + leaflet for interactive map

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

// prettier, SVG-based image icon for the selected location (data URL)
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
  iconSize: [32, 32], // size of the icon image in px
  iconAnchor: [18, 18], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -18],
  className: 'asteroid-icon',
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

  // NEW: selected map location, meteor selection and modal for simulation
  const [selectedLocation, setSelectedLocation] = useState(null) // { lat, lon }
  const [selectedMeteor, setSelectedMeteor] = useState(null)
  const [showSimModal, setShowSimModal] = useState(false)
  const [simMessage, setSimMessage] = useState(null)
  const meteorListRef = useRef(null)

  // user-controlled parameters for simulation
  const [userVelocity, setUserVelocity] = useState(null) // m/s
  const [userAngle, setUserAngle] = useState(45) // degrees
  const [userDensity, setUserDensity] = useState(3000) // kg/m3

  useEffect(() => {
    fetchForRange(startDate, endDate)
  }, [])

  // when selectedMeteor changes, seed sliders with sensible defaults from data
  useEffect(() => {
    if (!selectedMeteor) return
    const approach = selectedMeteor.close_approach_data?.[0]
    if (approach) {
      const vks = parseFloat(approach.relative_velocity?.kilometers_per_second)
      if (!Number.isNaN(vks)) {
        setUserVelocity(vks * 1000) // m/s
      } else {
        const vkh = parseFloat(approach.relative_velocity?.kilometers_per_hour)
        if (!Number.isNaN(vkh)) setUserVelocity((vkh * 1000) / 3600)
      }
    } else {
      // default 20 km/s
      setUserVelocity(20000)
    }

    // default angle 45
    setUserAngle(45)

    // default density guess
    setUserDensity(selectedMeteor.is_potentially_hazardous_asteroid ? 3500 : 3000)
  }, [selectedMeteor])

  // Map click handler component using react-leaflet hook
  function MapClickHandler({ onMapClick }) {
    useMapEvents({
      click(e) {
        onMapClick && onMapClick(e)
      }
    })
    return null
  }

  // NEW: when user clicks the map, store the lat/lon (no automatic scroll)
  function handleMapClick(e) {
    // e might be a Leaflet event or a synthetic one; ensure latlng exists
    const latlng = e?.latlng || (e && e.lat && e.lng ? { lat: e.lat, lng: e.lng } : null)
    if (!latlng) return
    const { lat, lng } = latlng
    setSelectedLocation({ lat: Number(lat.toFixed(6)), lon: Number(lng.toFixed(6)) })
    // removed automatic scroll per user request
  }

  // NEW: user clicked a meteor card to start a simulation with selectedLocation
  function handleSelectMeteorForSimulation(meteor) {
    setSelectedMeteor(meteor)
    setShowSimModal(true)
  }

  function startSimulation() {
    if (!selectedMeteor) return
    // Placeholder simulation start - replace with your real simulation logic
    const msg = `Simulação iniciada para ${selectedMeteor.name} em (${selectedLocation ? `${selectedLocation.lat}, ${selectedLocation.lon}` : "local não selecionado"})`
    setSimMessage(msg)
    // close modal after starting
    setTimeout(() => {
      setShowSimModal(false)
    }, 600)
    console.log(msg)
  }

  function closeModal() {
    setShowSimModal(false)
    setSelectedMeteor(null)
    setSimMessage(null)
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
    const url = buildApiUrl(start, end)
    setLoading(true)

    ;(async () => {
      try {
        const res = await fetch(url)
        const bodyText = await res.text()

        if (!res.ok) {
          // include part of the error to help debugging (e.g., HTML error page)
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

  const filteredMeteors = hazardousOnly ? meteors.filter((m) => m.is_potentially_hazardous_asteroid) : meteors

  // compute zones from selected meteor and user inputs
  function computeImpactZones(meteor, opts = {}) {
    if (!meteor) return null
    const diameterObj = meteor.estimated_diameter?.meters
    if (!diameterObj) return null

    const avgDiameter = (diameterObj.estimated_diameter_min + diameterObj.estimated_diameter_max) / 2 // meters

    // mass: sphere volume * density
    const r = avgDiameter / 2
    const density = opts.density || userDensity || (meteor.is_potentially_hazardous_asteroid ? 3500 : 3000)
    const volume = (4 / 3) * Math.PI * Math.pow(r, 3)
    const mass = volume * density // kg

    // velocity: prefer user, then approach data, then fallback 20 km/s
    let v = opts.velocity || userVelocity
    if (!v) {
      const approach = meteor.close_approach_data?.[0]
      if (approach) {
        const vks = parseFloat(approach.relative_velocity?.kilometers_per_second)
        if (!Number.isNaN(vks)) v = vks * 1000
        else {
          const vkh = parseFloat(approach.relative_velocity?.kilometers_per_hour)
          if (!Number.isNaN(vkh)) v = (vkh * 1000) / 3600
        }
      }
    }
    if (!v) v = 20000 // m/s fallback

    // angle: degrees, user or opts; default 45
    const angleDeg = opts.angle || userAngle || 45
    const angleRad = (angleDeg * Math.PI) / 180

    // energy (J)
    const energyJ = 0.5 * mass * v * v
    const energyMt = energyJ / 4.184e15 // megatons TNT

    // adjust energy by angle (vertical component) to approximate deposition
    const effectiveFactor = Math.max(Math.sin(angleRad), 0.1)
    const energyEffectiveMt = energyMt * effectiveFactor

    // crater estimation: heuristic using cubic-root scaling with energy
    const craterFromEnergy = 1000 * Math.pow(Math.max(energyEffectiveMt, 1e-12), 1 / 3) // meters
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

  function estimateImpactRadius(meteor) {
    const zones = computeImpactZones(meteor)
    return zones ? zones.craterRadius : 0
  }

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
            <div className="map-row">
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
                      <MapClickHandler onMapClick={handleMapClick} />

                      {/* show a temporary marker where the user clicked to confirm selection */}
                      {selectedLocation && (
                        <Marker position={[selectedLocation.lat, selectedLocation.lon]} icon={asteroidIcon} />
                      )}

                      {selectedLocation && selectedMeteor && (() => {
                        const zones = computeImpactZones(selectedMeteor, { velocity: userVelocity, angle: userAngle, density: userDensity })
                        if (!zones) return null
                        return (
                          <>
                            <Circle
                              center={[selectedLocation.lat, selectedLocation.lon]}
                              radius={zones.craterRadius}
                              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.28 }}
                            />
                            <Circle
                              center={[selectedLocation.lat, selectedLocation.lon]}
                              radius={zones.severeRadius}
                              pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.18 }}
                            />
                            <Circle
                              center={[selectedLocation.lat, selectedLocation.lon]}
                              radius={zones.moderateRadius}
                              pathOptions={{ color: 'yellow', fillColor: 'yellow', fillOpacity: 0.12 }}
                            />
                            <Circle
                              center={[selectedLocation.lat, selectedLocation.lon]}
                              radius={zones.lightRadius}
                              pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.08 }}
                            />
                          </>
                        )
                      })()}
                    </MapContainer>
                  </div>
                </div>
              </div>

              {/* Impact control panel */}
              <aside className="impact-panel">
                <h3>Parâmetros de Impacto</h3>
                <div className="panel-row">
                  <label>Velocidade (km/s): <strong>{(userVelocity || 0) / 1000}</strong></label>
                  <input
                    type="range"
                    min={5}
                    max={70}
                    step={0.5}
                    value={(userVelocity || 20000) / 1000}
                    onChange={(e) => setUserVelocity(Number(e.target.value) * 1000)}
                  />
                </div>

                <div className="panel-row">
                  <label>Ângulo de entrada (°): <strong>{userAngle}</strong></label>
                  <input
                    type="range"
                    min={5}
                    max={90}
                    step={1}
                    value={userAngle}
                    onChange={(e) => setUserAngle(Number(e.target.value))}
                  />
                </div>

                <div className="panel-row">
                  <label>Densidade (kg/m³): <strong>{userDensity}</strong></label>
                  <input
                    type="range"
                    min={500}
                    max={8000}
                    step={50}
                    value={userDensity}
                    onChange={(e) => setUserDensity(Number(e.target.value))}
                  />
                </div>

                <hr />

                <h4>Resultado (selecionado)</h4>
                {selectedMeteor ? (() => {
                  const zones = computeImpactZones(selectedMeteor, { velocity: userVelocity, angle: userAngle, density: userDensity })
                  if (!zones) return <div>Nenhuma informação suficiente.</div>
                  return (
                    <div className="zones-list">
                      <div>Diâmetro médio: <strong>{zones.avgDiameter.toFixed(2)} m</strong></div>
                      <div>Massa estimada: <strong>{Number(zones.mass).toExponential(3)} kg</strong></div>
                      <div>Velocidade: <strong>{(zones.velocity / 1000).toFixed(2)} km/s</strong></div>
                      <div>Energia: <strong>{zones.energyMt.toExponential(3)} Mt</strong></div>
                      <div>Cratera (raio): <strong>{Math.round(zones.craterRadius)} m</strong></div>
                      <div>Severa: <strong>{Math.round(zones.severeRadius)} m</strong></div>
                      <div>Moderada: <strong>{Math.round(zones.moderateRadius)} m</strong></div>
                      <div>Leve: <strong>{Math.round(zones.lightRadius)} m</strong></div>
                      <div style={{ marginTop: 8 }}>
                        <button className="btn btn-primary" onClick={startSimulation}>Aplicar e iniciar simulação</button>
                      </div>
                    </div>
                  )
                })() : (
                  <div>Selecione um meteoro para ver os resultados.</div>
                )}
              </aside>
            </div>
          </section>
        )}

        {!loading && !error && meteors.length > 0 && (
          <section ref={meteorListRef} className="meteor-selection">
            <h2>Meteoros encontrados</h2>

            {/* NEW: selected location banner */}
            {selectedLocation && (
              <div className="selected-location-banner">
                <div>Local selecionado: {selectedLocation.lat}, {selectedLocation.lon}</div>
                <div className="selected-actions">
                  <button className="btn btn-secondary" onClick={() => setSelectedLocation(null)}>Limpar</button>
                </div>
              </div>
            )}

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
                    <div
                      key={meteor.id}
                      className={`meteor-card ${meteor.is_potentially_hazardous_asteroid ? "hazardous" : ""}`}
                      onClick={() => handleSelectMeteorForSimulation(meteor)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSelectMeteorForSimulation(meteor) }}
                    >
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

        {/* NEW: Simulation modal */}
        {showSimModal && (
          <div className="sim-modal-overlay" onClick={closeModal}>
            <div className="sim-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Simular impacto</h3>
              <div style={{ marginBottom: 12 }}>
                <strong>{selectedMeteor?.name}</strong>
                <div style={{ color: '#b8b8d1', fontSize: 13 }}>
                  {selectedMeteor?.is_potentially_hazardous_asteroid ? 'Perigoso' : 'Não perigoso'}
                </div>
                <div style={{ marginTop: 8 }}>
                  Local: {selectedLocation ? `${selectedLocation.lat}, ${selectedLocation.lon}` : 'Nenhum local selecionado'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary" onClick={startSimulation}>Iniciar Simulação</button>
              </div>

              {simMessage && <div style={{ marginTop: 12, color: '#48dbfb' }}>{simMessage}</div>}
            </div>
          </div>
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

function estimateImpactRadius(meteor) {
  if (!meteor) return 0
  const diameter = meteor.estimated_diameter?.meters
  if (!diameter) return 0
  const avgDiameter = (diameter.estimated_diameter_min + diameter.estimated_diameter_max) / 2

  return avgDiameter * 1.5 * 1000 //Rafael, é aqui que mexe na escala da explosão
}

export default App
