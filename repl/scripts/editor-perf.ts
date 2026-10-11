/**
 * Editor keystroke cost on real Svelte source (src/DataTable/DataTable.svelte)
 * at 300 lines and full length, 1x and 4x CPU. Reports the editor's own JS
 * (tokenize + highlight ranges) and Event Timing durations for keydown, which
 * include layout and paint. Needs a running `bun server.ts`.
 *
 * Usage: bun scripts/editor-perf.ts
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const source = readFileSync("../src/DataTable/DataTable.svelte", "utf8");
const b = await chromium.launch({
  args: ["--disable-features=IsolateOrigins,site-per-process"],
});
async function run(lines: number, rate: number) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:5180/");
  await p.waitForFunction(() => window.__repl?.metrics?.previewPainted);
  const ta = p.locator("textarea.ce-input");
  await ta.evaluate((el, text) => {
    el.focus();
    el.select();
    document.execCommand("insertText", false, text);
  }, source.split("\n").slice(0, lines).join("\n"));
  await p.waitForTimeout(600);
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  await p.evaluate(() => {
    window.__repl.metrics.paintSamples = [];
    window.__ev = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (e.name === "keydown") window.__ev.push(Math.round(e.duration));
    }).observe({ type: "event", durationThreshold: 16 });
  });
  await ta.evaluate((el, n) => {
    const lines = el.value.split("\n");
    const i = lines.slice(0, Math.floor(n / 2)).join("\n").length;
    el.setSelectionRange(i, i);
  }, lines);
  await p.keyboard.type("abcdef", { delay: 80 });
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => ({
    s: window.__repl.metrics.paintSamples,
    ev: window.__ev,
  }));
  const med = (a: number[]) =>
    a.length ? [...a].sort((x, y) => x - y)[a.length >> 1] : 0;
  console.log(
    `${String(lines).padStart(5)} lines @${rate}x  JS ${med(r.s.map((x) => x.ms)).toFixed(1)} ms (tokenize ${med(r.s.map((x) => x.tokenize)).toFixed(1)}, ranges ${med(r.s.map((x) => x.ranges)).toFixed(1)} for ${med(r.s.map((x) => x.count))})   keydown ≥16ms: ${r.ev.length ? r.ev.join(",") : "none"}`,
  );
  await p.close();
}
for (const [n, rate] of [
  [300, 1],
  [300, 4],
  [1823, 1],
  [1823, 4],
])
  await run(n, rate);
await b.close();
