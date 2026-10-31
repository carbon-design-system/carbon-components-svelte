import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// One tooltip clock for every chart: a pointer rests before it shows, the
// next item swaps at once, the gap between items never flickers it, and a
// pointer back soon after it hid does not wait again.

async function center(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("no box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Move in small steps, sampling whether the tooltip is visible after each. */
async function glide(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  tooltip: Locator,
  steps = 12,
) {
  const seen: boolean[] = [];
  for (let i = 1; i <= steps; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: a step has to land before the next is sampled
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    );
    await page.waitForTimeout(16);
    seen.push(await tooltip.isVisible());
  }
  return seen;
}

test.describe("viz tooltip timing", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    // Tall enough that every chart is on screen for the mouse.
    await page.setViewportSize({ width: 1000, height: 1400 });
    await page.goto("/viz-tooltip.html");
    await expect(page.locator("figure")).toHaveCount(4);
    await page.mouse.move(0, 0);
  });

  test("tiles: rest to show, swap at once across the gap, hide after leaving, instant when back soon", async ({
    page,
  }) => {
    const tiles = page.locator("figure").first();
    const tooltip = tiles.locator(".bx--viz-chart-tooltip");
    const tile = (id: string) =>
      tiles.locator(".bx--viz-tile-map__tile", { hasText: id }).first();
    const ca = await center(tile("CA"));
    const ut = await center(tile("UT"));

    // Rest: not yet at 60 ms, there by 400 ms.
    await page.mouse.move(ca.x, ca.y);
    await page.waitForTimeout(60);
    expect(await tooltip.isVisible()).toBe(false);
    await expect(tooltip).toBeVisible({ timeout: 400 });
    await expect(tooltip).toContainText("California");

    // Across the gap to the neighbor: visible at every sample.
    const seen = await glide(page, ca, ut, tooltip);
    expect(seen.every(Boolean), seen.join(",")).toBe(true);
    await expect(tooltip).toContainText("Utah");

    // Off to the margin: still there for a moment, then gone.
    await page.mouse.move(8, 8);
    await page.waitForTimeout(40);
    expect(await tooltip.isVisible()).toBe(true);
    await expect(tooltip).toBeHidden({ timeout: 400 });

    // Back within the warm window: no wait this time.
    await page.mouse.move(ut.x, ut.y);
    await page.waitForTimeout(40);
    expect(await tooltip.isVisible()).toBe(true);
  });

  test("bars: leaving the plot keeps the tooltip across the edge and back", async ({
    page,
  }) => {
    const bars = page.locator("figure").nth(1);
    const tooltip = bars.locator(".bx--viz-chart-tooltip");
    const plot = bars.locator(".bx--viz-chart__svg");
    const box = await plot.boundingBox();
    if (!box) throw new Error("no plot");
    const inside = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
    const outside = { x: box.x + box.width * 0.5, y: box.y - 24 };

    await page.mouse.move(inside.x, inside.y);
    await page.waitForTimeout(60);
    expect(await tooltip.isVisible()).toBe(false);
    await expect(tooltip).toBeVisible({ timeout: 400 });

    // Out over the top edge: the grace holds it; straight back: it stays,
    // and no stale timer hides it later.
    await page.mouse.move(outside.x, outside.y);
    await page.waitForTimeout(40);
    expect(await tooltip.isVisible()).toBe(true);
    await page.mouse.move(inside.x, inside.y);
    await page.waitForTimeout(20);
    expect(await tooltip.isVisible()).toBe(true);
    await page.waitForTimeout(250);
    expect(await tooltip.isVisible()).toBe(true);

    // Away for good.
    await page.mouse.move(outside.x, outside.y);
    await expect(tooltip).toBeHidden({ timeout: 400 });
  });

  test("synced charts: a follower's tooltip never shows before the source's", async ({
    page,
  }) => {
    const a = page.locator("figure").nth(2);
    const b = page.locator("figure").nth(3);
    const tipA = a.locator(".bx--viz-chart-tooltip");
    const tipB = b.locator(".bx--viz-chart-tooltip");
    const box = await a.locator(".bx--viz-chart__svg").boundingBox();
    if (!box) throw new Error("no plot");
    const inside = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };

    // In and straight out: the follower's ruler moved, no tooltip anywhere.
    await page.mouse.move(inside.x, inside.y);
    await page.waitForTimeout(30);
    expect(await tipB.isVisible()).toBe(false);
    await page.mouse.move(8, 8);
    const seen: boolean[] = [];
    for (let i = 0; i < 20; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: samples in order
      await page.waitForTimeout(16);
      seen.push((await tipA.isVisible()) || (await tipB.isVisible()));
    }
    expect(seen.some(Boolean), seen.join(",")).toBe(false);

    // A pointer that rests: both tooltips, together.
    await page.mouse.move(inside.x, inside.y);
    await page.waitForTimeout(60);
    expect(await tipB.isVisible()).toBe(false);
    await expect(tipA).toBeVisible({ timeout: 400 });
    await expect(tipB).toBeVisible({ timeout: 100 });
  });
});
