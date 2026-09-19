/**
 * CDP performance harness for `transition` / `contain` CSS changes.
 *
 * Clones a fixture's target markup to scale (real pages usually show 1-3
 * instances; simultaneous transitions is the case worth measuring), then
 * repeatedly triggers the same state change while sampling
 * `Performance.getMetrics()` deltas via CDP. Reports median and IQR per
 * metric across >= 10 timed runs so a real improvement can be told apart
 * from run-to-run noise.
 *
 * Usage:
 *   BUILD_CSS_MINIFY=1 bun scripts/build-css
 *   bun e2e/transition-perf.ts <scenario> [--runs 15]
 *
 * Run once before a CSS edit and once after, then compare the two reports.
 */
import { chromium } from "playwright";
import { fixtures, startServer } from "./cascade-snapshot";

const PORT = 4175;
const [scenarioKey, ...rest] = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const RUNS = Number(opt("runs") ?? 15);
const URL = opt("url");

const METRICS = [
  "RecalcStyleDuration",
  "LayoutDuration",
  "RecalcStyleCount",
  "LayoutCount",
] as const;
type MetricName = (typeof METRICS)[number];

type Mode = "class" | "pseudo" | "checked";

interface Scenario {
  fixture: string;
  scale: number;
  mode: Mode;
  /** Marks the element(s) to trigger the state on (`data-ccs-perf` idx). */
  setup: (scale: number) => string;
  /** Only used for mode "class": class name toggled on the marked elements. */
  toggleClass?: string;
}

const MARK = "data-ccs-perf";

const scenarios: Record<string, Scenario> = {
  "list-box": {
    // ComboBox is the only selection component whose root doesn't have a
    // component-specific transition override shadowing the shared
    // `.bx--list-box` rule (Dropdown and MultiSelect both declare their own,
    // equal/higher-specificity `transition:` on the same element).
    fixture: "combobox",
    scale: 150,
    mode: "pseudo",
    setup: (n) => `
      const tmpl = document.querySelector(".bx--combo-box.bx--list-box");
      const parent = tmpl.parentElement;
      for (let i = 0; i < ${n} - 1; i++) {
        const clone = tmpl.cloneNode(true);
        clone.removeAttribute("id");
        parent.appendChild(clone);
      }
      const els = document.querySelectorAll(".bx--list-box");
      els.forEach((el, i) => el.setAttribute("${MARK}", String(i)));
      return els.length;
    `,
  },
  "tree-view": {
    fixture: "tree-view",
    scale: 150,
    mode: "class",
    toggleClass: "bx--tree-parent-node__toggle-icon--expanded",
    setup: (n) => `
      const tmpl = document.querySelector(".bx--tree-parent-node");
      const parent = tmpl.parentElement;
      for (let i = 0; i < ${n} - 1; i++) {
        parent.appendChild(tmpl.cloneNode(true));
      }
      const els = document.querySelectorAll(".bx--tree-parent-node__toggle-icon");
      els.forEach((el, i) => el.setAttribute("${MARK}", String(i)));
      return els.length;
    `,
  },
  "accordion-active": {
    fixture: "accordion",
    scale: 60,
    mode: "class",
    toggleClass: "bx--accordion__item--active",
    setup: (n) => `
      const tmpl = document.querySelector(".bx--accordion__item");
      const parent = tmpl.parentElement;
      for (let i = 0; i < ${n} - 1; i++) {
        parent.appendChild(tmpl.cloneNode(true));
      }
      const els = document.querySelectorAll(".bx--accordion__item");
      els.forEach((el, i) => el.setAttribute("${MARK}", String(i)));
      return els.length;
    `,
  },
  "accordion-disabled": {
    fixture: "accordion",
    scale: 40,
    mode: "class",
    toggleClass: "bx--accordion__item--disabled",
    setup: (n) => `
      const tmpl = document.querySelector(".bx--accordion__item");
      const parent = tmpl.parentElement;
      for (let i = 0; i < ${n} - 1; i++) {
        parent.appendChild(tmpl.cloneNode(true));
      }
      const els = document.querySelectorAll(".bx--accordion__item");
      els.forEach((el, i) => el.setAttribute("${MARK}", String(i)));
      return els.length;
    `,
  },
  flatpickr: {
    fixture: "date-picker",
    scale: 0, // uses whatever the open calendar renders, no cloning
    mode: "pseudo",
    setup: () => `
      const input = document.querySelector(".flatpickr-input") || document.querySelector("input[data-ccs-datepicker], .bx--date-picker__input");
      (input || document.querySelector("input")).click();
      await new Promise((r) => setTimeout(r, 100));
      const els = document.querySelectorAll(".flatpickr-day");
      els.forEach((el, i) => el.setAttribute("${MARK}", String(i)));
      return els.length;
    `,
  },
  "structured-list": {
    fixture: "structured-list",
    scale: 60,
    mode: "checked",
    setup: (n) => `
      const tmpl = document.querySelector(
        ".bx--structured-list-row:not(.bx--structured-list-row--header-row)",
      );
      const parent = tmpl.parentElement;
      for (let i = 0; i < ${n} - 1; i++) {
        const clone = tmpl.cloneNode(true);
        const input = clone.querySelector(".bx--structured-list-input");
        if (input) {
          input.removeAttribute("name");
          input.removeAttribute("id");
        }
        parent.appendChild(clone);
      }
      const els = document.querySelectorAll(".bx--structured-list-input");
      els.forEach((el, i) => {
        el.removeAttribute("name");
        el.setAttribute("${MARK}", String(i));
      });
      return els.length;
    `,
  },
  "code-snippet": {
    fixture: "code-snippet",
    scale: 30,
    mode: "class",
    toggleClass: "bx--snippet--disabled",
    setup: (n) => `
      const tmpl = document.querySelector(".bx--snippet");
      const parent = tmpl.parentElement;
      for (let i = 0; i < ${n} - 1; i++) {
        parent.appendChild(tmpl.cloneNode(true));
      }
      const els = document.querySelectorAll(".bx--snippet");
      els.forEach((el, i) => el.setAttribute("${MARK}", String(i)));
      return els.length;
    `,
  },
  "content-switcher": {
    fixture: "content-switcher",
    scale: 60,
    mode: "class",
    toggleClass: "bx--content-switcher--selected",
    setup: (n) => `
      const tmpl = document.querySelector(".bx--content-switcher-btn");
      const parent = tmpl.parentElement;
      for (let i = 0; i < ${n} - 1; i++) {
        parent.appendChild(tmpl.cloneNode(true));
      }
      const els = document.querySelectorAll(".bx--content-switcher-btn");
      els.forEach((el, i) => el.setAttribute("${MARK}", String(i)));
      return els.length;
    `,
  },
  uishell: {
    fixture: "uishell",
    scale: 60,
    mode: "class",
    toggleClass: "bx--header-search-menu-item--selected",
    setup: (n) => `
      document.querySelector(".bx--header-search-button").click();
      await new Promise((r) => setTimeout(r, 50));
      const tmpl = document.querySelector(".bx--header-search-menu-item");
      const parent = tmpl.parentElement;
      for (let i = 0; i < ${n} - 1; i++) {
        parent.appendChild(tmpl.cloneNode(true));
      }
      const els = document.querySelectorAll(".bx--header-search-menu-item");
      els.forEach((el, i) => el.setAttribute("${MARK}", String(i)));
      return els.length;
    `,
  },
};

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function iqr(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.floor(p * (s.length - 1))];
  return q(0.75) - q(0.25);
}

async function main(): Promise<void> {
  const scenario = scenarios[scenarioKey];
  if (!scenario) {
    console.error(
      `usage: transition-perf.ts <${Object.keys(scenarios).join("|")}> [--runs N]`,
    );
    process.exit(2);
  }

  const names = await fixtures(scenario.fixture);
  if (!names.includes(scenario.fixture)) {
    throw new Error(`fixture not found: ${scenario.fixture}`);
  }

  const { base, server } = await startServer(PORT, URL);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 4000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  try {
    await page.goto(`${base}/${scenario.fixture}.html`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(300);

    const count: number = await page.evaluate(
      new Function(
        "n",
        `return (async () => { ${scenario.setup(scenario.scale)} })();`,
      ) as (n: number) => Promise<number>,
      scenario.scale,
    );
    console.log(
      `scenario=${scenarioKey} fixture=${scenario.fixture} elements=${count} mode=${scenario.mode}`,
    );

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    let nodeIds: number[] = [];
    if (scenario.mode === "pseudo") {
      await cdp.send("DOM.enable");
      await cdp.send("CSS.enable");
      const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
      const { nodeIds: found } = await cdp.send("DOM.querySelectorAll", {
        nodeId: root.nodeId,
        selector: `[${MARK}]`,
      });
      nodeIds = found;
    }

    async function getMetrics(): Promise<Record<MetricName, number>> {
      const { metrics } = await cdp.send("Performance.getMetrics");
      const out = {} as Record<MetricName, number>;
      for (const m of METRICS) {
        out[m] = metrics.find((x) => x.name === m)?.value ?? 0;
      }
      return out;
    }

    async function forward(): Promise<void> {
      if (scenario.mode === "class") {
        await page.evaluate(
          ({ mark, cls }) => {
            for (const el of document.querySelectorAll(`[${mark}]`)) {
              el.classList.add(cls);
            }
            void document.body.offsetHeight;
          },
          { mark: MARK, cls: scenario.toggleClass },
        );
      } else if (scenario.mode === "checked") {
        await page.evaluate((mark) => {
          for (const el of document.querySelectorAll(`[${mark}]`)) {
            (el as HTMLInputElement).checked = true;
          }
          void document.body.offsetHeight;
        }, MARK);
      } else {
        await Promise.all(
          nodeIds.map((nodeId) =>
            cdp.send("CSS.forcePseudoState", {
              nodeId,
              forcedPseudoClasses: ["hover"],
            }),
          ),
        );
        await page.evaluate(() => void document.body.offsetHeight);
      }
    }

    async function backward(): Promise<void> {
      if (scenario.mode === "class") {
        await page.evaluate(
          ({ mark, cls }) => {
            for (const el of document.querySelectorAll(`[${mark}]`)) {
              el.classList.remove(cls);
            }
            void document.body.offsetHeight;
          },
          { mark: MARK, cls: scenario.toggleClass },
        );
      } else if (scenario.mode === "checked") {
        await page.evaluate((mark) => {
          for (const el of document.querySelectorAll(`[${mark}]`)) {
            (el as HTMLInputElement).checked = false;
          }
          void document.body.offsetHeight;
        }, MARK);
      } else {
        await Promise.all(
          nodeIds.map((nodeId) =>
            cdp.send("CSS.forcePseudoState", {
              nodeId,
              forcedPseudoClasses: [],
            }),
          ),
        );
        await page.evaluate(() => void document.body.offsetHeight);
      }
    }

    // Warmup: let selector/style caches settle before timed runs.
    for (let i = 0; i < 3; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential by design
      await forward();
      await backward();
    }

    const samples: Record<MetricName, number[]> = {
      RecalcStyleDuration: [],
      LayoutDuration: [],
      RecalcStyleCount: [],
      LayoutCount: [],
    };

    for (let i = 0; i < RUNS; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: sequential by design
      const before = await getMetrics();
      await forward();
      const after = await getMetrics();
      for (const m of METRICS) samples[m].push(after[m] - before[m]);
      await backward();
    }

    console.log(`${RUNS} timed runs (median, IQR):`);
    for (const m of METRICS) {
      const xs = samples[m];
      console.log(
        `  ${m}: median=${median(xs).toFixed(6)}  iqr=${iqr(xs).toFixed(6)}  min=${Math.min(...xs).toFixed(6)}  max=${Math.max(...xs).toFixed(6)}`,
      );
    }
  } finally {
    await browser.close();
    server?.kill();
  }
}

if (import.meta.main) {
  await main();
}
