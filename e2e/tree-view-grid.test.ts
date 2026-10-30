import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("TreeViewGrid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tree-view-grid.html");
    await expect(page.getByRole("treegrid")).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const initial = await new AxeBuilder({ page }).include("#app").analyze();
    expect(initial.violations).toEqual([]);

    await page
      .locator("[data-tree-row-id=us-east-api]")
      .locator(".bx--tree-grid__toggle")
      .click();
    await page.locator("[data-tree-row-id=us-east-cache] td").nth(1).click();
    await expect(page.getByTestId("selected")).toHaveText("us-east-cache");

    const expanded = await new AxeBuilder({ page }).include("#app").analyze();
    expect(expanded.violations).toEqual([]);
  });

  test("is one tab stop however many controls the cells hold", async ({
    page,
  }) => {
    // 12 controls (links, toggles, menus) and a roving row: one Tab enters,
    // the next leaves.
    await page.keyboard.press("Tab");
    await expect(page.locator("[data-tree-row-id=us-east]")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("tbody").locator(":focus")).toHaveCount(0);
  });

  test("reaches an overflow menu and a toggle with the arrow keys", async ({
    page,
  }) => {
    const row = page.locator("[data-tree-row-id=us-east]");
    await row.focus();
    for (let i = 0; i < 6; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: keys go in order
      await page.keyboard.press("ArrowRight");
    }
    await expect(row.locator("td").nth(5)).toBeFocused();

    await page.keyboard.press("Enter");
    const trigger = row.getByRole("button", { name: "Actions for US East" });
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Restart" })).toBeFocused();
    // Escape closes the menu first, and a second one returns to the cell.
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(row.locator("td").nth(5)).toBeFocused();

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("F2");
    const toggle = row.getByRole("switch");
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Space");
    await expect(toggle).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(row.locator("td").nth(4)).toBeFocused();
    await expect(page.getByTestId("selected")).toHaveText("");
  });

  test("does not select a row for a click on its link", async ({ page }) => {
    await page
      .locator("[data-tree-row-id=us-east]")
      .getByRole("link", { name: "Platform" })
      .click();
    await expect(page.getByTestId("selected")).toHaveText("");
  });

  test("keeps its column widths as rows expand", async ({ page }) => {
    const widths = () =>
      page
        .locator("thead th")
        .evaluateAll((cells) =>
          cells.map((cell) => Math.round(cell.getBoundingClientRect().width)),
        );
    const before = await widths();
    await page
      .locator("[data-tree-row-id=us-east-api]")
      .locator(".bx--tree-grid__toggle")
      .click();
    await expect(
      page.locator("[data-tree-row-id=us-east-api-canary]"),
    ).toBeVisible();
    expect(await widths()).toEqual(before);
  });

  test("does not squeeze the tree column at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const name = await page
      .locator("thead th")
      .first()
      .evaluate((cell) => cell.getBoundingClientRect().width);
    // 12rem, the floor for a column with no `width`.
    expect(name).toBeGreaterThanOrEqual(192);
  });

  test("scrolls inside its container at 320px, not the page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    // The toggles' visually hidden inputs sit past the fold.
    const pageWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(pageWidth).toBe(320);
  });

  test("expands for a press just outside the 16px caret", async ({ page }) => {
    const row = page.locator("[data-tree-row-id=us-east-api]");
    const caret = await row.locator(".bx--tree-grid__toggle").boundingBox();
    expect(caret?.width).toBe(16);
    if (!caret) return;
    // 3px before the caret, inside its 24px hit area.
    await page.mouse.click(caret.x - 3, caret.y + caret.height / 2);
    await expect(row).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("selected")).toHaveText("");
  });

  test("selects a leaf row for a press on its empty toggle box", async ({
    page,
  }) => {
    await page
      .locator("[data-tree-row-id=us-east-cache]")
      .locator(".bx--tree-grid__toggle")
      .click();
    await expect(page.getByTestId("selected")).toHaveText("us-east-cache");
  });

  test("draws a focus ring on a row and on a cell", async ({ page }) => {
    const row = page.locator("[data-tree-row-id=us-east]");
    await row.focus();
    await expect(row).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("ArrowRight");
    await expect(row.locator("td").first()).toHaveCSS("outline-style", "solid");
    await expect(row).not.toBeFocused();
  });
});
