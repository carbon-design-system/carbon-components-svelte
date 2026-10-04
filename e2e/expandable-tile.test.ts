import { expect, test } from "@playwright/test";

test.describe("ExpandableTile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/expandable-tile.html");
  });

  test("renders above-the-fold content", async ({ page }) => {
    await expect(page.getByTestId("above-fold")).toHaveText("Above the fold");
    await expect(page.getByTestId("above-fold")).toBeVisible();
  });

  test("expands on click to show below-the-fold content", async ({ page }) => {
    await page.getByTestId("expandable-tile").click();

    await expect(page.getByTestId("below-fold")).toBeVisible();
    await expect(page.getByTestId("below-fold")).toHaveText("Below the fold");
  });

  test("collapses on second click", async ({ page }) => {
    await page.getByTestId("expandable-tile").click();
    await expect(page.getByTestId("below-fold")).toBeVisible();

    await page.getByTestId("expandable-tile").click();
    await expect(page.getByTestId("expandable-tile")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("has aria-expanded that toggles with state", async ({ page }) => {
    const tile = page.getByTestId("expandable-tile");
    await expect(tile).toHaveAttribute("aria-expanded", "false");

    await tile.click();
    await expect(tile).toHaveAttribute("aria-expanded", "true");

    await tile.click();
    await expect(tile).toHaveAttribute("aria-expanded", "false");
  });

  test.describe("with interactive content", () => {
    test("shows a focus ring on the chevron button", async ({ page }) => {
      const chevron = page
        .getByTestId("interactive-tile")
        .getByRole("button", { name: "View more" });
      await page.getByRole("link", { name: "View details" }).focus();
      await page.keyboard.press("Tab");

      await expect(chevron).toBeFocused();
      await expect(chevron).toHaveCSS("outline-style", "solid");
      await expect(chevron).toHaveCSS("outline-width", "2px");
    });

    test("centers the chevron label and matches the tile's text", async ({
      page,
    }) => {
      const tile = page.getByTestId("interactive-tile");
      const chevron = tile.getByRole("button", { name: "View more" });
      const label = chevron.locator("span");
      const tileFont = await tile.evaluate((el) => getComputedStyle(el).font);
      const tileColor = await tile.evaluate((el) => getComputedStyle(el).color);
      const button = await chevron.boundingBox();
      const text = await label.boundingBox();
      if (!button || !text) throw new Error("chevron is not rendered");

      const above = text.y - button.y;
      const below = button.y + button.height - (text.y + text.height);
      expect(above).toBeGreaterThan(0);
      expect(above).toBeCloseTo(below, 0);
      await expect(label).toHaveCSS("font", tileFont);
      await expect(label).toHaveCSS("color", tileColor);
    });

    test("does not show a click affordance on the tile itself", async ({
      page,
    }) => {
      const tile = page.getByTestId("interactive-tile");
      const resting = await tile.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      await tile.hover({ position: { x: 4, y: 4 } });

      await expect(tile).toHaveCSS("cursor", "auto");
      await expect(tile).toHaveCSS("background-color", resting);
      await expect(page.getByTestId("expandable-tile")).toHaveCSS(
        "cursor",
        "pointer",
      );
    });
  });
});
