#!/usr/bin/env node
/**
 * Code Metrics Generator
 * Measures: cyclomatic complexity, maintainability index,
 *           lines of code, logical LOC, function length, parameters
 *
 * Outputs:
 *   - reports/metrics/metrics.json  (machine-readable)
 *   - reports/metrics/metrics.html  (human-readable dashboard)
 *   - Console summary table
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, relative } from "path"
import { parse } from "@babel/parser"

// ─── Files to analyse (source only, not tests or generated) ──────────────────
const ROOT = process.cwd()
const SOURCE_FILES = [
  "src/lib/emissions.js",
  "src/hooks/useEmissionResult.js",
  "src/data/data.js",
  "src/App.jsx",
  "src/cli/index.js",
  "src/main.jsx",
]

// ─── Babel parser options ─────────────────────────────────────────────────────
const PARSE_OPTS = {
  sourceType: "module",
  plugins: ["jsx"],
  errorRecovery: true,
}

// ─── AST traversal ────────────────────────────────────────────────────────────
function traverse(node, visitors) {
  if (!node || typeof node !== "object") return
  const visit = visitors[node.type]
  if (visit) visit(node)
  for (const key of Object.keys(node)) {
    const child = node[key]
    if (Array.isArray(child)) {
      for (const item of child) traverse(item, visitors)
    } else if (child && typeof child === "object" && child.type) {
      traverse(child, visitors)
    }
  }
}

// ─── Cyclomatic complexity for a function node ────────────────────────────────
// Base = 1, +1 for each branch point
const BRANCH_TYPES = new Set([
  "IfStatement", "ConditionalExpression",
  "LogicalExpression",           // && and || each add a path
  "SwitchCase",                  // each non-default case
  "ForStatement", "ForInStatement", "ForOfStatement",
  "WhileStatement", "DoWhileStatement",
  "CatchClause",
  "AssignmentPattern",           // default param
])

function cyclomaticComplexity(funcNode) {
  let cc = 1
  traverse(funcNode.body ?? funcNode, {
    IfStatement: () => { cc++ },
    ConditionalExpression: () => { cc++ },
    LogicalExpression: (n) => { if (n.operator === "&&" || n.operator === "||" || n.operator === "??") cc++ },
    SwitchCase: (n) => { if (n.test !== null) cc++ },   // default case has test===null
    ForStatement: () => { cc++ },
    ForInStatement: () => { cc++ },
    ForOfStatement: () => { cc++ },
    WhileStatement: () => { cc++ },
    DoWhileStatement: () => { cc++ },
    CatchClause: () => { cc++ },
    AssignmentPattern: () => { cc++ },
  })
  return cc
}

// ─── Halstead metrics (needed for Maintainability Index) ─────────────────────
function halstead(ast) {
  const operators = new Map()
  const operands = new Map()

  const addOp = (sym) => operators.set(sym, (operators.get(sym) ?? 0) + 1)
  const addOpd = (sym) => operands.set(sym, (operands.get(sym) ?? 0) + 1)

  traverse(ast, {
    BinaryExpression: (n) => addOp(n.operator),
    LogicalExpression: (n) => addOp(n.operator),
    UnaryExpression: (n) => addOp(n.operator),
    AssignmentExpression: (n) => addOp(n.operator),
    UpdateExpression: (n) => addOp(n.operator),
    MemberExpression: () => addOp("."),
    CallExpression: () => addOp("()"),
    NewExpression: () => addOp("new"),
    ReturnStatement: () => addOp("return"),
    IfStatement: () => addOp("if"),
    WhileStatement: () => addOp("while"),
    ForStatement: () => addOp("for"),
    ForOfStatement: () => addOp("for..of"),
    ForInStatement: () => addOp("for..in"),
    SwitchStatement: () => addOp("switch"),
    ThrowStatement: () => addOp("throw"),
    ConditionalExpression: () => addOp("?:"),
    Identifier: (n) => addOpd(n.name),
    StringLiteral: (n) => addOpd(`"${n.value}"`),
    NumericLiteral: (n) => addOpd(String(n.value)),
    BooleanLiteral: (n) => addOpd(String(n.value)),
    NullLiteral: () => addOpd("null"),
    TemplateLiteral: () => addOp("`"),
  })

  const n1 = operators.size          // distinct operators
  const n2 = operands.size           // distinct operands
  const N1 = [...operators.values()].reduce((a, b) => a + b, 0)  // total operators
  const N2 = [...operands.values()].reduce((a, b) => a + b, 0)   // total operands

  const vocabulary = n1 + n2
  const length = N1 + N2
  const volume = vocabulary > 0 ? length * Math.log2(vocabulary) : 0
  const difficulty = n2 > 0 ? (n1 / 2) * (N2 / n2) : 0
  const effort = difficulty * volume

  return { volume, effort, n1, n2, N1, N2 }
}

// ─── Maintainability Index ────────────────────────────────────────────────────
// Formula: 171 - 5.2*ln(HV) - 0.23*CC - 16.2*ln(LOC), clamped 0-100
function maintainabilityIndex(halsteadVolume, avgCC, logicalLoc) {
  const hv = Math.max(halsteadVolume, 1)
  const loc = Math.max(logicalLoc, 1)
  const raw = 171 - 5.2 * Math.log(hv) - 0.23 * avgCC - 16.2 * Math.log(loc)
  return Math.max(0, Math.min(100, (raw / 171) * 100))
}

// ─── Count logical statements (rough heuristic) ──────────────────────────────
const STATEMENT_TYPES = new Set([
  "ExpressionStatement", "ReturnStatement", "VariableDeclaration",
  "IfStatement", "ForStatement", "ForOfStatement", "ForInStatement",
  "WhileStatement", "DoWhileStatement", "SwitchStatement",
  "ThrowStatement", "TryStatement", "BreakStatement", "ContinueStatement",
  "ImportDeclaration", "ExportNamedDeclaration", "ExportDefaultDeclaration",
])

function logicalLoc(ast) {
  let count = 0
  traverse(ast, Object.fromEntries(
    [...STATEMENT_TYPES].map((t) => [t, () => { count++ }]),
  ))
  return count
}

// ─── Collect function metrics ─────────────────────────────────────────────────
function collectFunctions(ast, lines) {
  const fns = []

  const register = (node, name) => {
    const start = node.loc?.start.line ?? 0
    const end = node.loc?.end.line ?? 0
    const length = end - start + 1
    const cc = cyclomaticComplexity(node)
    const params = node.params?.length ?? 0
    fns.push({ name, startLine: start, endLine: end, lineLength: length, cc, params })
  }

  traverse(ast, {
    FunctionDeclaration: (n) => register(n, n.id?.name ?? "<anonymous>"),
    FunctionExpression: (n) => {
      // Try to get name from parent context via variable declarator or property
      const name = n.id?.name ?? "<anonymous>"
      register(n, name)
    },
    ArrowFunctionExpression: (n) => {
      register(n, "<arrow>")
    },
  })

  // Resolve arrow/function-expression names from variable declarators and object properties
  traverse(ast, {
    VariableDeclarator: (n) => {
      if (!n.id?.name) return
      const init = n.init
      if (!init) return
      // Direct assignment: const foo = () => {}
      if (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") {
        const fn = fns.find((f) => f.startLine === init.loc?.start.line && f.name === "<arrow>")
        if (fn) fn.name = n.id.name
        return
      }
      // Hook call: const result = useMemo(() => {}, [...])
      const hookNames = new Set(["useMemo", "useCallback", "useEffect"])
      if (init.type === "CallExpression" && hookNames.has(init.callee?.name)) {
        const cb = init.arguments?.[0]
        if (cb?.type === "ArrowFunctionExpression") {
          const fn = fns.find((f) => f.startLine === cb.loc?.start.line && f.name === "<arrow>")
          if (fn) fn.name = `${n.id.name} [${init.callee.name}]`
        }
      }
    },
    // return useMemo(() => { ... }) — name it after the enclosing function
    ReturnStatement: (n) => {
      const hookNames = new Set(["useMemo", "useCallback"])
      const expr = n.argument
      if (!expr || expr.type !== "CallExpression") return
      if (!hookNames.has(expr.callee?.name)) return
      const cb = expr.arguments?.[0]
      if (cb?.type === "ArrowFunctionExpression") {
        const fn = fns.find((f) => f.startLine === cb.loc?.start.line && f.name === "<arrow>")
        if (fn) fn.name = `return [${expr.callee.name}]`
      }
    },
    Property: (n) => {
      if (!n.key?.name) return
      const val = n.value
      if (val?.type === "ArrowFunctionExpression" || val?.type === "FunctionExpression") {
        const fn = fns.find(
          (f) => f.startLine === val.loc?.start.line && (f.name === "<arrow>" || f.name === "<anonymous>"),
        )
        if (fn) fn.name = n.key.name
      }
    },
  })

  // Drop tiny inline one-liner callbacks like .map(x => x.value) — length <= 1
  return fns.filter((f) => f.name !== "<arrow>" || f.lineLength > 1)
}

// ─── Analyse a single file ────────────────────────────────────────────────────
function analyseFile(filePath) {
  const source = readFileSync(filePath, "utf8")
  const lines = source.split("\n")
  const physicalLoc = lines.length
  const blankLines = lines.filter((l) => l.trim() === "").length
  const commentLines = lines.filter((l) => l.trim().startsWith("//") || l.trim().startsWith("*") || l.trim().startsWith("/*")).length
  const sourceLoc = physicalLoc - blankLines - commentLines

  let ast
  try {
    ast = parse(source, PARSE_OPTS)
  } catch (e) {
    return { error: e.message, file: filePath }
  }

  const logLoc = logicalLoc(ast)
  const hs = halstead(ast)
  const functions = collectFunctions(ast, lines)

  const avgCC = functions.length > 0
    ? functions.reduce((s, f) => s + f.cc, 0) / functions.length
    : 1

  const mi = maintainabilityIndex(hs.volume, avgCC, Math.max(logLoc, 1))

  // Thresholds
  const complexFunctions = functions.filter((f) => f.cc > 5)
  const longFunctions = functions.filter((f) => f.lineLength > 30)

  return {
    file: relative(ROOT, filePath),
    physicalLoc,
    sourceLoc,
    logicalLoc: logLoc,
    blankLines,
    commentLines,
    functionCount: functions.length,
    avgCC: Math.round(avgCC * 10) / 10,
    maxCC: functions.reduce((m, f) => Math.max(m, f.cc), 0),
    maintainabilityIndex: Math.round(mi * 10) / 10,
    halstead: {
      volume: Math.round(hs.volume),
      effort: Math.round(hs.effort),
      distinctOperators: hs.n1,
      distinctOperands: hs.n2,
    },
    functions: functions.map((f) => ({
      ...f,
      ccRating: f.cc <= 5 ? "low" : f.cc <= 10 ? "medium" : "high",
      lengthRating: f.lineLength <= 20 ? "short" : f.lineLength <= 40 ? "medium" : "long",
    })),
    warnings: [
      ...complexFunctions.map((f) => `⚠ ${f.name}() — cyclomatic complexity ${f.cc} (threshold: 5)`),
      ...longFunctions.map((f) => `⚠ ${f.name}() — ${f.lineLength} lines (threshold: 30)`),
    ],
  }
}

// ─── MI rating helper ─────────────────────────────────────────────────────────
function miRating(mi) {
  if (mi >= 85) return { label: "High", color: "#22c55e" }
  if (mi >= 65) return { label: "Moderate", color: "#f59e0b" }
  return { label: "Low", color: "#ef4444" }
}

function ccRatingColor(cc) {
  if (cc <= 5) return "#22c55e"
  if (cc <= 10) return "#f59e0b"
  return "#ef4444"
}

// ─── HTML report ─────────────────────────────────────────────────────────────
function buildHtml(results, generatedAt) {
  const totalPhysLoc = results.reduce((s, r) => s + (r.physicalLoc ?? 0), 0)
  const totalFunctions = results.reduce((s, r) => s + (r.functionCount ?? 0), 0)
  const allWarnings = results.flatMap((r) => r.warnings ?? [])
  const avgMI = results.length > 0
    ? Math.round(results.reduce((s, r) => s + (r.maintainabilityIndex ?? 0), 0) / results.length * 10) / 10
    : 0

  const fileRows = results.map((r) => {
    if (r.error) {
      return `<tr><td>${r.file}</td><td colspan="6" style="color:#ef4444">Parse error: ${r.error}</td></tr>`
    }
    const mi = miRating(r.maintainabilityIndex)
    return `
      <tr>
        <td><a href="#file-${r.file.replaceAll(/[./\\]/g, "-")}">${r.file}</a></td>
        <td>${r.physicalLoc}</td>
        <td>${r.sourceLoc}</td>
        <td>${r.logicalLoc}</td>
        <td>${r.functionCount}</td>
        <td style="color:${ccRatingColor(r.avgCC)}">${r.avgCC} / max ${r.maxCC}</td>
        <td style="color:${mi.color}">${r.maintainabilityIndex} <span style="font-size:11px">(${mi.label})</span></td>
      </tr>`
  }).join("")

  const fileDetails = results.filter((r) => !r.error).map((r) => {
    const anchorId = `file-${r.file.replaceAll(/[./\\]/g, "-")}`
    const fnRows = r.functions.map((f) => `
      <tr>
        <td>${f.name}()</td>
        <td>L${f.startLine}–${f.endLine}</td>
        <td>${f.lineLength}</td>
        <td>${f.params}</td>
        <td style="color:${ccRatingColor(f.cc)}">${f.cc}</td>
        <td style="color:${ccRatingColor(f.cc)}">${f.ccRating}</td>
      </tr>`).join("")

    const warnings = r.warnings.length > 0
      ? `<div class="warnings">${r.warnings.map((w) => `<div class="warn">${w}</div>`).join("")}</div>`
      : `<div class="ok">✓ No issues detected</div>`

    return `
      <section id="${anchorId}" class="file-section">
        <h2>${r.file}</h2>
        <div class="file-meta">
          <span>📄 ${r.physicalLoc} physical lines</span>
          <span>📝 ${r.sourceLoc} source lines</span>
          <span>🔢 ${r.logicalLoc} logical statements</span>
          <span>🔧 ${r.functionCount} functions</span>
          <span>🌀 Avg CC: ${r.avgCC}</span>
          <span>🏆 MI: ${r.maintainabilityIndex}</span>
        </div>
        ${warnings}
        ${r.functions.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Function</th><th>Lines</th><th>Length</th>
              <th>Params</th><th>Cyclomatic CC</th><th>Rating</th>
            </tr>
          </thead>
          <tbody>${fnRows}</tbody>
        </table>` : "<p><em>No named functions detected.</em></p>"}
      </section>`
  }).join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Metrics — co2-emission</title>
  <style>
    :root {
      --bg: #0f1419; --surface: #1a2332; --text: #e8eef5;
      --muted: #9fb0c3; --accent: #3d9cf5; --border: #2d3d52;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text);
           font-family: "Segoe UI", system-ui, sans-serif;
           line-height: 1.6; padding: 32px; }
    h1 { font-size: 24px; color: var(--accent); margin-bottom: 4px; }
    h2 { font-size: 16px; color: var(--accent); margin: 24px 0 10px; }
    .subtitle { color: var(--muted); font-size: 13px; margin-bottom: 28px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 12px; margin-bottom: 32px; }
    .card { background: var(--surface); border: 1px solid var(--border);
            border-radius: 10px; padding: 16px 20px; }
    .card .val { font-size: 28px; font-weight: 600; color: var(--accent); }
    .card .lbl { font-size: 12px; color: var(--muted); text-transform: uppercase;
                 letter-spacing: 1px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px;
            background: var(--surface); border-radius: 8px; overflow: hidden; }
    th { background: #243044; color: var(--muted); font-size: 12px;
         text-transform: uppercase; letter-spacing: 1px; padding: 10px 14px; text-align: left; }
    td { padding: 9px 14px; font-size: 13px; border-top: 1px solid var(--border); }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .file-section { margin-bottom: 36px; padding: 20px 24px;
                    background: var(--surface); border: 1px solid var(--border);
                    border-radius: 10px; }
    .file-meta { display: flex; flex-wrap: wrap; gap: 14px;
                 font-size: 13px; color: var(--muted); margin: 10px 0 16px; }
    .warnings { margin-bottom: 12px; }
    .warn { background: #2a1f0e; border-left: 3px solid #f59e0b;
            padding: 6px 12px; margin: 4px 0; font-size: 13px; border-radius: 4px; }
    .ok { background: #0e2a1a; border-left: 3px solid #22c55e;
          padding: 6px 12px; margin-bottom: 12px; font-size: 13px; border-radius: 4px; }
    .legend { display: flex; gap: 20px; font-size: 12px; color: var(--muted);
              margin: 16px 0 8px; flex-wrap: wrap; }
    .dot { display: inline-block; width: 10px; height: 10px;
           border-radius: 50%; margin-right: 5px; vertical-align: middle; }
    .warn-box { background: #1a1a0e; border: 1px solid #f59e0b; border-radius: 10px;
                padding: 16px 20px; margin-bottom: 28px; }
    .warn-box h2 { color: #f59e0b; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>📊 Code Metrics Report</h1>
  <p class="subtitle">Project: co2-emission &nbsp;|&nbsp; Generated: ${generatedAt}</p>

  <div class="summary-grid">
    <div class="card"><div class="val">${totalPhysLoc}</div><div class="lbl">Total Lines</div></div>
    <div class="card"><div class="val">${results.length}</div><div class="lbl">Files Analysed</div></div>
    <div class="card"><div class="val">${totalFunctions}</div><div class="lbl">Functions</div></div>
    <div class="card"><div class="val" style="color:${miRating(avgMI).color}">${avgMI}</div><div class="lbl">Avg Maintainability</div></div>
    <div class="card"><div class="val" style="color:${allWarnings.length > 0 ? "#f59e0b" : "#22c55e"}">${allWarnings.length}</div><div class="lbl">Warnings</div></div>
  </div>

  ${allWarnings.length > 0 ? `
  <div class="warn-box">
    <h2>⚠ Functions Needing Attention</h2>
    ${allWarnings.map((w) => `<div class="warn">${w}</div>`).join("")}
  </div>` : `<div class="ok">✓ All functions within complexity and length thresholds</div>`}

  <h2>File Summary</h2>
  <div class="legend">
    <span><span class="dot" style="background:#22c55e"></span>CC ≤ 5 — Low</span>
    <span><span class="dot" style="background:#f59e0b"></span>CC 6–10 — Medium</span>
    <span><span class="dot" style="background:#ef4444"></span>CC &gt; 10 — High</span>
    <span>MI ≥ 85 = High | 65–84 = Moderate | &lt; 65 = Low</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>File</th><th>Phys LOC</th><th>Source LOC</th><th>Logical LOC</th>
        <th>Functions</th><th>Cyclomatic CC</th><th>Maintainability</th>
      </tr>
    </thead>
    <tbody>${fileRows}</tbody>
  </table>

  <h2 style="margin-top:32px">Function Details</h2>
  ${fileDetails}
</body>
</html>`
}

// ─── Console summary ──────────────────────────────────────────────────────────
function printConsole(results) {
  const RESET = "\x1b[0m"
  const BOLD = "\x1b[1m"
  const CYAN = "\x1b[36m"
  const GREEN = "\x1b[32m"
  const YELLOW = "\x1b[33m"
  const RED = "\x1b[31m"
  const MUTED = "\x1b[90m"

  const color = (val, low, mid) =>
    val <= low ? GREEN : val <= mid ? YELLOW : RED

  console.log()
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}`)
  console.log(`${BOLD}${CYAN}║              Code Metrics Report — co2-emission              ║${RESET}`)
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}`)
  console.log()

  const col = (s, w) => String(s).padEnd(w)

  console.log(
    BOLD +
    col("File", 32) + col("LOC", 6) + col("Fns", 5) +
    col("AvgCC", 8) + col("MaxCC", 8) + col("MI", 8) +
    RESET,
  )
  console.log(MUTED + "─".repeat(70) + RESET)

  for (const r of results) {
    if (r.error) {
      console.log(`${RED}${r.file} — parse error${RESET}`)
      continue
    }
    const miCol = r.maintainabilityIndex >= 85 ? GREEN : r.maintainabilityIndex >= 65 ? YELLOW : RED
    console.log(
      col(r.file, 32) +
      col(r.physicalLoc, 6) +
      col(r.functionCount, 5) +
      `${color(r.avgCC, 5, 10)}${col(r.avgCC, 8)}${RESET}` +
      `${color(r.maxCC, 5, 10)}${col(r.maxCC, 8)}${RESET}` +
      `${miCol}${col(r.maintainabilityIndex, 8)}${RESET}`,
    )
  }

  console.log(MUTED + "─".repeat(70) + RESET)

  const allWarnings = results.flatMap((r) => r.warnings ?? [])
  if (allWarnings.length > 0) {
    console.log()
    console.log(`${BOLD}${YELLOW}Warnings:${RESET}`)
    for (const w of allWarnings) console.log(`  ${YELLOW}${w}${RESET}`)
  } else {
    console.log(`\n  ${GREEN}✓ All functions within thresholds${RESET}`)
  }

  console.log()
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const generatedAt = new Date().toLocaleString("en-GB", {
  dateStyle: "medium", timeStyle: "short",
})

const results = SOURCE_FILES.map((f) => analyseFile(join(ROOT, f)))

// Console output
printConsole(results)

// JSON report
const outDir = join(ROOT, "reports", "metrics")
mkdirSync(outDir, { recursive: true })

writeFileSync(
  join(outDir, "metrics.json"),
  JSON.stringify({ generatedAt, files: results }, null, 2),
)

// HTML report
writeFileSync(join(outDir, "metrics.html"), buildHtml(results, generatedAt))

console.log(`  Reports written to reports/metrics/\n`)
