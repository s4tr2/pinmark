// Enforces gzipped bundle budgets (PRD §5.1 / acceptance criteria):
// loader 3 KB, core 40 KB. Exits non-zero over budget, so `pnpm --filter
// widget build`, and therefore CI, fails hard.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";

const out = resolve(import.meta.dirname, "../../../apps/web/public");
const budgets = [
  ["w.js", 3 * 1024],
  ["widget.core.js", 40 * 1024],
];

let failed = false;
for (const [file, budget] of budgets) {
  const gz = gzipSync(readFileSync(resolve(out, file))).length;
  const kb = (gz / 1024).toFixed(2);
  const over = gz > budget;
  if (over) failed = true;
  console.log(
    `${file}: ${kb} KB gzipped (budget ${budget / 1024} KB) ${over ? "OVER BUDGET" : "OK"}`
  );
}
if (failed) {
  console.error("Bundle size budget exceeded. Build failed.");
  process.exit(1);
}
