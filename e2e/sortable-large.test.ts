import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("missing box");
  return rect;
}

/** Press on the first handle, then hold the pointer near a scroller's bottom. */
async function holdAtBottomEdge(page: Page, scroller: Locator) {
  const area = await box(scroller);
  const handle = scroller.getByRole("button").first();
  const grip = await box(handle);
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + 6, grip.y + 30, { steps: 3 });
  await page.mouse.move(grip.x + 6, area.y + area.height - 6, { steps: 6 });
  return area;
}

test.describe("sortable at scale", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sortable-large.html");
  });

  test("moves the first of 1,000 rows to the end by keyboard", async ({
    page,
  }) => {
    const list = page.getByTestId("plain");
    const scroller = page.getByTestId("plain-scroller");

    await list.getByRole("button").first().focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("End");
    await expect(page.getByRole("status")).toHaveText(
      "Row 1 moved to position 1000 of 1000.",
    );
    await expect(page.locator(".bx--sortable__indicator")).toBeVisible();
    expect(
      await scroller.evaluate((el) => el.scrollTop + el.clientHeight),
    ).toBeGreaterThan(39000);
    await page.keyboard.press("Space");

    await expect(page.getByTestId("log")).toHaveText("plain 0>999");
    await expect(page.getByTestId("plain-first")).toHaveText(
      "Row 2,Row 3,Row 4",
    );
    await expect(list.getByRole("button").nth(999)).toBeFocused();
  });

  test("scrolls while a pointer holds near the edge, then drops", async ({
    page,
  }) => {
    const scroller = page.getByTestId("plain-scroller");

    await holdAtBottomEdge(page, scroller);
    await expect
      .poll(() => scroller.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(400);
    await page.mouse.up();

    const moved = await page.getByTestId("log").textContent();
    expect(moved).toMatch(/^plain 0>\d+$/);
    expect(Number(moved?.split(">")[1])).toBeGreaterThan(10);
  });
});

test.describe("sortable in a windowed list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sortable-large.html");
  });

  test("reads the index from aria-posinset, not the DOM", async ({ page }) => {
    const scroller = page.getByTestId("windowed");
    const rows = scroller.locator(".bx--contained-list-item");
    expect(await rows.count()).toBeLessThan(30);

    await scroller.evaluate((el) => {
      el.scrollTop = 20000;
    });
    await expect(scroller.getByText("Row 426", { exact: true })).toBeVisible();

    const handle = rows.nth(2).getByRole("button");
    await handle.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toContainText("of 1000.");
    const announced = (await page.getByRole("status").textContent()) ?? "";
    expect(Number(announced.match(/position (\d+) of/)?.[1])).toBeGreaterThan(
      400,
    );
    await page.keyboard.press("Escape");
  });

  test("keyboard moves far past the window and settles the focus", async ({
    page,
  }) => {
    const scroller = page.getByTestId("windowed");
    const handle = scroller.getByRole("button").first();

    await handle.focus();
    await page.keyboard.press("Space");
    // biome-ignore lint/performance/noAwaitInLoops: key presses are ordered
    for (let step = 0; step < 6; step++) await page.keyboard.press("PageDown");
    await expect(page.getByRole("status")).toContainText("position 61 of 1000");
    await expect(page.locator(".bx--sortable__indicator")).toBeVisible();
    await page.keyboard.press("Space");

    await expect(page.getByTestId("log")).toHaveText("windowed 0>60");
    await expect(page.getByTestId("windowed-first")).toHaveText(
      "Row 2,Row 3,Row 4",
    );
    await expect(
      scroller.locator('[aria-posinset="61"]').getByRole("button"),
    ).toBeFocused();
  });

  test("auto-scrolls the window and drops far below", async ({ page }) => {
    const scroller = page.getByTestId("windowed");

    await holdAtBottomEdge(page, scroller);
    await expect
      .poll(() => scroller.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(400);
    await page.mouse.up();

    const moved = await page.getByTestId("log").textContent();
    expect(Number(moved?.split(">")[1])).toBeGreaterThan(10);
  });
});
