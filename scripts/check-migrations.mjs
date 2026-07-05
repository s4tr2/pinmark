#!/usr/bin/env node
// CI guard: every migration filename must match the timestamped pattern
// Supabase expects, and the list must already sort into chronological
// order (catches an accidental out-of-order filename before it reaches a
// real database). Does not connect to any database.

import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const NAME_PATTERN = /^\d{14}_[a-z0-9_]+\.sql$/;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

const files = readdirSync(migrationsDir).filter((name) => name.endsWith(".sql"));

if (files.length === 0) {
  fail(`No .sql files found in ${migrationsDir}`);
} else {
  const malformed = files.filter((name) => !NAME_PATTERN.test(name));
  if (malformed.length > 0) {
    fail(
      `Migration filenames must match YYYYMMDDHHMMSS_description.sql:\n` +
        malformed.map((name) => `  ${name}`).join("\n")
    );
  }

  const sorted = [...files].sort();
  const outOfOrder = files.some((name, i) => name !== sorted[i]);
  if (outOfOrder) {
    fail(
      "Migration files are not in chronological filename order.\n" +
        `Found:    ${files.join(", ")}\n` +
        `Expected: ${sorted.join(", ")}`
    );
  }

  if (!malformed.length && !outOfOrder) {
    console.log(`${files.length} migrations, all named and ordered correctly:`);
    for (const name of sorted) console.log(`  ${name}`);
  }
}
