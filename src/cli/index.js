import * as readline from "readline/promises"
import { stdin as input, stdout as output } from "process"
import { CAR_MODELS, TRANSPORT_OPTIONS } from "../data/data.js"
import { calculateEmissions } from "../lib/emissions.js"

const RESET  = "\x1b[0m"
const BOLD   = "\x1b[1m"
const BLUE   = "\x1b[34m"
const YELLOW = "\x1b[33m"
const GREEN  = "\x1b[32m"
const MUTED  = "\x1b[90m"
const RED    = "\x1b[31m"

const c = {
  bold:   (s) => `${BOLD}${s}${RESET}`,
  blue:   (s) => `${BLUE}${s}${RESET}`,
  yellow: (s) => `${YELLOW}${s}${RESET}`,
  green:  (s) => `${GREEN}${s}${RESET}`,
  muted:  (s) => `${MUTED}${s}${RESET}`,
  red:    (s) => `${RED}${s}${RESET}`,
}
const CAR_MODEL_COL_WIDTH = 22

function printIntro() {
  console.log()
  console.log(c.bold(c.blue("╔══════════════════════════════════════╗")))
  console.log(c.bold(c.blue("║   CO₂ Travel Calculator  (semester)  ║")))
  console.log(c.bold(c.blue("╚══════════════════════════════════════╝")))
  console.log(c.muted("  Studienleistung — Architecture of Information Systems — Sagosh Kumar"))
  console.log()
}

function printTransportMenu() {
  console.log(c.bold("Transport Options:"))
  TRANSPORT_OPTIONS.forEach((option, i) => {
    const idx = String(i + 1).padStart(2)
    console.log(`${c.blue(idx)}. ${option.label}`)
  })
  console.log()
}

function printCarMenu() {
  console.log(c.bold("Car Models (WLTP G CO₂/km):"))
  CAR_MODELS.forEach((car, i) => {
    const idx      = String(i + 1).padStart(2)
    const nameCol  = car.model.padEnd(CAR_MODEL_COL_WIDTH)
    const gLabel   = c.muted(`${car.gCo2PerKm} G/KM`)
    console.log(`${c.blue(idx)}. ${nameCol} ${gLabel}`)
  })
  console.log()
}

function printResult({ gPerKm, label, gramsPerTrip, totalGrams, totalKg }) {
  const gramsStr = `${totalGrams.toFixed(1)} g`
  const kgStr    = `${totalKg.toFixed(3)} kg`
  console.log()
  console.log(c.bold("  ┌─ Result ──────────────────────────────────┐"))
  console.log(`  │  Mode / model   : ${c.yellow(label)}`)
  console.log(`  │  g CO₂ / km     : ${c.yellow(gPerKm.toFixed(1))}`)
  console.log(`  │  g CO₂ per trip : ${c.yellow(gramsPerTrip.toFixed(1))}`)
  console.log(`  │  ${c.bold("Total CO₂        :")} ${c.green(gramsStr)}  (${c.green(kgStr)})`)
  console.log(c.bold("  └───────────────────────────────────────────┘"))
  console.log()
}

async function askNumber(rl, prompt, { min = 0, integer = false } = {}) {
  for (;;) {
    const raw = await rl.question(prompt)
    const val = integer ? Number.parseInt(raw, 10) : Number.parseFloat(raw)
    if (Number.isFinite(val) && val > min) return val
    console.log(c.red(`✖ Please enter a number greater than ${min}.`))
  }
}

async function askChoice(rl, prompt, max) {
  for (;;) {
    const raw = await rl.question(prompt)
    const n = Number.parseInt(raw, 10)
    if (Number.isFinite(n) && n >= 1 && n <= max) return n
    console.log(c.red(`✖ Enter a number between 1 and ${max}.`))
  }
}

async function promptOnce(rl) {
  printTransportMenu()
  const tChoice  = await askChoice(rl, c.bold(`Select transport [1-${TRANSPORT_OPTIONS.length}]: `), TRANSPORT_OPTIONS.length)
  const transport = TRANSPORT_OPTIONS[tChoice - 1].value

  let carModel = null
  if (transport === "car") {
    console.log()
    printCarMenu()
    const cChoice = await askChoice(rl, c.bold(`Select car model [1-${CAR_MODELS.length}]: `), CAR_MODELS.length)
    carModel = CAR_MODELS[cChoice - 1].model
  }

  console.log()
  const distanceKm = await askNumber(rl, c.bold("One-way distance (km): "), { min: 0 })
  const frequency  = await askNumber(rl, c.bold("Number of trips in the period: "), { min: 0, integer: true })

  return { transport, carModel, distanceKm, frequency }
}

async function main() {
  const rl = readline.createInterface({ input, output })
  printIntro()

  let running = true
  while (running) {
    const inputs = await promptOnce(rl)

    try {
      const result = calculateEmissions(inputs)
      printResult(result)
    } catch (err) {
      console.log(c.red(`Error: ${err.message}`))
    }

    const again = await rl.question(c.muted("  Calculate another trip? (y/n): "))
    running = again.trim().toLowerCase().startsWith("y")
    console.log()
  }

  console.log(c.muted("  Goodbye!\n"))
  rl.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
