// The sweep opens every fixture page, so it depends on all of them.
// @depends-on e2e/fixtures/*.html
// @reads e2e/layout-sweep.baseline.json
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { findLayoutProblems, type LayoutFinding } from "./helpers/layout";

/**
 * Runs the page-wide layout checks on every fixture page and compares what
 * they find with `layout-sweep.baseline.json`. A finding the baseline does
 * not list fails, and so does a baseline entry that no longer occurs. Set
 * LAYOUT_SWEEP_UPDATE=1 to rewrite the baseline entries of the fixtures
 * that run. See "Layout sweep" in CONTRIBUTING.md.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, "layout-sweep.baseline.json");
const UPDATE = !!process.env.LAYOUT_SWEEP_UPDATE;

/** Pages that are not fixtures to sweep. */
const SKIP_PAGES: Record<string, string> = {
  "host.html": "the shared host page, with no fixture of its own",
  "index.html": "a list of links to the fixtures",
  "layout-checks.html": "the layout helpers' own failing cases",
};

type Check = Parameters<typeof findLayoutProblems>[1];

/**
 * Each fixture is mounted again for each variant, so a component that
 * measures itself on mount sees the width it is checked at.
 */
const VARIANTS: {
  name: string;
  width: number;
  forcedColors?: boolean;
  checks: Check[];
}[] = [
  { name: "1280", width: 1280, checks: ["overflow", "borders", "fits"] },
  { name: "672", width: 672, checks: ["overflow", "borders", "fits"] },
  { name: "320", width: 320, checks: ["overflow", "borders", "fits"] },
  // Forced colors repaint transparent outlines and borders, which can nest
  // edges or add rings. Text and page width do not change.
  {
    name: "1280-forced",
    width: 1280,
    forcedColors: true,
    checks: ["borders", "ring"],
  },
];

const HEIGHT = 720;

/**
 * `expectSingleRing` holds for a group of items, such as the tabs of a
 * tablist, where a ring on every item hides which one is current. Across
 * a whole page it would count one ring per widget, so the sweep passes
 * every composite widget, and the check counts each one on its own.
 */
const RING_GROUPS =
  "[role=listbox], [role=grid], [role=treegrid], [role=tree], [role=tablist], [role=menu], [role=menubar], [role=radiogroup]";

interface Entry extends LayoutFinding {
  fixture: string;
  variant: string;
}

/**
 * Findings that come and go between runs of the same code, or between
 * Linux (CI) and macOS. Each is left out of the comparison and the
 * baseline; keep the reason next to it.
 */
const UNSTABLE: (Partial<Omit<Entry, "message">> & { reason: string })[] = [
  {
    fixture: "date-picker.html",
    check: "fits",
    kind: "cuts a number",
    reason: "the 'multiple' value stops inside a date on Linux only",
  },
  {
    fixture: "form-reset.html",
    variant: "320",
    check: "overflow",
    kind: "scrolls sideways",
    reason: "a 320px line of text measures 323px on Linux, 320px on macOS",
  },
  {
    fixture: "form-reset.html",
    variant: "320",
    check: "fits",
    path: 'p[data-testid="bound"]',
    reason: "a 320px line of text measures 323px on Linux, 320px on macOS",
  },
];

const keyOf = (e: Omit<Entry, "message">) =>
  [e.fixture, e.variant, e.check, e.kind, e.path].join(" | ");

const unstable = (e: Entry) =>
  UNSTABLE.some(({ reason: _, ...match }) =>
    Object.entries(match).every(
      ([field, value]) => e[field as keyof Entry] === value,
    ),
  );

function readBaseline(): Entry[] {
  if (!existsSync(BASELINE)) return [];
  return JSON.parse(readFileSync(BASELINE, "utf8"));
}

const fixtures = readdirSync(join(HERE, "fixtures"))
  .filter((file) => file.endsWith(".html") && !(file in SKIP_PAGES))
  .sort();

/**
 * Opens a fixture page. bivium reads only literal URLs, and `@depends-on`
 * at the top of the file already names every page this opens.
 */
function open(page: Page, fixture: string) {
  const navigate = page.goto.bind(page);
  return navigate(`/${fixture}`);
}

/**
 * Waits two frames and the fonts, then ends each running animation and
 * transition, and stops looping ones at their start, so a spinner or a
 * fade measures the same on every run. The fonts are awaited after the
 * frames: a face loads only once a layout asks for it, so before then
 * `document.fonts.ready` resolves at once, and a page measured in the
 * fallback font or in IBM Plex depending on which fixture ran before it.
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    await frame();
    await frame();
    await document.fonts.ready;
    for (const animation of document.getAnimations()) {
      try {
        if (
          animation.effect?.getComputedTiming().endTime ===
          Number.POSITIVE_INFINITY
        ) {
          animation.pause();
          animation.currentTime = 0;
        } else animation.finish();
      } catch {}
    }
    await frame();
    await document.fonts.ready;
  });
}

/** Runs one check on the page; `ring` counts each composite on its own. */
function find(page: Page, check: Check) {
  return findLayoutProblems(
    check === "ring" ? page.locator(RING_GROUPS) : page,
    check,
  );
}

test.describe("layout sweep", () => {
  test.beforeAll(({ browserName }, testInfo) => {
    test.skip(browserName !== "chromium", "the baseline is Chromium's");
    if (UPDATE && testInfo.config.workers !== 1)
      throw new Error("LAYOUT_SWEEP_UPDATE needs --workers=1");
  });

  for (const fixture of fixtures) {
    test(fixture, async ({ page }) => {
      const found = new Map<string, Entry>();
      for (const variant of VARIANTS) {
        // biome-ignore lint/performance/noAwaitInLoops: one page, one variant at a time
        await page.setViewportSize({ width: variant.width, height: HEIGHT });
        await page.emulateMedia({
          forcedColors: variant.forcedColors ? "active" : "none",
        });
        await open(page, fixture);
        await settle(page);
        for (const check of variant.checks) {
          for (const finding of await find(page, check)) {
            const entry = { fixture, variant: variant.name, ...finding };
            if (!(unstable(entry) || found.has(keyOf(entry))))
              found.set(keyOf(entry), entry);
          }
        }
      }

      const baseline = readBaseline();
      if (UPDATE) {
        const entries = [
          ...baseline.filter((e) => e.fixture !== fixture),
          ...found.values(),
        ].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
        writeFileSync(BASELINE, `${JSON.stringify(entries, null, 2)}\n`);
        return;
      }

      const known = new Map(
        baseline
          .filter((e) => e.fixture === fixture && !unstable(e))
          .map((e) => [keyOf(e), e]),
      );
      const fresh = [...found.values()].filter((e) => !known.has(keyOf(e)));
      const gone = [...known.values()].filter((e) => !found.has(keyOf(e)));
      const lines = [
        ...(fresh.length
          ? [
              `${fresh.length} new layout finding(s). Fix them, or, for an intended design, update the baseline and give the reason in the PR:`,
              ...fresh.map((e) => `  ${keyOf(e)}\n    ${e.message}`),
            ]
          : []),
        ...(gone.length
          ? [
              `${gone.length} baseline finding(s) no longer occur. Update the baseline to drop them, so they cannot come back:`,
              ...gone.map((e) => `  ${keyOf(e)}`),
            ]
          : []),
      ];
      if (lines.length)
        lines.push(
          `Update: LAYOUT_SWEEP_UPDATE=1 bunx playwright test e2e/layout-sweep.test.ts --project=chromium --workers=1 --grep "sweep ${fixture}$"`,
        );
      expect(lines.join("\n"), "layout findings match the baseline").toBe("");
    });
  }
});
