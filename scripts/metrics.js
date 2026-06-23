import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, relative } from "path"
import { parse } from "@babel/parser"

const ROOT = process.cwd()

const SOURCE_FILES = [
  "src/lib/emissions.js",
  "src/hooks/useEmissionResult.js",
  "src/data/data.js",
  "src/App.jsx",
  "src/cli/index.js",
  "src/main.jsx",
]

const PARSE_OPTS = {
  sourceType: "module",
  plugins: ["jsx"],
  errorRecovery: true,
}

const HOOK_NAMES = new Set(["useMemo", "useCallback", "useEffect"])

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

function cyclomaticComplexity(funcNode) {
  let cc = 1
  traverse(funcNode.body ?? funcNode, {
    IfStatement: () => { cc++ },
    ConditionalExpression: () => { cc++ },
    LogicalExpression: (n) => {
      if (n.operator === "&&" || n.operator === "||" || n.operator === "??") cc++
    },
    SwitchCase: (n) => { if (n.test !== null) cc++ },
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

  const n1 = operators.size
  const n2 = operands.size
  const N1 = [...operators.values()].reduce((a, b) => a + b, 0)
  const N2 = [...operands.values()].reduce((a, b) => a + b, 0)
  const vocabulary = n1 + n2
  const length = N1 + N2
  const volume = vocabulary > 0 ? length * Math.log2(vocabulary) : 0
  const difficulty = n2 > 0 ? (n1 / 2) * (N2 / n2) : 0
  const effort = difficulty * volume

  return { volume, effort, n1, n2, N1, N2 }
}

function maintainabilityIndex(halsteadVolume, avgCC, loc) {
  const hv = Math.max(halsteadVolume, 1)
  const safeLoc = Math.max(loc, 1)
  const raw = 171 - 5.2 * Math.log(hv) - 0.23 * avgCC - 16.2 * Math.log(safeLoc)
  return Math.max(0, Math.min(100, (raw / 171) * 100))
}

const STATEMENT_TYPES = new Set([
  "ExpressionStatement", "ReturnStatement", "VariableDeclaration",
  "IfStatement", "ForStatement", "ForOfStatement", "ForInStatement",
  "WhileStatement", "DoWhileStatement", "SwitchStatement",
  "ThrowStatement", "TryStatement", "BreakStatement", "ContinueStatement",
  "ImportDeclaration", "ExportNamedDeclaration", "ExportDefaultDeclaration",
])

function countLogicalLoc(ast) {
  let count = 0
  traverse(ast, Object.fromEntries(
    [...STATEMENT_TYPES].map((t) => [t, () => { count++ }]),
  ))
  return count
}

function registerFn(fns, node, name) {
  const start = node.loc?.start.line ?? 0
  const end = node.loc?.end.line ?? 0
  fns.push({
    name,
    startLine: start,
    endLine: end,
    lineLength: end - start + 1,
    cc: cyclomaticComplexity(node),
    params: node.params?.length ?? 0,
  })
}

function resolveVariableDeclarator(fns, n) {
  if (!n.id?.name || !n.init) return
  const { init } = n
  if (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") {
    const fn = fns.find((f) => f.startLine === init.loc?.start.line && f.name === "<arrow>")
    if (fn) fn.name = n.id.name
    return
  }
  if (init.type !== "CallExpression" || !HOOK_NAMES.has(init.callee?.name)) return
  const cb = init.arguments?.[0]
  if (cb?.type === "ArrowFunctionExpression") {
    const fn = fns.find((f) => f.startLine === cb.loc?.start.line && f.name === "<arrow>")
    if (fn) fn.name = `${n.id.name} [${init.callee.name}]`
  }
}

function resolveArrowNames(fns, ast) {
  traverse(ast, {
    VariableDeclarator: (n) => resolveVariableDeclarator(fns, n),
    ReturnStatement: (n) => {
      const expr = n.argument
      if (!expr || expr.type !== "CallExpression" || !HOOK_NAMES.has(expr.callee?.name)) return
      const cb = expr.arguments?.[0]
      if (cb?.type === "ArrowFunctionExpression") {
        const fn = fns.find((f) => f.startLine === cb.loc?.start.line && f.name === "<arrow>")
        if (fn) fn.name = `return [${expr.callee.name}]`
      }
    },
    Property: (n) => {
      if (!n.key?.name) return
      const { value } = n
      if (value?.type === "ArrowFunctionExpression" || value?.type === "FunctionExpression") {
        const fn = fns.find(
          (f) => f.startLine === value.loc?.start.line && (f.name === "<arrow>" || f.name === "<anonymous>"),
        )
        if (fn) fn.name = n.key.name
      }
    },
  })
}

function collectFunctions(ast) {
  const fns = []
  traverse(ast, {
    FunctionDeclaration: (n) => registerFn(fns, n, n.id?.name ?? "<anonymous>"),
    FunctionExpression: (n) => registerFn(fns, n, n.id?.name ?? "<anonymous>"),
    ArrowFunctionExpression: (n) => registerFn(fns, n, "<arrow>"),
  })
  resolveArrowNames(fns, ast)
  return fns.filter((f) => f.name !== "<arrow>" || f.lineLength > 1)
}

function analyseFile(filePath) {
  const source = readFileSync(filePath, "utf8")
  const lines = source.split("\n")
  const physicalLoc = lines.length
  const blankLines = lines.filter((l) => l.trim() === "").length
  const commentLines = lines.filter(
    (l) => l.trim().startsWith("//") || l.trim().startsWith("*") || l.trim().startsWith("/*"),
  ).length
  const sourceLoc = physicalLoc - blankLines - commentLines

  let ast
  try {
    ast = parse(source, PARSE_OPTS)
  } catch (e) {
    return { error: e.message, file: filePath }
  }

  const logLoc = countLogicalLoc(ast)
  const hs = halstead(ast)
  const functions = collectFunctions(ast)
  const avgCC = functions.length > 0
    ? functions.reduce((s, f) => s + f.cc, 0) / functions.length
    : 1
  const mi = maintainabilityIndex(hs.volume, avgCC, Math.max(logLoc, 1))

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
    functions: functions.map((f) => {
      let ccRating
      if (f.cc <= 5) ccRating = "low"
      else if (f.cc <= 10) ccRating = "medium"
      else ccRating = "high"

      let lengthRating
      if (f.lineLength <= 20) lengthRating = "short"
      else if (f.lineLength <= 40) lengthRating = "medium"
      else lengthRating = "long"

      return { ...f, ccRating, lengthRating }
    }),
    warnings: [
      ...functions.filter((f) => f.cc > 5).map(
        (f) => `${f.name}() — cyclomatic complexity ${f.cc} (threshold: 5)`,
      ),
      ...functions.filter((f) => f.lineLength > 30).map(
        (f) => `${f.name}() — ${f.lineLength} lines (threshold: 30)`,
      ),
    ],
  }
}

function miRating(mi) {
  if (mi >= 85) return { label: "High", color: "#16a34a" }
  if (mi >= 65) return { label: "Moderate", color: "#d97706" }
  return { label: "Low", color: "#dc2626" }
}

function ccColor(cc) {
  if (cc <= 5) return "#16a34a"
  if (cc <= 10) return "#d97706"
  return "#dc2626"
}

function buildFileRow(r) {
  if (r.error) {
    return `<tr><td>${r.file}</td><td colspan="6" class="err">Parse error: ${r.error}</td></tr>`
  }
  const mi = miRating(r.maintainabilityIndex)
  const anchor = r.file.replaceAll(/[./\\]/g, "-")
  return `<tr>
    <td><a href="#file-${anchor}">${r.file}</a></td>
    <td>${r.physicalLoc}</td>
    <td>${r.sourceLoc}</td>
    <td>${r.logicalLoc}</td>
    <td>${r.functionCount}</td>
    <td style="color:${ccColor(r.avgCC)}">${r.avgCC} / max ${r.maxCC}</td>
    <td style="color:${mi.color}">${r.maintainabilityIndex} <small>(${mi.label})</small></td>
  </tr>`
}

function buildFileDetail(r) {
  const anchor = r.file.replaceAll(/[./\\]/g, "-")
  const fnRows = r.functions.map((f) => `<tr>
    <td>${f.name}()</td>
    <td>L${f.startLine}–${f.endLine}</td>
    <td>${f.lineLength}</td>
    <td>${f.params}</td>
    <td style="color:${ccColor(f.cc)}">${f.cc}</td>
    <td style="color:${ccColor(f.cc)}">${f.ccRating}</td>
  </tr>`).join("")

  const warnHtml = r.warnings.length > 0
    ? r.warnings.map((w) => `<div class="warn">${w}</div>`).join("")
    : "<div class=\"ok\">✓ No issues detected</div>"

  const tableHtml = r.functions.length > 0
    ? `<table><thead><tr>
        <th>Function</th><th>Lines</th><th>Length</th>
        <th>Params</th><th>CC</th><th>Rating</th>
      </tr></thead><tbody>${fnRows}</tbody></table>`
    : "<p><em>No named functions detected.</em></p>"

  return `<section id="file-${anchor}" class="file-section">
    <h2>${r.file}</h2>
    <div class="file-meta">
      <span>📄 ${r.physicalLoc} physical lines</span>
      <span>📝 ${r.sourceLoc} source lines</span>
      <span>🔢 ${r.logicalLoc} logical statements</span>
      <span>🔧 ${r.functionCount} functions</span>
      <span>Avg CC: ${r.avgCC}</span>
      <span>MI: ${r.maintainabilityIndex}</span>
    </div>
    ${warnHtml}
    ${tableHtml}
  </section>`
}

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f8fafc;color:#1e293b;font-family:"Segoe UI",system-ui,sans-serif;line-height:1.6;padding:32px}
  h1{font-size:22px;color:#0f172a;margin-bottom:4px}
  h2{font-size:15px;color:#0f172a;margin:24px 0 10px;font-weight:600}
  .sub{color:#64748b;font-size:13px;margin-bottom:28px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:28px}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .card .val{font-size:26px;font-weight:700;color:#0f172a}
  .card .lbl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-top:10px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
  th{background:#f1f5f9;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:10px 14px;text-align:left;border-bottom:1px solid #e2e8f0}
  td{padding:9px 14px;font-size:13px;border-top:1px solid #f1f5f9}
  tr:hover td{background:#f8fafc}
  a{color:#2563eb;text-decoration:none}
  a:hover{text-decoration:underline}
  .file-section{margin-bottom:28px;padding:20px 24px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .file-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:#64748b;margin:8px 0 14px}
  .warn{background:#fffbeb;border-left:3px solid #d97706;padding:6px 12px;margin:4px 0;font-size:13px;border-radius:4px;color:#92400e}
  .ok{background:#f0fdf4;border-left:3px solid #16a34a;padding:6px 12px;margin-bottom:12px;font-size:13px;border-radius:4px;color:#166534}
  .err{color:#dc2626}
  .legend{display:flex;gap:16px;font-size:12px;color:#64748b;margin:12px 0 8px;flex-wrap:wrap}
  .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px;vertical-align:middle}
  .warn-box{background:#fffbeb;border:1px solid #d97706;border-radius:10px;padding:16px 20px;margin-bottom:24px}
  .warn-box h2{color:#92400e;margin-bottom:10px}
  small{font-size:11px}
`

function buildHtml(results, generatedAt) {
  const totalLoc = results.reduce((s, r) => s + (r.physicalLoc ?? 0), 0)
  const totalFns = results.reduce((s, r) => s + (r.functionCount ?? 0), 0)
  const allWarnings = results.flatMap((r) => r.warnings ?? [])
  const avgMI = results.length > 0
    ? Math.round(results.reduce((s, r) => s + (r.maintainabilityIndex ?? 0), 0) / results.length * 10) / 10
    : 0

  const warnItems = allWarnings.map((w) => `<div class="warn">${w}</div>`).join("")
  const warnBanner = allWarnings.length > 0
    ? `<div class="warn-box"><h2>Functions Needing Attention</h2>${warnItems}</div>`
    : "<div class=\"ok\">✓ All functions within complexity and length thresholds</div>"

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Code Metrics — co2-emission</title>
  <style>${CSS}</style>
</head>
<body>
  <h1>Code Metrics Report</h1>
  <p class="sub">Project: co2-emission &nbsp;|&nbsp; Generated: ${generatedAt}</p>
  <div class="grid">
    <div class="card"><div class="val">${totalLoc}</div><div class="lbl">Total Lines</div></div>
    <div class="card"><div class="val">${results.length}</div><div class="lbl">Files</div></div>
    <div class="card"><div class="val">${totalFns}</div><div class="lbl">Functions</div></div>
    <div class="card"><div class="val" style="color:${miRating(avgMI).color}">${avgMI}</div><div class="lbl">Avg Maintainability</div></div>
    <div class="card"><div class="val" style="color:${allWarnings.length > 0 ? "#d97706" : "#16a34a"}">${allWarnings.length}</div><div class="lbl">Warnings</div></div>
  </div>
  ${warnBanner}
  <h2>File Summary</h2>
  <div class="legend">
    <span><span class="dot" style="background:#16a34a"></span>CC ≤ 5 Low</span>
    <span><span class="dot" style="background:#d97706"></span>CC 6–10 Medium</span>
    <span><span class="dot" style="background:#dc2626"></span>CC &gt; 10 High</span>
    <span>MI ≥ 85 High &nbsp;|&nbsp; 65–84 Moderate &nbsp;|&nbsp; &lt;65 Low</span>
  </div>
  <table>
    <thead><tr>
      <th>File</th><th>Phys LOC</th><th>Source LOC</th><th>Logical LOC</th>
      <th>Functions</th><th>Cyclomatic CC</th><th>Maintainability</th>
    </tr></thead>
    <tbody>${results.map(buildFileRow).join("")}</tbody>
  </table>
  <h2 style="margin-top:32px">Function Details</h2>
  ${results.filter((r) => !r.error).map(buildFileDetail).join("")}
</body>
</html>`
}

function padCol(s, w) {
  return String(s).padEnd(w)
}

function miColor(val) {
  if (val >= 85) return "\x1b[32m"
  if (val >= 65) return "\x1b[33m"
  return "\x1b[31m"
}

function ccConsoleColor(val) {
  if (val <= 5) return "\x1b[32m"
  if (val <= 10) return "\x1b[33m"
  return "\x1b[31m"
}

function printConsole(results) {
  const RESET = "\x1b[0m"
  const BOLD = "\x1b[1m"
  const CYAN = "\x1b[36m"
  const MUTED = "\x1b[90m"
  const YELLOW = "\x1b[33m"
  const GREEN = "\x1b[32m"

  console.log()
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}`)
  console.log(`${BOLD}${CYAN}║              Code Metrics Report — co2-emission              ║${RESET}`)
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}`)
  console.log()
  console.log(BOLD + padCol("File", 32) + padCol("LOC", 6) + padCol("Fns", 5) + padCol("AvgCC", 8) + padCol("MaxCC", 8) + padCol("MI", 8) + RESET)
  console.log(MUTED + "─".repeat(70) + RESET)

  for (const r of results) {
    if (r.error) {
      console.log(`\x1b[31m${r.file} — parse error${RESET}`)
      continue
    }
    const row = [
      padCol(r.file, 32),
      padCol(r.physicalLoc, 6),
      padCol(r.functionCount, 5),
      `${ccConsoleColor(r.avgCC)}${padCol(r.avgCC, 8)}${RESET}`,
      `${ccConsoleColor(r.maxCC)}${padCol(r.maxCC, 8)}${RESET}`,
      `${miColor(r.maintainabilityIndex)}${padCol(r.maintainabilityIndex, 8)}${RESET}`,
    ]
    console.log(row.join(""))
  }

  console.log(MUTED + "─".repeat(70) + RESET)

  const allWarnings = results.flatMap((r) => r.warnings ?? [])
  if (allWarnings.length > 0) {
    console.log()
    console.log(`${BOLD}${YELLOW}Warnings:${RESET}`)
    for (const w of allWarnings) console.log(`  ${YELLOW}${w}${RESET}`)
  } else {
    console.log(`\n  ${GREEN}All functions within thresholds${RESET}`)
  }
  console.log()
}

const generatedAt = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
const results = SOURCE_FILES.map((f) => analyseFile(join(ROOT, f)))

printConsole(results)

const outDir = join(ROOT, "reports", "metrics")
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, "metrics.json"), JSON.stringify({ generatedAt, files: results }, null, 2))
writeFileSync(join(outDir, "metrics.html"), buildHtml(results, generatedAt))

console.log("  Reports written to reports/metrics/\n")
