import { expect, test } from "./helpers/host";

test("a small Tag in a cell keeps every row size", async ({ page }) => {
  await page.goto("/data-table-tag.html");
  await page.evaluate(() => document.fonts.ready);

  const sizes = { compact: 24, short: 32, medium: 40, default: 48, tall: 64 };
  for (const [size, height] of Object.entries(sizes)) {
    // biome-ignore lint/performance/noAwaitInLoops: reads one table at a time
    const rows = await page
      .getByTestId(size)
      .locator("tbody tr")
      .evaluateAll((trs) =>
        trs.map((tr) => {
          const tag = tr.querySelector(".bx--tag")?.getBoundingClientRect();
          const text = document.createRange();
          text.selectNodeContents(tr.cells[0]);
          const line = text.getBoundingClientRect();
          return {
            height: tr.getBoundingClientRect().height,
            // The tag's center minus the text's center in the same row.
            offset: tag
              ? tag.top + tag.height / 2 - (line.top + line.height / 2)
              : Number.NaN,
          };
        }),
      );
    expect.soft(rows.length, size).toBe(2);
    for (const row of rows) {
      expect.soft(row.height, size).toBe(height);
      expect.soft(Math.abs(row.offset), size).toBeLessThanOrEqual(0.5);
    }
  }
});
