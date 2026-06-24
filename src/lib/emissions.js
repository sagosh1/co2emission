import { CAR_MODELS, TRANSPORT_G_PER_KM } from "../data/data.js"

export const GRAMS_PER_KG = 1000

export function getEmissionFactor(transport, carModel = null) {
  if (transport === "car") {
    if (!carModel) throw new Error("carModel is required when transport is car")
    const row = CAR_MODELS.find((c) => c.model === carModel)
    if (!row) throw new Error(`Unknown car model: "${carModel}"`)
    return { gPerKm: row.gCo2PerKm, label: row.model, kind: "carModel" }
  }

  if (!(transport in TRANSPORT_G_PER_KM)) {
    throw new Error(`Unknown transport mode: "${transport}"`)
  }

  const g = TRANSPORT_G_PER_KM[transport]
  return { gPerKm: g, label: transport, kind: "mode" }
}

export function calculateEmissions({ transport, carModel, distanceKm, frequency }) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new Error("distanceKm must be a positive finite number")
  }
  if (!Number.isFinite(frequency) || frequency <= 0 || !Number.isInteger(frequency)) {
    throw new Error("frequency must be a positive integer")
  }

  const { gPerKm, label, kind } = getEmissionFactor(transport, carModel)
  const gramsPerTrip = distanceKm * gPerKm
  const totalGrams = gramsPerTrip * frequency
  const totalKg = totalGrams / GRAMS_PER_KG

  return { gPerKm, label, kind, gramsPerTrip, totalGrams, totalKg }
}
