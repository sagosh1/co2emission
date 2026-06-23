import { describe, it, expect } from "vitest"
import { getEmissionFactor, calculateEmissions, GRAMS_PER_KG } from "./emissions.js"
import { CAR_MODELS, TRANSPORT_OPTIONS, TRANSPORT_G_PER_KM } from "../data/data.js"

describe("getEmissionFactor", () => {
  describe("non-car transport modes", () => {
    it("returns 0 g/km for foot", () => {
      const result = getEmissionFactor("foot")
      expect(result.gPerKm).toBe(0)
      expect(result.kind).toBe("mode")
      expect(result.label).toBe("foot")
    })

    it("returns 0 g/km for bike", () => {
      const result = getEmissionFactor("bike")
      expect(result.gPerKm).toBe(0)
      expect(result.kind).toBe("mode")
    })

    it("returns 105 g/km for bus", () => {
      const result = getEmissionFactor("bus")
      expect(result.gPerKm).toBe(TRANSPORT_G_PER_KM.bus)
    })

    it("returns 60 g/km for train", () => {
      const result = getEmissionFactor("train")
      expect(result.gPerKm).toBe(TRANSPORT_G_PER_KM.train)
    })

    it("returns 45 g/km for tram", () => {
      const result = getEmissionFactor("tram")
      expect(result.gPerKm).toBe(TRANSPORT_G_PER_KM.tram)
    })

    it("returns 50 g/km for metro", () => {
      const result = getEmissionFactor("metro")
      expect(result.gPerKm).toBe(TRANSPORT_G_PER_KM.metro)
    })

    it("returns 120 g/km for ferry", () => {
      const result = getEmissionFactor("ferry")
      expect(result.gPerKm).toBe(TRANSPORT_G_PER_KM.ferry)
    })

    it("matches every mode value from TRANSPORT_G_PER_KM", () => {
      for (const [mode, expected] of Object.entries(TRANSPORT_G_PER_KM)) {
        const result = getEmissionFactor(mode)
        expect(result.gPerKm).toBe(expected)
      }
    })
  })

  describe("car transport — all WLTP models", () => {
    it("has at least 10 car models in the dataset", () => {
      expect(CAR_MODELS.length).toBeGreaterThanOrEqual(10)
    })

    it.each(CAR_MODELS)(
      "returns correct gPerKm for $model",
      ({ model, gCo2PerKm }) => {
        const result = getEmissionFactor("car", model)
        expect(result.gPerKm).toBe(gCo2PerKm)
        expect(result.kind).toBe("carModel")
        expect(result.label).toBe(model)
      },
    )

    it("Tesla Model 3 has 0 g/km (electric)", () => {
      const result = getEmissionFactor("car", "Tesla Model 3")
      expect(result.gPerKm).toBe(0)
    })

    it("BMW 320i has higher emissions than VW Golf", () => {
      const bmw = getEmissionFactor("car", "BMW 320i")
      const golf = getEmissionFactor("car", "Volkswagen Golf")
      expect(bmw.gPerKm).toBeGreaterThan(golf.gPerKm)
    })
  })

  describe("invalid inputs", () => {
    it("throws on unknown transport mode", () => {
      expect(() => getEmissionFactor("airplane")).toThrow('Unknown transport mode: "airplane"')
    })

    it("throws on empty string transport", () => {
      expect(() => getEmissionFactor("")).toThrow()
    })

    it("throws when transport is car but no carModel given", () => {
      expect(() => getEmissionFactor("car")).toThrow("carModel is required")
    })

    it("throws when transport is car but carModel is null", () => {
      expect(() => getEmissionFactor("car", null)).toThrow("carModel is required")
    })

    it("throws when carModel name does not exist", () => {
      expect(() => getEmissionFactor("car", "Ferrari Enzo")).toThrow('Unknown car model: "Ferrari Enzo"')
    })

    it("throws on undefined transport", () => {
      expect(() => getEmissionFactor(undefined)).toThrow()
    })
  })
})

describe("calculateEmissions", () => {
  describe("distance × g/km multiplication", () => {
    it("calculates gramsPerTrip correctly for bus", () => {
      const result = calculateEmissions({ transport: "bus", distanceKm: 10, frequency: 1 })
      expect(result.gramsPerTrip).toBe(1050)
    })

    it("calculates gramsPerTrip correctly for train", () => {
      const result = calculateEmissions({ transport: "train", distanceKm: 25, frequency: 1 })
      expect(result.gramsPerTrip).toBe(1500)
    })

    it("gramsPerTrip is 0 for foot regardless of distance", () => {
      const result = calculateEmissions({ transport: "foot", distanceKm: 100, frequency: 1 })
      expect(result.gramsPerTrip).toBe(0)
    })

    it("gramsPerTrip is 0 for bike regardless of distance", () => {
      const result = calculateEmissions({ transport: "bike", distanceKm: 50, frequency: 1 })
      expect(result.gramsPerTrip).toBe(0)
    })

    it("calculates gramsPerTrip for VW Golf correctly", () => {
      const result = calculateEmissions({ transport: "car", carModel: "Volkswagen Golf", distanceKm: 20, frequency: 1 })
      expect(result.gramsPerTrip).toBe(3600)
    })
  })

  describe("total emissions (gramsPerTrip × frequency)", () => {
    it("multiplies correctly for multiple trips — bus", () => {
      const result = calculateEmissions({ transport: "bus", distanceKm: 10, frequency: 4 })
      expect(result.totalGrams).toBe(4200)
      expect(result.totalKg).toBeCloseTo(4.2, 5)
    })

    it("multiplies correctly for multiple trips — train", () => {
      const result = calculateEmissions({ transport: "train", distanceKm: 50, frequency: 10 })
      expect(result.totalGrams).toBe(30000)
      expect(result.totalKg).toBe(30)
    })

    it("1 trip gives totalGrams equal to gramsPerTrip", () => {
      const result = calculateEmissions({ transport: "metro", distanceKm: 8, frequency: 1 })
      expect(result.totalGrams).toBe(result.gramsPerTrip)
    })

    it(`totalKg is always totalGrams / GRAMS_PER_KG (${GRAMS_PER_KG})`, () => {
      const result = calculateEmissions({ transport: "ferry", distanceKm: 30, frequency: 3 })
      expect(result.totalKg).toBe(result.totalGrams / GRAMS_PER_KG)
    })

    it("handles large values without overflow", () => {
      const result = calculateEmissions({ transport: "ferry", distanceKm: 10000, frequency: 365 })
      expect(result.totalGrams).toBe(438_000_000)
      expect(result.totalKg).toBe(438_000)
    })

    it("handles fractional distances correctly", () => {
      const result = calculateEmissions({ transport: "bus", distanceKm: 0.5, frequency: 2 })
      expect(result.totalGrams).toBeCloseTo(105, 5)
    })
  })

  describe("car model calculations", () => {
    it("Tesla Model 3 produces 0 total emissions for any trip", () => {
      const result = calculateEmissions({ transport: "car", carModel: "Tesla Model 3", distanceKm: 100, frequency: 10 })
      expect(result.totalGrams).toBe(0)
      expect(result.totalKg).toBe(0)
    })

    it("Mercedes C 220 has correct total for a semester scenario", () => {
      const result = calculateEmissions({ transport: "car", carModel: "Mercedes C 220", distanceKm: 15, frequency: 60 })
      expect(result.totalGrams).toBe(184_500)
      expect(result.totalKg).toBe(184.5)
    })
  })

  describe("emission factor passthrough", () => {
    it("returns gPerKm matching the data source for every non-car mode", () => {
      for (const [mode, g] of Object.entries(TRANSPORT_G_PER_KM)) {
        const result = calculateEmissions({ transport: mode, distanceKm: 1, frequency: 1 })
        expect(result.gPerKm).toBe(g)
      }
    })

    it("returns kind='mode' for non-car transport", () => {
      const result = calculateEmissions({ transport: "train", distanceKm: 10, frequency: 1 })
      expect(result.kind).toBe("mode")
    })

    it("returns kind='carModel' for car transport", () => {
      const result = calculateEmissions({ transport: "car", carModel: "Honda Civic", distanceKm: 10, frequency: 1 })
      expect(result.kind).toBe("carModel")
    })
  })

  describe("invalid inputs", () => {
    it("throws when distanceKm is 0", () => {
      expect(() => calculateEmissions({ transport: "bus", distanceKm: 0, frequency: 1 })).toThrow("distanceKm")
    })

    it("throws when distanceKm is negative", () => {
      expect(() => calculateEmissions({ transport: "bus", distanceKm: -5, frequency: 1 })).toThrow("distanceKm")
    })

    it("throws when distanceKm is NaN", () => {
      expect(() => calculateEmissions({ transport: "bus", distanceKm: NaN, frequency: 1 })).toThrow("distanceKm")
    })

    it("throws when distanceKm is Infinity", () => {
      expect(() => calculateEmissions({ transport: "bus", distanceKm: Infinity, frequency: 1 })).toThrow("distanceKm")
    })

    it("throws when frequency is 0", () => {
      expect(() => calculateEmissions({ transport: "bus", distanceKm: 10, frequency: 0 })).toThrow("frequency")
    })

    it("throws when frequency is negative", () => {
      expect(() => calculateEmissions({ transport: "bus", distanceKm: 10, frequency: -3 })).toThrow("frequency")
    })

    it("throws when frequency is a float", () => {
      expect(() => calculateEmissions({ transport: "bus", distanceKm: 10, frequency: 2.5 })).toThrow("frequency")
    })

    it("throws when frequency is NaN", () => {
      expect(() => calculateEmissions({ transport: "bus", distanceKm: 10, frequency: NaN })).toThrow("frequency")
    })

    it("throws on unknown transport mode", () => {
      expect(() => calculateEmissions({ transport: "helicopter", distanceKm: 10, frequency: 1 })).toThrow()
    })

    it("throws on car without carModel", () => {
      expect(() => calculateEmissions({ transport: "car", distanceKm: 10, frequency: 1 })).toThrow()
    })
  })
})

describe("data integrity", () => {
  it("all TRANSPORT_OPTIONS values are either in TRANSPORT_G_PER_KM or are 'car'", () => {
    for (const option of TRANSPORT_OPTIONS) {
      const valid = option.value === "car" || option.value in TRANSPORT_G_PER_KM
      expect(valid, `${option.value} has no emission factor`).toBe(true)
    }
  })

  it("all car models have non-negative gCo2PerKm", () => {
    for (const car of CAR_MODELS) {
      expect(car.gCo2PerKm, `${car.model} has negative gCo2PerKm`).toBeGreaterThanOrEqual(0)
    }
  })

  it("all non-car modes have non-negative g/km values", () => {
    for (const [mode, g] of Object.entries(TRANSPORT_G_PER_KM)) {
      expect(g, `${mode} has negative g/km`).toBeGreaterThanOrEqual(0)
    }
  })

  it("car models have unique names", () => {
    const names = CAR_MODELS.map((c) => c.model)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })
})
