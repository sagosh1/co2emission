/**
 * All emission values are in grams of CO₂ per kilometre (g CO₂/km).
 * Car values are WLTP-certified figures.
 * Public transport values are EU average fleet estimates.
 */

// ─── Public transport emission factors (g CO₂/km) ────────────────────────────

const G_FOOT  = 0    // zero direct emissions
const G_BIKE  = 0    // zero direct emissions
const G_BUS   = 105  // EU average diesel bus
const G_TRAIN = 60   // EU average electric/diesel mix
const G_TRAM  = 45   // EU average tram (electric)
const G_METRO = 50   // EU average metro (electric)
const G_FERRY = 120  // EU average passenger ferry

// ─── Exports ──────────────────────────────────────────────────────────────────

export const TRANSPORT_OPTIONS = [
  { value: "foot",  label: "Foot"  },
  { value: "bike",  label: "Bike"  },
  { value: "car",   label: "Car"   },
  { value: "bus",   label: "Bus"   },
  { value: "train", label: "Train" },
  { value: "tram",  label: "Tram"  },
  { value: "metro", label: "Metro" },
  { value: "ferry", label: "Ferry" },
]

export const TRANSPORT_G_PER_KM = {
  foot:  G_FOOT,
  bike:  G_BIKE,
  bus:   G_BUS,
  train: G_TRAIN,
  tram:  G_TRAM,
  metro: G_METRO,
  ferry: G_FERRY,
}

export const CAR_MODELS = [
  { model: "Volkswagen Golf", gCo2PerKm: 180 },
  { model: "Ford Focus",      gCo2PerKm: 175 },
  { model: "Honda Civic",     gCo2PerKm: 170 },
  { model: "Hyundai i30",     gCo2PerKm: 172 },
  { model: "Kia Ceed",        gCo2PerKm: 168 },
  { model: "Renault Megane",  gCo2PerKm: 160 },
  { model: "Peugeot 308",     gCo2PerKm: 158 },
  { model: "Skoda Octavia",   gCo2PerKm: 182 },
  { model: "Opel Astra",      gCo2PerKm: 169 },
  { model: "BMW 320i",        gCo2PerKm: 210 },
  { model: "Mercedes C 220",  gCo2PerKm: 205 },
  { model: "Tesla Model 3",   gCo2PerKm: 0   },
]
