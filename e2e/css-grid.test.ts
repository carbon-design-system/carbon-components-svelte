import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Where each column sits on its grid's tracks, counted from the inline
// start: the first grid line it covers and how many tracks it spans. Under
// `dir="rtl"` the count starts at the right edge, so a mirrored grid reads
// the same as LTR.

type Placement = { start: number; span: number; gutter: number } | null;

const COLUMNS = {
  offset: "grid",
  percent: "grid",
  full: "grid",
  hidden: "grid",
  host: "grid",
  sub: "grid",
  "narrow-col": "narrow",
};

function placements(page: Page) {
  return page.evaluate((columns) => {
    const result: Record<string, Placement> = {};
    for (const [column, grid] of Object.entries(columns)) {
      const col = document.querySelector(`[data-testid="${column}"]`);
      const gridNode = document.querySelector(`[data-testid="${grid}"]`);
      if (!(col instanceof HTMLElement) || !(gridNode instanceof HTMLElement))
        continue;
      if (getComputedStyle(col).display === "none") {
        result[column] = null;
        continue;
      }
      const rtl = getComputedStyle(gridNode).direction === "rtl";
      const style = getComputedStyle(gridNode);
      const tracks = style.gridTemplateColumns
        .split(" ")
        .map(Number.parseFloat);
      const g = gridNode.getBoundingClientRect();
      const box = col.getBoundingClientRect();
      const contentStart = rtl
        ? g.right - Number.parseFloat(style.paddingRight)
        : g.left + Number.parseFloat(style.paddingLeft);
      // Distance from the grid's inline start to the column's outer edge,
      // gutter included.
      const marginStart = Number.parseFloat(
        getComputedStyle(col)[rtl ? "marginRight" : "marginLeft"],
      );
      const marginEnd = Number.parseFloat(
        getComputedStyle(col)[rtl ? "marginLeft" : "marginRight"],
      );
      const offset = rtl
        ? contentStart - box.right - marginStart
        : box.left - marginStart - contentStart;
      const width = box.width + marginStart + marginEnd;
      const track = tracks[0];
      result[column] = {
        start: Math.round(offset / track) + 1,
        span: Math.round(width / track),
        gutter: Math.round(marginStart),
      };
    }
    return result;
  }, COLUMNS);
}

const VIEWPORTS = {
  sm: {
    width: 400,
    expected: {
      offset: { start: 1, span: 2, gutter: 16 },
      percent: { start: 3, span: 2, gutter: 16 },
      full: { start: 1, span: 4, gutter: 16 },
      hidden: null,
      host: { start: 1, span: 4, gutter: 16 },
      sub: { start: 1, span: 2, gutter: 16 },
      "narrow-col": { start: 1, span: 2, gutter: 0 },
    },
  },
  md: {
    width: 800,
    expected: {
      offset: { start: 3, span: 4, gutter: 16 },
      percent: { start: 7, span: 2, gutter: 16 },
      full: { start: 1, span: 8, gutter: 16 },
      hidden: { start: 1, span: 4, gutter: 16 },
      host: { start: 1, span: 8, gutter: 16 },
      sub: { start: 1, span: 2, gutter: 16 },
      "narrow-col": { start: 1, span: 4, gutter: 0 },
    },
  },
  lg: {
    width: 1100,
    expected: {
      offset: { start: 3, span: 4, gutter: 16 },
      percent: { start: 7, span: 4, gutter: 16 },
      full: { start: 1, span: 16, gutter: 16 },
      hidden: { start: 13, span: 4, gutter: 16 },
      host: { start: 1, span: 8, gutter: 16 },
      sub: { start: 1, span: 2, gutter: 16 },
      "narrow-col": { start: 1, span: 4, gutter: 0 },
    },
  },
};

test.describe("CssGrid", () => {
  test("places columns per breakpoint, mirrored in RTL", async ({ page }) => {
    await page.goto("/css-grid.html");

    for (const [name, { width, expected }] of Object.entries(VIEWPORTS)) {
      // biome-ignore lint/performance/noAwaitInLoops: one viewport at a time
      await page.setViewportSize({ width, height: 720 });
      for (const dir of ["ltr", "rtl"]) {
        // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
        await page.evaluate((dir) => {
          document.documentElement.dir = dir;
        }, dir);
        const actual = await placements(page);
        for (const [column, placement] of Object.entries(expected)) {
          expect
            .soft(actual[column], `${name} ${dir} ${column}`)
            .toEqual(placement);
        }
      }
    }
  });
});

// v11's public custom properties, set from each place a consumer might set
// them. A rule in a <style> that comes before the library's stylesheet
// still wins, so the result does not depend on stylesheet order.
const OVERRIDE =
  "--cds-grid-gutter: 3rem; --cds-grid-margin: 2rem; --cds-grid-columns: 12";

const SCOPES = [null, ":root", '[data-testid="wrapper"]', ".my-grid", "style"];

const GRIDS = ["wide-grid", "narrow-grid", "condensed-grid"];

function gutters(page: Page) {
  return page.evaluate((grids) => {
    const style = (testId: string) =>
      getComputedStyle(
        document.querySelector(`[data-testid="${testId}"]`) as Element,
      );
    const tracks = (testId: string) =>
      style(testId).gridTemplateColumns.split(" ").length;
    const inline = (testId: string) =>
      `${style(testId).marginInlineStart} ${style(testId).marginInlineEnd}`;
    return {
      ...Object.fromEntries(
        grids.map((grid) => [
          grid,
          {
            tracks: tracks(grid),
            margin: style(grid).paddingInlineStart,
            gutter: inline(`${grid}-col`),
            hang: style(`${grid}-hang`).marginInlineStart,
            rowGap: style(grid).rowGap,
          },
        ]),
      ),
      subgrid: {
        tracks: tracks("subgrid"),
        pull: inline("subgrid"),
        gutter: inline("subgrid-col"),
        rowGap: style("subgrid").rowGap,
      },
    };
  }, GRIDS);
}

// What each grid should compute for a gutter, a margin and a column count.
// Condensed keeps its 1px gutter and hangs to line up with the wide gutter.
// The subgrid keeps the 4 tracks its column spans.
function expected(gutter: number, margin: number, columns: number) {
  const half = gutter / 2;
  const grid = { tracks: columns, margin: `${margin}px` };
  return {
    "wide-grid": {
      ...grid,
      gutter: `${half}px ${half}px`,
      hang: `${half}px`,
      rowGap: `${gutter}px`,
    },
    "narrow-grid": {
      ...grid,
      gutter: `0px ${half}px`,
      hang: `${half}px`,
      rowGap: `${half}px`,
    },
    "condensed-grid": {
      ...grid,
      gutter: "0.5px 0.5px",
      hang: `${half - 0.5}px`,
      rowGap: "1px",
    },
    subgrid: {
      tracks: 4,
      pull: `-${half}px -${half}px`,
      gutter: `${half}px ${half}px`,
      rowGap: `${gutter}px`,
    },
  };
}

test("CssGrid takes v11's custom properties from any ancestor", async ({
  page,
}) => {
  await page.goto("/css-grid.html");

  for (const scope of SCOPES) {
    // biome-ignore lint/performance/noAwaitInLoops: one scope at a time
    await page.evaluate(
      ({ scope, override, grids }) => {
        document.getElementById("override")?.remove();
        const nodes = grids.map(
          (grid) =>
            document.querySelector(`[data-testid="${grid}"]`) as HTMLElement,
        );
        for (const node of nodes) {
          node.classList.toggle("my-grid", scope === ".my-grid");
          node.style.cssText = scope === "style" ? override : "";
        }
        if (scope === null || scope === "style") return;
        const style = document.createElement("style");
        style.id = "override";
        style.textContent = `${scope} { ${override} }`;
        document.head.prepend(style);
      },
      { scope, override: OVERRIDE, grids: GRIDS },
    );

    for (const [name, { width }] of Object.entries(VIEWPORTS)) {
      // biome-ignore lint/performance/noAwaitInLoops: one viewport at a time
      await page.setViewportSize({ width, height: 720 });
      const defaults = {
        sm: expected(32, 0, 4),
        md: expected(32, 16, 8),
        lg: expected(32, 16, 16),
      }[name];
      expect
        .soft(await gutters(page), `${scope ?? "default"} ${name}`)
        .toEqual(scope === null ? defaults : expected(48, 32, 12));
    }
  }
});

test("CssColumn aligns itself in a row of mixed heights", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 720 });
  await page.goto("/css-grid.html");

  for (const dir of ["ltr", "rtl"]) {
    // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
    const rows = await page.evaluate((dir) => {
      document.documentElement.dir = dir;
      const box = (name: string) =>
        (
          document.querySelector(`[data-testid="align-${name}"]`) as Element
        ).getBoundingClientRect();
      const row = box("tall");
      const columns = ["default", "start", "center", "end", "stretch"];
      return {
        // The default column is the second one from the inline start.
        afterTall:
          dir === "rtl"
            ? box("default").right <= row.left
            : box("default").left >= row.right,
        ...Object.fromEntries(
          columns.map((name) => {
            const b = box(name);
            return [
              name,
              {
                top: Math.round(b.top - row.top),
                middle: Math.round((b.top + b.bottom) / 2 - row.top),
                bottom: Math.round(b.bottom - row.top),
              },
            ];
          }),
        ),
      };
    }, dir);

    // The tall column is 160px. A short column is one line of text.
    const line = rows.start.bottom;
    expect.soft(line, dir).toBeLessThan(160);
    expect.soft(rows, dir).toEqual({
      afterTall: true,
      default: { top: 0, middle: 80, bottom: 160 },
      start: { top: 0, middle: Math.round(line / 2), bottom: line },
      center: {
        top: Math.round(80 - line / 2),
        middle: 80,
        bottom: Math.round(80 + line / 2),
      },
      end: { top: 160 - line, middle: Math.round(160 - line / 2), bottom: 160 },
      stretch: { top: 0, middle: 80, bottom: 160 },
    });
  }
});
