import { describe, it, expect } from "vitest"
import { TRANSPORT_OPTIONS, TRANSPORT_G_PER_KM, CAR_MODELS } from "./data.js"


describe("TRANSPORT_OPTIONS", () => {
  it("contains exactly 8 transport options", () => {
    expect(TRANSPORT_OPTIONS).toHaveLength(8)
  })

  it("is not empty", () => {
    expect(TRANSPORT_OPTIONS.length).toBeGreaterThan(0)
  })

  const expected = [
    { value: "foot",  label: "Foot"  },
    { value: "bike",  label: "Bike"  },
    { value: "car",   label: "Car"   },
    { value: "bus",   label: "Bus"   },
    { value: "train", label: "Train" },
    { value: "tram",  label: "Tram"  },
    { value: "metro", label: "Metro" },
    { value: "ferry", label: "Ferry" },
  ]

  it.each(expected)(
    "entry $value has label '$label'",
    ({ value, label }) => {
      const entry = TRANSPORT_OPTIONS.find((o) => o.value === value)
      expect(entry, `Missing option for value="${value}"`).toBeDefined()
      expect(entry.label).toBe(label)
    },
  )

  it("entries appear in the expected order", () => {
    const values = TRANSPORT_OPTIONS.map((o) => o.value)
    expect(values).toEqual(["foot", "bike", "car", "bus", "train", "tram", "metro", "ferry"])
  })

  it("every entry has a non-empty value string", () => {
    for (const option of TRANSPORT_OPTIONS) {
      expect(option.value).toBeTruthy()
    }
  })

  it("every entry has a non-empty label string", () => {
    for (const option of TRANSPORT_OPTIONS) {
      expect(option.label).toBeTruthy()
      expect(option.label.length).toBeGreaterThan(0)
    }
  })
})

describe("TRANSPORT_G_PER_KM", () => {
  const expected = {
    foot:  0,
    bike:  0,
    bus:   105,
    train: 60,
    tram:  45,
    metro: 50,
    ferry: 120,
  }

  it.each(Object.entries(expected))(
    "%s emits %i g/km",
    (mode, g) => {
      expect(TRANSPORT_G_PER_KM[mode]).toBe(g)
    },
  )

  it("contains exactly 7 non-car modes", () => {
    expect(Object.keys(TRANSPORT_G_PER_KM)).toHaveLength(7)
  })

  it("does not include 'car' (car uses WLTP model data instead)", () => {
    expect("car" in TRANSPORT_G_PER_KM).toBe(false)
  })
})

describe("CAR_MODELS", () => {
  it("contains at least 10 models (task requirement)", () => {
    expect(CAR_MODELS.length).toBeGreaterThanOrEqual(10)
  })

  it("contains exactly 12 models", () => {
    expect(CAR_MODELS).toHaveLength(12)
  })

  const expectedModels = [
    { model: "Volkswagen Golf",  gCo2PerKm: 180 },
    { model: "Ford Focus",       gCo2PerKm: 175 },
    { model: "Honda Civic",      gCo2PerKm: 170 },
    { model: "Hyundai i30",      gCo2PerKm: 172 },
    { model: "Kia Ceed",         gCo2PerKm: 168 },
    { model: "Renault Megane",   gCo2PerKm: 160 },
    { model: "Peugeot 308",      gCo2PerKm: 158 },
    { model: "Skoda Octavia",    gCo2PerKm: 182 },
    { model: "Opel Astra",       gCo2PerKm: 169 },
    { model: "BMW 320i",         gCo2PerKm: 210 },
    { model: "Mercedes C 220",   gCo2PerKm: 205 },
    { model: "Tesla Model 3",    gCo2PerKm: 0   },
  ]

  it.each(expectedModels)(
    "$model emits $gCo2PerKm g/km",
    ({ model, gCo2PerKm }) => {
      const entry = CAR_MODELS.find((c) => c.model === model)
      expect(entry, `Missing car model: ${model}`).toBeDefined()
      expect(entry.gCo2PerKm).toBe(gCo2PerKm)
    },
  )

  it("all model names are non-empty strings", () => {
    for (const car of CAR_MODELS) {
      expect(typeof car.model).toBe("string")
      expect(car.model.length).toBeGreaterThan(0)
    }
  })

  it("all gCo2PerKm values are non-negative numbers", () => {
    for (const car of CAR_MODELS) {
      expect(typeof car.gCo2PerKm).toBe("number")
      expect(car.gCo2PerKm).toBeGreaterThanOrEqual(0)
    }
  })

  it("model names are unique", () => {
    const names = CAR_MODELS.map((c) => c.model)
    expect(new Set(names).size).toBe(names.length)
  })
})
