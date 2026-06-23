import { useMemo } from "react"
import { calculateEmissions } from "../lib/emissions"

function isValidInput(distanceKm, freq) {
  return (
    Number.isFinite(distanceKm) && distanceKm > 0 &&
    Number.isFinite(freq) && Number.isInteger(freq) && freq > 0
  )
}

export function useEmissionResult({ transport, carModel, distance, frequency }) {
  const parsed = useMemo(() => ({
    distanceKm: Number.parseFloat(distance),
    freq: Number.parseInt(frequency, 10),
  }), [distance, frequency])

  return useMemo(() => {
    const { distanceKm, freq } = parsed

    if (!isValidInput(distanceKm, freq)) return null

    const result = calculateEmissions({
      transport,
      carModel: transport === "car" ? carModel : null,
      distanceKm,
      frequency: freq,
    })

    return {
      ...result,
      factorLabel: result.kind === "carModel" ? result.label : transport,
    }
  }, [transport, carModel, parsed])
}
