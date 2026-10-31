import { expect, test } from "@playwright/test";

// A chart keeps one box across its data, loading, and empty states, so a
// dashboard does not move when data arrives or goes. Charts sized by their
// props hold the whole box; charts whose height follows the rows (Gantt,
// Heatmap, LayeredGraph) hold the width and fall back to the state floor.
const FIXED = new Set(["Line", "Donut", "Treemap", "Sunburst"]);

test("every viz chart has the same box in its data, loading, and empty states", async ({
  page,
}) => {
  // Twenty-one charts compile on the first visit of the dev server.
  test.setTimeout(120_000);
  await page.goto("/viz-states.html");
  await expect(page.locator("figure")).toHaveCount(21);
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll("[data-state]")].map((column) =>
      [...column.querySelectorAll(":scope > figure")].map((figure) => {
        const rect = figure.getBoundingClientRect();
        return {
          title:
            figure.getAttribute("aria-label") ??
            figure
              .querySelector("figcaption, .bx--viz-chart__title")
              ?.textContent?.trim() ??
            "",
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }),
    ),
  );
  const [data, loading, empty] = sizes;
  expect(data.map((s) => s.title)).toEqual([
    "Line",
    "Donut",
    "Treemap",
    "Gantt",
    "Heatmap",
    "Sunburst",
    "Graph",
  ]);
  for (let i = 0; i < data.length; i++) {
    const expected = FIXED.has(data[i].title)
      ? data[i]
      : {
          title: data[i].title,
          width: data[i].width,
          height: expect.any(Number),
        };
    expect({ loading: loading[i], empty: empty[i] }).toEqual({
      loading: expected,
      empty: expected,
    });
  }
});
