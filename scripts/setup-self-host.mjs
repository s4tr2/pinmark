#!/usr/bin/env node
// Guides a self-hoster through the Supabase side of a Pinmark deploy:
// checks tooling, links a project, shows pending migrations, and applies
// them after confirmation. Never touches the hosted Pinmark project (it
// only ever operates on whatever --project-ref the caller provides), never
// reads or prints SUPABASE_SERVICE_ROLE_KEY (this script drives the
// `supabase` CLI's own auth, not the app's), and redacts any connection
// string the CLI happens to print. Plain Node, no dependencies, so it runs
// the same on macOS/Linux/Windows.

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes("--dry-run"),
  yes: args.includes("--yes") || args.includes("-y"),
  help: args.includes("--help") || args.includes("-h"),
  projectRef: (args.find((a) => a.startsWith("--project-ref=")) ?? "").slice(
    "--project-ref=".length
  ),
};

function log(message) {
  console.log(message);
}

function fail(message) {
  console.error(`\nError: ${message}`);
  process.exitCode = 1;
}

function printHelp() {
  log(`Usage: pnpm setup:self-host [options]

Links your own Supabase project and applies Pinmark's migrations to it.
Never touches the hosted Pinmark project; only ever acts on the project
you point it at.

Options:
  --project-ref=<ref>   Supabase project ref (skips the interactive prompt)
  --dry-run             Show what would happen, make no changes
  --yes, -y             Skip the confirmation prompt (non-interactive)
  --help, -h            Show this message
`);
}

// Redact any Postgres connection string the CLI might print, on the
// chance a command surfaces one (it should not need to, but this is the
// one place credentials could leak if it did).
function redact(text) {
  return text.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-connection-string]");
}

function run(command, commandArgs, { allowFailure = false } = {}) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });
  const stdout = redact(result.stdout ?? "");
  const stderr = redact(result.stderr ?? "");
  if (result.error || (result.status !== 0 && !allowFailure)) {
    return { ok: false, stdout, stderr, status: result.status };
  }
  return { ok: result.status === 0, stdout, stderr, status: result.status };
}

function checkTool(command, versionArgs, installHint) {
  const result = run(command, versionArgs, { allowFailure: true });
  if (!result.ok) {
    return { ok: false, installHint };
  }
  return { ok: true, version: result.stdout.trim().split("\n")[0] };
}

async function promptProjectRef() {
  if (!process.stdin.isTTY || flags.yes) return null;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      "Supabase project ref (Project Settings -> General -> Reference ID): "
    );
    return answer.trim() || null;
  } finally {
    rl.close();
  }
}

async function confirm(message) {
  if (flags.yes) return true;
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${message} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function main() {
  if (flags.help) {
    printHelp();
    return;
  }

  log("Pinmark self-host setup\n");

  const node = checkTool(process.execPath, ["--version"], "Install Node 20+ from nodejs.org");
  const pnpm = checkTool("pnpm", ["--version"], "npm install -g pnpm");
  const supabase = checkTool(
    "supabase",
    ["--version"],
    "npm install -g supabase, or see supabase.com/docs/guides/cli"
  );

  log(`Node:     ${node.ok ? node.version : "not found"}`);
  log(`pnpm:     ${pnpm.ok ? pnpm.version : "not found"}`);
  log(`Supabase CLI: ${supabase.ok ? supabase.version : "not found"}`);

  const missingTools = [node, pnpm, supabase].filter((t) => !t.ok);
  if (missingTools.length > 0) {
    if (!flags.dryRun) {
      for (const tool of missingTools) fail(tool.installHint);
      return;
    }
    log(
      "\n(dry run: continuing despite missing tools above, would stop here otherwise)"
    );
  }

  let projectRef = flags.projectRef || process.env.SUPABASE_PROJECT_REF || null;
  if (!projectRef) projectRef = await promptProjectRef();

  if (!projectRef) {
    if (flags.dryRun) {
      log(
        "\n(dry run: no --project-ref given, would prompt interactively or fail non-interactively)"
      );
      projectRef = "<project-ref>";
    } else {
      fail(
        "No project ref provided. Pass --project-ref=<ref> or run this interactively."
      );
      return;
    }
  }

  log(`\nProject ref: ${projectRef}`);

  if (flags.dryRun) {
    log("\nDry run: no commands that change anything will be run.");
    log("Would run, in order:");
    log(`  supabase projects list          (check login state)`);
    log(`  supabase login                  (only if not already logged in)`);
    log(`  supabase link --project-ref ${projectRef}`);
    log(`  supabase migration list`);
    log(`  (confirmation prompt)`);
    log(`  supabase db push`);
    printNextSteps();
    return;
  }

  if (!supabase.ok) {
    fail("Supabase CLI is required past this point; install it and re-run.");
    return;
  }

  log("\nChecking Supabase login...");
  const loginCheck = run("supabase", ["projects", "list"], { allowFailure: true });
  if (!loginCheck.ok) {
    log("Not logged in. Running `supabase login`...");
    const login = run("supabase", ["login"]);
    if (!login.ok) {
      fail("supabase login failed. Run it manually and re-run this script.");
      return;
    }
  } else {
    log("Already logged in.");
  }

  log(`\nLinking project ${projectRef}...`);
  const link = run("supabase", ["link", "--project-ref", projectRef]);
  if (!link.ok) {
    fail(
      `supabase link failed:\n${link.stderr || link.stdout}\n` +
        "Double check the project ref and that you have access to it."
    );
    return;
  }
  log(link.stdout || "Linked.");

  log("\nPending migrations:");
  const migrations = run("supabase", ["migration", "list"], { allowFailure: true });
  log(migrations.stdout || migrations.stderr || "(unable to list migrations)");

  const proceed = await confirm(
    "\nApply these migrations to the linked project now?"
  );
  if (!proceed) {
    log("Stopped before making changes. Re-run when ready.");
    return;
  }

  log("\nApplying migrations (supabase db push)...");
  const push = run("supabase", ["db", "push"]);
  log(push.stdout || push.stderr);
  if (!push.ok) {
    fail("supabase db push failed. See output above for details.");
    return;
  }

  log("\nMigrations applied.");
  printNextSteps();
}

function printNextSteps() {
  log(`
Next step: deploy apps/web to Vercel (see the "Deploy with Vercel" button
in README.md, or DEPLOY.md for the full walkthrough). You'll be prompted
for the same Supabase URL and keys from this project's API settings.
`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
