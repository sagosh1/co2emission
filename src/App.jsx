import { useState } from "react"
import "./App.css"
import { CAR_MODELS, TRANSPORT_OPTIONS } from "./data/data"
import { useEmissionResult } from "./hooks/useEmissionResult"

export default function App() {
  const [transport, setTransport] = useState("bus")
  const [distance,  setDistance]  = useState(50)
  const [carModel,  setCarModel]  = useState(CAR_MODELS[0].model)
  const [frequency, setFrequency] = useState(4)

  const result = useEmissionResult({ transport, carModel, distance, frequency })

  return (
    <div className="app">
      <h1>CO2 Emission Calculator</h1>
      <p className="subtitle">
        Calculate your CO2 emissions based on your transportation choices.
      </p>
      <p className="subtitle">
        This <i>Studienleistung</i> task for the course{" "}
        <b>Architecture of Information Systems</b> is submit by{" "}
        <i>Sagosh Kumar</i> using the React.js
      </p>

      <div className="card">
        <div className="field">
          <label htmlFor="transport">Transport Mode: </label>
          <select id="transport" value={transport} onChange={(e) => setTransport(e.target.value)}>
            {TRANSPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {transport === "car" && (
          <div className="field">
            <label htmlFor="carModel">Car Model (WLTP G/KM):</label>
            <select id="carModel" value={carModel} onChange={(e) => setCarModel(e.target.value)}>
              {CAR_MODELS.map((car) => (
                <option key={car.model} value={car.model}>
                  {car.model} — {car.gCo2PerKm} G/KM
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="distance">Distance (KM, One Way): </label>
          <input
            id="distance" type="number" min="0" step="0.1"
            value={distance} onChange={(e) => setDistance(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="frequency">Travel Frequency: </label>
          <input
            id="frequency" type="number" min="0" step="1"
            value={frequency} onChange={(e) => setFrequency(e.target.value)}
          />
        </div>
      </div>

      {result && (
        <div className="card result">
          <dl>
            <div><dt>G CO₂ / KM</dt><dd>{result.gPerKm.toFixed(1)}</dd></div>
            <div><dt>G CO₂ Per Trip</dt><dd>{result.gramsPerTrip.toFixed(1)}</dd></div>
            <div>
              <dt>Total CO₂ (All Trips)</dt>
              <dd className="highlight">
                {result.totalGrams.toFixed(1)} G ({result.totalKg.toFixed(3)} KG)
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
