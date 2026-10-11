/**
 * Perf harness for the spike. Spawns its own server (immutable caching, own
 * ports) per profile and measures cold + warm loads and the edit loop.
 *
 *   Desktop  no shaping, no CPU throttle
 *   Phone    150 ms latency + 1.6 Mbit/s shared link (server-side shaping),
 *            4× CPU throttle on the page renderer (site isolation disabled so
 *            the preview iframe shares the throttled process; the compiler
 *            worker thread is NOT throttled → phone compile numbers are optimistic)
 *
 * Usage: bun scripts/perf.ts [--runs=3]
 */
import { resolve } from "node:path";
import { type Browser, chromium, type Page } from "playwright";

const RUNS = Number(
  process.argv.find((a) => a.startsWith("--runs="))?.split("=")[1] ?? 3,
);
const APP_PORT = 5190;
const SANDBOX_PORT = 5191;
const APP = `http://localhost:${APP_PORT}/`;

const profiles = [
  { name: "Desktop", latency: 0, kbps: 0, cpu: 1 },
  { name: "Phone", latency: 150, kbps: 1600, cpu: 4 },
];

type Sample = Record<string, number>;

const median = (xs: number[]) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : Number.NaN;
};

async function startServer(latency: number, kbps: number) {
  const proc = Bun.spawn(["bun", resolve(import.meta.dir, "../server.ts")], {
    env: {
      ...process.env,
      REPL_IMMUTABLE: "1",
      REPL_APP_PORT: String(APP_PORT),
      REPL_SANDBOX_PORT: String(SANDBOX_PORT),
      REPL_LATENCY_MS: String(latency),
      REPL_KBPS: String(kbps),
    },
    stdout: "pipe",
  });
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(`http://127.0.0.1:${SANDBOX_PORT}/pkg/`);
      return proc;
    } catch {
      await Bun.sleep(50);
    }
  }
  throw new Error("server did not start");
}

async function load(
  page: Page,
  cpu: number,
  track?: { starts: number[]; bytes: number[] },
) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  if (track) {
    page.on("requestfinished", async (r) => {
      const sizes = await r.sizes().catch(() => undefined);
      track.bytes.push(sizes?.responseBodySize ?? 0);
      if (/\/pkg\/ccs@[^/]+\/svelte@[^/]+\/src\//.test(r.url()))
        track.starts.push(r.timing().startTime);
    });
  }
  await page.goto(APP);
  await page.waitForFunction(
    () => (window as any).__repl?.metrics?.previewPainted !== undefined,
    null,
    {
      timeout: 60_000,
    },
  );
  const m = await page.evaluate(() => (window as any).__repl.metrics);
  const events = await page.evaluate(
    () =>
      new Promise<any[]>((done) => {
        const out: any[] = [];
        (window as any).__repl.subscribe((e: any) => out.push(e));
        done(out);
      }),
  );
  const ready = events.find((e) => e.type === "worker-ready");
  return { ...m, compilerLoad: ready?.compilerMs } as Sample;
}

/** Sequential request rounds = clusters of request starts separated by > half the RTT. */
function rounds(starts: number[], latency: number) {
  if (!starts.length) return 0;
  const sorted = [...starts].sort((a, b) => a - b);
  let count = 1;
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i] - sorted[i - 1] > Math.max(latency / 2, 20)) count++;
  return count;
}

async function editLoop(page: Page) {
  const ta = page.locator("textarea");
  await ta.click();
  await ta.evaluate((el: HTMLTextAreaElement) => {
    const i = el.value.indexOf("Clicked");
    el.setSelectionRange(i + "Clicked".length, i + "Clicked".length);
  });
  await page.evaluate(() => {
    const w = window as any;
    w.__updates = [];
    w.__compiles = [];
    w.__repl.subscribe((e: any) => {
      if (e.type === "painted" && e.sinceCompile !== undefined)
        w.__updates.push(e.sinceCompile);
      if (e.type === "compiled") w.__compiles.push(e.ms);
    });
    w.__events = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        w.__events.push(`${entry.name}:${Math.round(entry.duration)}`);
    }).observe({
      type: "event",
      durationThreshold: 16,
      buffered: false,
    } as any);
  });
  const updatesBefore = await page.evaluate(
    () => (window as any).__updates.length,
  );
  for (const ch of "!!!!!") {
    await page.keyboard.type(ch);
    await page.waitForFunction(
      (n) => (window as any).__updates.length > n,
      updatesBefore,
      { timeout: 30_000 },
    );
    await page.waitForTimeout(150);
  }
  return page.evaluate(() => {
    const w = window as any;
    return {
      updates: w.__updates.slice(-5),
      compiles: w.__compiles.slice(-5),
      slowEvents: w.__events,
    };
  });
}

const browser: Browser = await chromium.launch({
  args: ["--disable-features=IsolateOrigins,site-per-process"],
});

const fmt = (n: number) =>
  Number.isFinite(n) ? `${Math.round(n)}`.padStart(6) : "     —";

for (const profile of profiles) {
  const server = await startServer(profile.latency, profile.kbps);
  const cold: Sample[] = [];
  const warm: Sample[] = [];
  let coldRounds = 0;
  let coldBytes = 0;
  let edit: any;
  try {
    for (let i = 0; i < RUNS; i++) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();
      const track = { starts: [] as number[], bytes: [] as number[] };
      cold.push(await load(page, profile.cpu, i === 0 ? track : undefined));
      if (i === 0) {
        await page.waitForTimeout(500);
        coldRounds = rounds(track.starts, profile.latency);
        coldBytes = track.bytes.reduce((a, b) => a + b, 0);
      }
      const page2 = await context.newPage();
      warm.push(await load(page2, profile.cpu));
      if (i === 0) edit = await editLoop(page2);
      await context.close();
    }
  } finally {
    server.kill();
    await server.exited;
  }

  console.log(
    `\n${profile.name}  (median of ${RUNS}; ms since navigation start)`,
  );
  console.log("                  cold   warm");
  for (const key of [
    "codeVisible",
    "shellMounted",
    "firstCompiled",
    "previewPainted",
    "compilerLoad",
  ]) {
    console.log(
      `  ${key.padEnd(15)}${fmt(median(cold.map((s) => s[key])))} ${fmt(median(warm.map((s) => s[key])))}`,
    );
  }
  console.log(
    `  cold transfer      ${(coldBytes / 1024).toFixed(0)} kB (encoded)`,
  );
  console.log(
    `  library rounds     ${coldRounds} (ccs module request clusters)`,
  );
  console.log(
    `  edit → preview     ${edit.updates.map((x: number) => Math.round(x)).join(", ")} ms  (compile ${edit.compiles.map((x: number) => x.toFixed(1)).join(", ")} ms)`,
  );
  const typing = edit.slowEvents.filter((e: string) =>
    /^(keydown|keypress|keyup|input|beforeinput):/.test(e),
  );
  console.log(
    `  typing events ≥16  ${typing.length ? typing.join(" ") : "none"}`,
  );
}

await browser.close();
