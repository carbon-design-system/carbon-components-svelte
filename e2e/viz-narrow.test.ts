import { expect, test } from "@playwright/test";

// Charts lay out by their container: nothing spills past a narrow box, and
// a legend with many series folds behind a "more" button instead of
// taking the plot's height.
test("viz charts fit a narrow container and fold long legends", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/viz-narrow.html");
  await expect(page.locator("figure")).toHaveCount(16);

  for (const width of [240, 320, 390, 480]) {
    const box = page.getByTestId(`box-${width}`);
    // biome-ignore lint/performance/noAwaitInLoops: one box at a time
    const spills = await box.evaluate((el) =>
      [...el.querySelectorAll("figure")].map((figure) => ({
        title: figure
          .querySelector("figcaption, .bx--viz-chart__title")
          ?.textContent?.trim(),
        overflow: figure.scrollWidth - figure.clientWidth,
        outside:
          Math.round(figure.getBoundingClientRect().right) -
          Math.round(el.getBoundingClientRect().right),
      })),
    );
    for (const s of spills) {
      expect
        .soft(s.overflow, `${width}px: ${s.title} does not scroll`)
        .toBeLessThanOrEqual(0);
      expect
        .soft(s.outside, `${width}px: ${s.title} inside its box`)
        .toBeLessThanOrEqual(0);
    }
    // Fourteen series fold to eight and a button: five rows at most, even
    // where two labels fit a row.
    const legend = box.locator(".bx--viz-legend").first();
    await expect(legend.locator(".bx--viz-legend__more")).toHaveText("+6 more");
    expect
      .soft(
        await legend.evaluate((el) => el.getBoundingClientRect().height),
        `${width}px: legend folded`,
      )
      .toBeLessThanOrEqual(100);
  }

  const legend = page.getByTestId("box-480").locator(".bx--viz-legend").first();
  await legend.locator(".bx--viz-legend__more").click();
  await expect(
    legend.locator(".bx--viz-legend__item:not(.bx--viz-legend__more)"),
  ).toHaveCount(14);
  await expect(legend.locator(".bx--viz-legend__more")).toHaveText("Show less");
});
