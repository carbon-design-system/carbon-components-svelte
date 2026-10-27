import { expect, test } from "./helpers/host";

/**
 * The empty row's cell drops its table size's vertical padding, so an
 * EmptyState in the `empty` slot has its own padding above and below it in
 * every size. `tall` cells pad 16px at the top and align to it, which put
 * twice the space above the illustration as below the button.
 */
const sizes = ["compact", "short", "medium", "default", "tall"];

// Every case only reads layout, so the fixture loads once for all of them.
test("spaces the empty state evenly in every table size", async ({ page }) => {
  await page.goto("/data-table-empty.html");
  await page.evaluate(() => document.fonts.ready);

  for (const size of sizes) {
    const cell = page.getByTestId(`empty-${size}`).locator("td");
    // biome-ignore lint/performance/noAwaitInLoops: reads one table at a time
    const cellBox = await cell.boundingBox();
    const art = await cell
      .locator(".bx--empty-state__illustration svg")
      .boundingBox();
    const button = await cell.getByRole("button").boundingBox();
    expect.soft(cellBox && art && button, `${size} rendered`).toBeTruthy();
    if (!cellBox || !art || !button) continue;

    const above = art.y - cellBox.y;
    const below = cellBox.y + cellBox.height - (button.y + button.height);
    expect
      .soft(Math.abs(above - below), `${size}: ${above} above, ${below} below`)
      .toBeLessThanOrEqual(1);
  }
});
