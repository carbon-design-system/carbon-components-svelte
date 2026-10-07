// @depends-on e2e/fixtures/*.html
/**
 * Fixture discovery and the e2e vite dev server, for the Playwright perf
 * harnesses (e2e/selector-stats.ts, e2e/transition-perf.ts). Computed-style
 * snapshots and cascade usage run on crassus instead (`crassus capture`,
 * `crassus usage`), over a static build of the same fixtures.
 */
import { type ChildProcess, spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

// Beside this file, not under the working directory: the Svelte 3/4
// harnesses run their tests from tests-svelte3/ and tests-svelte4/.
const FIXTURES_DIR = fileURLToPath(new URL("./fixtures", import.meta.url));

/** Fixture page names (`e2e/fixtures/<name>.html`) containing `only`. */
export async function fixtures(only?: string): Promise<string[]> {
  return (await readdir(FIXTURES_DIR))
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.slice(0, -".html".length))
    .filter((f) => !only || f.includes(only))
    .sort();
}

export async function waitForServer(url: string): Promise<void> {
  for (let i = 0; i < 100; i++) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: sequential by design
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {}
    await sleep(200);
  }
  throw new Error(`server at ${url} did not start`);
}

/**
 * Spawns the e2e vite dev server (unless `url` points at one already
 * running) and waits for it to answer.
 */
export async function startServer(
  port: number,
  url?: string,
): Promise<{ base: string; server?: ChildProcess }> {
  const base = url ?? `http://localhost:${port}`;
  if (url) return { base };
  const server = spawn(
    "bunx",
    [
      "vite",
      "--config",
      "e2e/vite.config.ts",
      "--port",
      String(port),
      "--strictPort",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  await waitForServer(base);
  return { base, server };
}
