import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function parseMajor(output) {
  const match = String(output ?? "").match(/(?:^|\s|version\s+|v)(\d+)\./i);
  return match ? Number(match[1]) : null;
}

export function evaluateRequirement(name, output, minimumMajor, required = true) {
  const major = parseMajor(output);
  const ok = major !== null && major >= minimumMajor;

  return {
    name,
    ok,
    required,
    detail:
      major === null
        ? "not available"
        : `${String(output).trim().split(/\r?\n/)[0]} (minimum ${minimumMajor})`,
  };
}

export function summarizeChecks(checks) {
  return checks.reduce(
    (summary, check) => {
      if (!check.ok && check.required) summary.failures += 1;
      if (!check.ok && !check.required) summary.warnings += 1;
      return summary;
    },
    { failures: 0, warnings: 0 },
  );
}

export function requiresShell(command, platform = process.platform) {
  return platform === "win32" && ["npm", "npx"].includes(command);
}

function run(name, args, timeout = 15_000) {
  const useCommandShell = requiresShell(name);
  const command = useCommandShell ? (process.env.ComSpec ?? "cmd.exe") : name;
  const commandArgs = useCommandShell
    ? ["/d", "/s", "/c", [name, ...args].join(" ")]
    : args;
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
    timeout,
    windowsHide: true,
  });

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

function commandCheck(name, command, args, options = {}) {
  const result = run(command, args, options.timeout);
  return {
    name,
    ok: result.ok && (!options.includes || result.output.includes(options.includes)),
    required: options.required ?? true,
    detail: result.output.split(/\r?\n/)[0] || "not available",
  };
}

async function productionHealthCheck() {
  try {
    const response = await fetch("https://www.niiplantsghana.com/api/health", {
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json();
    return {
      name: "Production health",
      ok: response.ok && body.status === "ok",
      required: false,
      detail: `${response.status} ${body.status ?? "unknown"}`,
    };
  } catch (error) {
    return {
      name: "Production health",
      ok: false,
      required: false,
      detail: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function main() {
  const nodeVersion = run("node", ["--version"]);
  const npmVersion = run("npm", ["--version"]);
  const gitVersion = run("git", ["--version"]);
  const dockerVersion = run("docker", ["--version"]);
  const supabaseVersion = run("supabase", ["--version"]);

  const checks = [
    evaluateRequirement("Node.js", nodeVersion.ok ? nodeVersion.output : null, 24),
    evaluateRequirement("npm", npmVersion.ok ? npmVersion.output : null, 10),
    evaluateRequirement("Git", gitVersion.ok ? gitVersion.output : null, 2),
    evaluateRequirement("Docker", dockerVersion.ok ? dockerVersion.output : null, 24),
    evaluateRequirement(
      "Supabase CLI",
      supabaseVersion.ok ? supabaseVersion.output : null,
      2,
    ),
    commandCheck("Docker engine", "docker", ["info", "--format", "{{.ServerVersion}}"]),
    commandCheck("Local Supabase", "supabase", ["status", "--output", "json"]),
    commandCheck("GitHub authentication", "gh", ["auth", "status"], {
      required: false,
    }),
    commandCheck("Supabase MCP OAuth", "codex", ["mcp", "list"], {
      includes: "supabase",
      required: false,
    }),
    {
      name: ".env.local",
      ok: existsSync(".env.local"),
      required: true,
      detail: existsSync(".env.local") ? "present" : "missing",
    },
    {
      name: "Vercel project link",
      ok: existsSync(".vercel/project.json"),
      required: false,
      detail: existsSync(".vercel/project.json") ? "present" : "run vercel link",
    },
  ];

  if (process.argv.includes("--production")) {
    checks.push(await productionHealthCheck());
  }

  for (const check of checks) {
    const marker = check.ok ? "PASS" : check.required ? "FAIL" : "WARN";
    console.log(`${marker.padEnd(4)}  ${check.name}: ${check.detail}`);
  }

  const summary = summarizeChecks(checks);
  console.log(
    `\nToolchain doctor: ${summary.failures} failure(s), ${summary.warnings} warning(s).`,
  );
  process.exitCode = summary.failures > 0 ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
