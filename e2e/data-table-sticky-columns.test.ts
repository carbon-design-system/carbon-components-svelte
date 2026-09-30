import { expect, test } from "@playwright/test";

const SCROLLER = ".bx--data-table-content";

test.describe("DataTable sticky columns", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-table-sticky-columns.html");
    await expect(page.locator("tbody tr")).toHaveCount(4);
  });

  test("keeps sticky cells in place while scrolling horizontally", async ({
    page,
  }) => {
    const lefts = () =>
      page.evaluate(() =>
        [
          "tbody tr:first-child td:nth-child(1)",
          "tbody tr:first-child td:nth-child(2)",
          "tbody tr:first-child td:nth-child(3)",
          "tbody tr:first-child td:nth-child(4)",
          "tbody tr:first-child td:last-child",
        ].map((selector) => {
          const rect = document
            .querySelector(selector)
            ?.getBoundingClientRect();
          return rect ? { left: rect.left, right: rect.right } : null;
        }),
      );

    const before = await lefts();
    const scroller = page.locator(SCROLLER);
    await scroller.evaluate((el) => {
      el.scrollLeft = 400;
    });
    await expect
      .poll(() => scroller.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
    const after = await lefts();

    // Checkbox and both start columns stay at their left edge.
    for (const i of [0, 1, 2]) {
      expect(after[i]?.left).toBeCloseTo(before[i]?.left ?? 0, 0);
    }
    // A non-sticky column scrolled away.
    expect(after[3]?.left).toBeLessThan(before[3]?.left ?? 0);
    // The last column stays pinned to the right edge of the container.
    expect(after[4]?.right).toBeCloseTo(before[4]?.right ?? 0, 0);
  });

  test("stacks the second start column after the checkbox and first column", async ({
    page,
  }) => {
    const { checkbox, first, secondLeft } = await page.evaluate(() => {
      const [a, b, c] = Array.from(
        document.querySelectorAll<HTMLElement>("tbody tr:first-child td"),
      );
      return {
        checkbox: a.getBoundingClientRect().width,
        first: b.getBoundingClientRect().width,
        secondLeft: Number.parseFloat(c.style.left),
      };
    });

    expect(secondLeft).toBeCloseTo(checkbox + first, 0);
  });

  test("keeps an opaque sticky background on hover and selection", async ({
    page,
  }) => {
    const background = (row: number) =>
      page
        .locator(`tbody tr:nth-child(${row}) td:nth-child(2)`)
        .evaluate((el) => getComputedStyle(el).backgroundColor);

    // Row 2 is selected by default.
    expect(await background(2)).not.toBe("rgba(0, 0, 0, 0)");

    await page.locator("tbody tr:nth-child(1)").hover();
    expect(await background(1)).not.toBe("rgba(0, 0, 0, 0)");
  });
});
