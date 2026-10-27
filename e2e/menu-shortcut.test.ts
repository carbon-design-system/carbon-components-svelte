import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const MENU = '[role="menu"][aria-label="Actions"]';

/** Horizontal box of a row's label and its keys. */
function rowBoxes(page: Page, name: string) {
  const row = page.locator(MENU).getByRole("menuitem", { name });
  return Promise.all([
    row.locator(".bx--menu-option__label").boundingBox(),
    row.locator(".bx--menu-option__info").boundingBox(),
    row.boundingBox(),
  ]);
}

test.describe("menu shortcut", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/menu-shortcut.html");
    await expect(page.locator(MENU)).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("names the item by its label and announces the shortcut", async ({
    page,
  }) => {
    await page.goto("/menu-shortcut.html");
    await expect(page.locator(MENU)).toBeVisible();

    // The keys are decorative: the name is the label, and the shortcut is
    // announced through `aria-keyshortcuts`.
    const item = page.locator(MENU).getByRole("menuitem", { name: "Palette" });
    await expect(item).toHaveAttribute(
      "aria-keyshortcuts",
      /^\w+\+Shift\+P$|^Shift\+\w+\+P$/,
    );
    await expect(item.locator(".bx--keyboard-shortcut")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("names an OverflowMenuItem by its label and its keys", async ({
    page,
  }) => {
    await page.goto("/menu-shortcut.html");
    await expect(page.locator(".bx--overflow-menu-options")).toBeVisible();

    // The recipe has no `aria-keyshortcuts`, so the keys stay in the name.
    await expect(
      page.getByRole("menuitem", { name: "Rename F2" }),
    ).toBeVisible();
  });

  test("puts the keys at the inline end, in order, in both directions", async ({
    page,
  }) => {
    await page.goto("/menu-shortcut.html");
    await expect(page.locator(MENU)).toBeVisible();
    const [ltrLabel, ltrInfo, ltrRow] = await rowBoxes(page, "Palette");
    if (!(ltrLabel && ltrInfo && ltrRow)) throw new Error("no row");
    // The keys follow the label and end at the row's inline end.
    expect(ltrInfo.x).toBeGreaterThan(ltrLabel.x);
    expect(ltrInfo.x + ltrInfo.width).toBeLessThanOrEqual(
      ltrRow.x + ltrRow.width,
    );

    await page.goto("/menu-shortcut.html?dir=rtl");
    await expect(page.locator(MENU)).toBeVisible();
    const [rtlLabel, rtlInfo, rtlRow] = await rowBoxes(page, "Palette");
    if (!(rtlLabel && rtlInfo && rtlRow)) throw new Error("no row");
    // Mirrored: the keys sit left of the label, at the row's left edge.
    expect(rtlInfo.x + rtlInfo.width).toBeLessThan(rtlLabel.x + rtlLabel.width);
    expect(rtlInfo.x).toBeGreaterThanOrEqual(rtlRow.x);

    // The key order is the logical order in either direction.
    const lefts = await page
      .locator(MENU)
      .getByRole("menuitem", { name: "Palette" })
      .locator(".bx--kbd")
      .evaluateAll((keys) =>
        keys.map((key) => Math.round(key.getBoundingClientRect().left)),
      );
    expect(lefts).toHaveLength(3);
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
  });

  test("takes the row's text color, including the danger hover", async ({
    page,
  }) => {
    await page.goto("/menu-shortcut.html");
    await expect(page.locator(MENU)).toBeVisible();
    const row = page.locator(MENU).getByRole("menuitem", { name: "Delete" });
    const color = (selector: string) =>
      row
        .locator(selector)
        .first()
        .evaluate((node) => getComputedStyle(node).color);

    await row.hover();
    const label = await color(".bx--menu-option__label");
    expect(await color(".bx--kbd")).toBe(label);
    // The label turns white on the red row; the keys must not stay grey.
    expect(label).toBe("rgb(255, 255, 255)");
  });

  test("keeps the keys readable in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/menu-shortcut.html");
    await expect(page.locator(MENU)).toBeVisible();

    const row = page.locator(MENU).getByRole("menuitem", { name: "Palette" });
    const [key, label] = await Promise.all(
      [".bx--kbd", ".bx--menu-option__label"].map((selector) =>
        row
          .locator(selector)
          .first()
          .evaluate((node) => getComputedStyle(node).color),
      ),
    );
    expect(key).toBe(label);
  });
});
