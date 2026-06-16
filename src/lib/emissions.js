import { CAR_MODELS, TRANSPORT_G_PER_KM } from "../data/data.js"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Conversion factor: grams of CO₂ per kilogram */
export const GRAMS_PER_KG = 1000

/**
 * Returns the emission factor for a given transport mode.
 * For "car", a carModel name must be supplied.
 *
 * @param {string} transport  - one of the TRANSPORT_OPTIONS values
 * @param {string|null} carModel - required when transport === "car"
 * @returns {{ gPerKm: number, label: string, kind: "carModel"|"mode" }}
 * @throws {Error} if transport is unknown or carModel is not found
 */
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

/**
 * Calculates CO2 emissions for a set of trips.
 *
 * @param {object} params
 * @param {string}      params.transport  - transport mode
 * @param {string|null} params.carModel   - car model name (only for "car")
 * @param {number}      params.distanceKm - one-way distance in km (must be > 0)
 * @param {number}      params.frequency  - number of trips (must be > 0, integer)
 * @returns {{ gPerKm: number, label: string, kind: string,
 *             gramsPerTrip: number, totalGrams: number, totalKg: number }}
 * @throws {Error} on invalid inputs
 */
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
