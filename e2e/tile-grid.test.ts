import { expect, test } from "./helpers/host";

test.describe("TileGrid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tile-grid.html");
    await page.evaluate(() => document.fonts.ready);
  });

  test("has one tab stop and moves by layout with the arrow keys", async ({
    page,
  }) => {
    const grid = page.getByTestId("tile-grid");
    const tiles = grid.getByRole("button");
    await expect(grid.locator('[tabindex="0"]')).toHaveCount(1);

    await page.keyboard.press("Tab");
    await expect(tiles.first()).toBeFocused();

    // The tile below the first shares its column, whatever the width.
    await page.keyboard.press("ArrowDown");
    const [first, below] = await page.evaluate(() => {
      const first = document.querySelector(".bx--tile-grid__tile");
      const focused = document.activeElement;
      return [first, focused].map((el) => {
        const rect = (el as Element).getBoundingClientRect();
        return { left: rect.left, top: rect.top };
      });
    });
    expect(below.left).toBe(first.left);
    expect(below.top).toBeGreaterThan(first.top);
    await expect(grid.locator('[tabindex="0"]')).toHaveCount(1);

    await page.keyboard.press("ArrowUp");
    await expect(tiles.first()).toBeFocused();
    // The first row has no row above it.
    await page.keyboard.press("ArrowUp");
    await expect(tiles.first()).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(tiles.nth(1)).toBeFocused();
    await page.keyboard.press("End");
    await expect(tiles.last()).toBeFocused();
    await page.keyboard.press("Home");
    await expect(tiles.first()).toBeFocused();

    // Tab leaves the grid from any tile, and Shift+Tab comes back to the
    // tile that had focus.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Tab");
    await expect(grid.locator(":focus")).toHaveCount(0);
    await page.keyboard.press("Shift+Tab");
    await expect(tiles.nth(1)).toBeFocused();
  });

  test("swaps Left and Right in right-to-left layouts", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const tiles = page.getByTestId("tile-grid").getByRole("button");
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowLeft");
    await expect(tiles.nth(1)).toBeFocused();
  });

  test("dispatches click:tile on Enter", async ({ page }) => {
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("clicked")).toHaveText("Archive");
  });

  test("keeps every tile the same size and clamps long labels", async ({
    page,
  }) => {
    const sizes = await page
      .getByTestId("tile-grid")
      .locator(".bx--tile-grid__tile")
      .evaluateAll((tiles) =>
        tiles.map((tile) => {
          const { width, height } = tile.getBoundingClientRect();
          return `${width}x${height}`;
        }),
      );
    expect(sizes.length).toBeGreaterThan(1);
    expect(new Set(sizes).size).toBe(1);

    const label = page
      .getByTestId("tile-grid")
      .getByRole("button", { name: /Cloud Satellite/ })
      .locator(".bx--tile-grid__label-text");
    const clamped = await label.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(clamped).toBe(true);
  });

  test("stays one tab stop across groups and moves between them by layout", async ({
    page,
  }) => {
    const grid = page.getByTestId("grouped-grid");
    await expect(grid.locator('[tabindex="0"]')).toHaveCount(1);
    const objects = page.getByRole("list", { name: "Objects" });
    const actions = page.getByRole("list", { name: "Actions" });

    // The last row of the first group goes down into the second group.
    await actions.getByRole("button").first().focus();
    const lastRowTop = await actions
      .getByRole("button")
      .last()
      .evaluate((tile) => tile.getBoundingClientRect().top);
    await actions.getByRole("button").last().focus();
    await page.keyboard.press("ArrowDown");
    const focused = page.locator(":focus");
    await expect(objects.locator(":focus")).toHaveCount(1);
    expect(
      await focused.evaluate((tile) => tile.getBoundingClientRect().top),
    ).toBeGreaterThan(lastRowTop);
    await expect(grid.locator('[tabindex="0"]')).toHaveCount(1);
  });

  test("ends every label at the same distance from the tile's bottom", async ({
    page,
  }) => {
    const gaps = await page
      .getByTestId("grouped-grid")
      .locator(".bx--tile-grid__tile")
      .evaluateAll((tiles) =>
        tiles.map((tile) => {
          const text = tile.querySelector(".bx--tile-grid__label-text");
          return Math.round(
            tile.getBoundingClientRect().bottom -
              (text as Element).getBoundingClientRect().bottom,
          );
        }),
      );
    // One-line and two-line labels both.
    expect(gaps.length).toBeGreaterThan(10);
    expect(new Set(gaps).size).toBe(1);
  });

  test("keeps tiles square and centers the label", async ({ page }) => {
    const tile = page
      .getByTestId("grouped-grid")
      .locator(".bx--tile-grid__tile")
      .first();
    const box = await tile.boundingBox();
    expect(box?.width).toBeCloseTo(box?.height ?? 0, 0);
    await expect(tile.locator(".bx--tile-grid__label")).toHaveCSS(
      "text-align",
      "center",
    );
  });

  test("stretches cover media to the tile's edges", async ({ page }) => {
    const tile = page
      .getByTestId("cover-grid")
      .locator(".bx--tile-grid__tile")
      .first();
    const [tileBox, imageBox] = await Promise.all([
      tile.boundingBox(),
      tile.locator("img").boundingBox(),
    ]);
    expect(imageBox?.x).toBe(tileBox?.x);
    expect(imageBox?.y).toBe(tileBox?.y);
    expect(imageBox?.width).toBe(tileBox?.width);
  });

  test("renders the empty slot with no items", async ({ page }) => {
    await expect(page.getByTestId("empty")).toBeVisible();
  });
});
