/**
 * End-to-end smoke check against a running `bun server.ts`.
 * Loads each example, waits for the preview to paint, asserts expected DOM in
 * the sandbox frame, and fails on page/frame errors. Writes screenshots to
 * ../.context/repl/screenshots when SCREENSHOTS=1.
 *
 * Usage: bun scripts/smoke.ts
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium, type Frame, type Page } from "playwright";

const APP = process.env.REPL_APP ?? "http://localhost:5180/";
const SHOTS = process.env.SCREENSHOTS === "1";
const SHOT_DIR = resolve(import.meta.dir, "../../.context/repl/screenshots");

const checks: Array<{ id: string; expect: (f: Frame) => Promise<void> }> = [
  {
    id: "default",
    async expect(f) {
      await f.locator("button.bx--btn", { hasText: "Clicked 0 times" }).click();
      await f
        .locator("button.bx--btn", { hasText: "Clicked 1 times" })
        .waitFor();
      await f.locator(".bx--combo-box input").waitFor();
    },
  },
  {
    id: "datatable",
    expect: (f) => f.locator("table.bx--data-table tbody tr").first().waitFor(),
  },
  {
    id: "modal",
    async expect(f) {
      await f.locator("button", { hasText: "Create database" }).click();
      await f.locator(".bx--modal.is-visible").waitFor();
    },
  },
  {
    id: "datepicker",
    async expect(f) {
      await f.locator("input.bx--date-picker__input").first().click();
      await f.locator(".flatpickr-calendar.open").waitFor();
    },
  },
  {
    id: "multi-file",
    expect: (f) => f.locator("text=Total: 0 items").waitFor(),
  },
  { id: "runes", expect: (f) => f.locator(".bx--progress-bar").waitFor() },
  {
    id: "console",
    expect: (f) => f.locator("button", { hasText: "Throw" }).waitFor(),
  },
];

function sandbox(page: Page) {
  const frame = page.frames().find((f) => f.url().includes("/sandbox/"));
  if (!frame) throw new Error("sandbox frame not found");
  return frame;
}

async function waitForPaint(page: Page, afterRuns = 0) {
  await page.waitForFunction(
    (n) =>
      window.__repl?.metrics?.previewPainted !== undefined &&
      (window as any).__paints > n,
    afterRuns,
  );
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(`page: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error")
    errors.push(`console(${m.location().url}): ${m.text()}`);
});
await page.addInitScript(() => {
  (window as any).__paints = 0;
  const id = setInterval(() => {
    const repl = (window as any).__repl;
    if (!repl?.subscribe) return;
    clearInterval(id);
    repl.subscribe((m: any) => {
      if (m.type === "painted") (window as any).__paints++;
    });
  }, 1);
});

await page.goto(APP);
await waitForPaint(page);
const metrics = await page.evaluate(() => window.__repl.metrics);
console.log(
  "cold load metrics (ms):",
  JSON.stringify(metrics, (_, v) =>
    typeof v === "number" ? Math.round(v) : v,
  ),
);
if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true });

let failed = 0;
for (const check of checks) {
  const paints = await page.evaluate(() => (window as any).__paints);
  if (check.id !== "default") {
    await page.locator("select").first().selectOption(check.id);
    await waitForPaint(page, paints);
  }
  try {
    await check.expect(sandbox(page));
    console.log(`✓ ${check.id}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${check.id}: ${(e as Error).message.split("\n")[0]}`);
  }
  if (SHOTS) await page.screenshot({ path: join(SHOT_DIR, `${check.id}.png`) });
}

// Compile error keeps the last good preview and reports diagnostics.
await page.locator("select").first().selectOption("compile-error");
await page.locator(".diagnostics .error").first().waitFor();
console.log(
  `✓ compile-error → ${await page.locator(".diagnostics .error").first().innerText()}`,
);
if (SHOTS) await page.screenshot({ path: join(SHOT_DIR, "compile-error.png") });

// Typing → preview update.
await page.locator("select").first().selectOption("default");
await page.waitForFunction(() =>
  document.querySelector("textarea")?.value.includes("Clicked"),
);
const before = await page.evaluate(() => (window as any).__paints);
const textarea = page.locator("textarea");
await textarea.click();
await textarea.evaluate((el: HTMLTextAreaElement) => {
  const i = el.value.indexOf("Clicked");
  el.setSelectionRange(i, i + "Clicked".length);
});
await page.keyboard.type("Pressed");
await waitForPaint(page, before);
await sandbox(page).locator("button", { hasText: "Pressed 0 times" }).waitFor();
console.log("✓ edit → preview");

// Shared link round-trip. The hash is written debounced + idle after the
// compile; poll until it decodes to the edited source.
function hashIncludes(text: string) {
  return page.evaluate(async (t) => {
    try {
      const b64 = location.hash.slice(2).replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));
      return (await new Response(stream).text()).includes(t);
    } catch {
      return false;
    }
  }, text);
}
for (let i = 0; !(await hashIncludes("Pressed")); i++) {
  if (i > 100) throw new Error("hash never updated");
  await page.waitForTimeout(50);
}
const link = await page.evaluate(() => location.href);
const fresh = await browser.newPage();
await fresh.goto(link);
await fresh.waitForFunction(
  () => window.__repl?.metrics?.previewPainted !== undefined,
);
await sandbox(fresh)
  .locator("button", { hasText: "Pressed 0 times" })
  .waitFor();
console.log(`✓ shared link reproduces (${link.length} chars)`);

const relevant = errors.filter((e) => !/Boom|Error: Boom/.test(e));
if (relevant.length) {
  console.log("\nerrors:");
  for (const e of relevant) console.log(`  ${e}`);
}
await browser.close();
process.exit(failed || relevant.length ? 1 : 0);

declare global {
  interface Window {
    __repl: any;
  }
}
