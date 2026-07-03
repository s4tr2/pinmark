// Reports gzipped bundle sizes against PRD budgets (loader 3 KB, core 40 KB).
// M6 turns this into a hard CI failure; for now it warns.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";

const out = resolve(import.meta.dirname, "../../../apps/web/public");
const budgets = [
  ["w.js", 3 * 1024],
  ["widget.core.js", 40 * 1024],
];

for (const [file, budget] of budgets) {
  const gz = gzipSync(readFileSync(resolve(out, file))).length;
  const kb = (gz / 1024).toFixed(2);
  const status = gz <= budget ? "OK" : "OVER BUDGET";
  console.log(`${file}: ${kb} KB gzipped (budget ${budget / 1024} KB) ${status}`);
}
