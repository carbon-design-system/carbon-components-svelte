import { expect, test } from "@playwright/test";

test.describe("Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tabs.html");
  });

  test("renders tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Tab 1" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Tab 2" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Tab 3" })).toBeVisible();
  });

  test("switches tab on click", async ({ page }) => {
    await expect(page.getByTestId("tab-content-1")).toBeVisible();

    await page.getByRole("tab", { name: "Tab 2" }).click();
    await expect(page.getByTestId("tab-content-2")).toBeVisible();

    await page.getByRole("tab", { name: "Tab 3" }).click();
    await expect(page.getByTestId("tab-content-3")).toBeVisible();
  });

  test("can be located by data-testid", async ({ page }) => {
    const tabs = page.getByTestId("tabs");
    await expect(tabs).toBeVisible();
    await tabs.getByRole("tab", { name: "Tab 2" }).click();
    await expect(page.getByTestId("tab-content-2")).toBeVisible();
  });

  test("first tab is selected by default", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("ArrowRight switches to next tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Tab 1" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByTestId("tab-content-2")).toBeVisible();
  });

  test("ArrowLeft switches to previous tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Tab 2" }).click();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByTestId("tab-content-1")).toBeVisible();
  });

  // Regression: the icon must sit horizontally beside the label, not stacked
  // below it. The icon-modifier rule must out-specify Carbon's base
  // `a.bx--tabs__nav-link { display: inline-block }`, which is emitted after
  // the override partial. See css/_tabs.scss.
  test("renders the tab icon beside the label, not below it", async ({
    page,
  }) => {
    const navLink = page.getByRole("tab", { name: "Tab 1" });
    await expect(navLink).toHaveCSS("display", "flex");

    const label = navLink.locator(".bx--tabs__nav-item-label");
    const icon = navLink.locator(".bx--tabs__nav-item--icon");

    const labelBox = await label.boundingBox();
    const iconBox = await icon.boundingBox();
    if (!labelBox || !iconBox) throw new Error("Missing label/icon box");

    // Icon is to the right of the label.
    expect(iconBox.x).toBeGreaterThanOrEqual(labelBox.x + labelBox.width - 1);
    // Their vertical ranges overlap (same row), rather than the icon dropping
    // onto its own line below the label.
    expect(iconBox.y).toBeLessThan(labelBox.y + labelBox.height);
    expect(labelBox.y).toBeLessThan(iconBox.y + iconBox.height);
  });
});
