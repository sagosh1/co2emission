import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const FILE = join(process.cwd(), "reports", "mutation", "mutation.html")

let html = readFileSync(FILE, "utf8")

html = html
  .replace(
    "<mutation-test-report-app>",
    '<mutation-test-report-app theme="light">',
  )
  .replace(
    "<mutation-test-report-app ",
    '<mutation-test-report-app theme="light" ',
  )

if (!html.includes('theme="light"')) {
  html = html.replace("</head>", "  <style>mutation-test-report-app{color-scheme:light}</style>\n</head>")
}

writeFileSync(FILE, html)
console.log("mutation.html patched to light mode")
