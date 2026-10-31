import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const field = (page: Page) => page.getByTestId("field");
const trigger = (page: Page) =>
  field(page).getByRole("button", { name: "Choose a color" });
const input = (page: Page) =>
  field(page).getByRole("textbox", { name: "Brand color" });

test.describe("ColorInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-input.html");
  });

  test("has no detectable accessibility violations, closed and open", async ({
    page,
  }) => {
    const closed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(closed.violations).toEqual([]);

    await trigger(page).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const open = await new AxeBuilder({ page }).include("#app").analyze();
    expect(open.violations).toEqual([]);
  });

  test("is used with the keyboard alone", async ({ page }) => {
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    const area = page.getByRole("slider", {
      name: "Saturation and brightness",
    });
    await expect(area).toBeFocused();

    await page.keyboard.press("Shift+ArrowDown");
    await expect(input(page)).toHaveValue(/^#[0-9a-f]{6}$/);
    const picked = await input(page).inputValue();
    expect(picked).not.toBe("#0f62fe");

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    await expect(page.getByTestId("value")).toHaveText(picked);
  });

  test("types a value and shows it in the swatch", async ({ page }) => {
    await input(page).fill("#da1e28");
    await input(page).press("Tab");

    await expect(page.getByTestId("value")).toHaveText("#da1e28");
    const face = await trigger(page)
      .locator(".bx--color-input__swatch-face")
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(face).toBe("rgb(218, 30, 40)");
  });

  test("opens below the field at its inline start, and mirrors in RTL", async ({
    page,
  }) => {
    await trigger(page).click();
    const popover = page.locator(".bx--popover--open .bx--popover-contents");
    const box = await field(page).locator(".bx--color-input").boundingBox();
    const ltr = await popover.boundingBox();
    if (!(box && ltr)) throw new Error("no boxes");
    expect(ltr.y).toBeGreaterThanOrEqual(box.y + box.height);
    expect(Math.abs(ltr.x - box.x)).toBeLessThan(2);

    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    try {
      await trigger(page).click();
      const rtlBox = await field(page)
        .locator(".bx--color-input")
        .boundingBox();
      const rtl = await popover.boundingBox();
      if (!(rtlBox && rtl)) throw new Error("no boxes");
      expect(
        Math.abs(rtl.x + rtl.width - (rtlBox.x + rtlBox.width)),
      ).toBeLessThan(2);
      const swatch = await trigger(page).boundingBox();
      if (!swatch) throw new Error("no swatch");
      expect(swatch.x + swatch.width).toBeGreaterThan(
        rtlBox.x + rtlBox.width - 48,
      );
    } finally {
      await page.evaluate(() => {
        document.documentElement.removeAttribute("dir");
      });
    }
  });

  test("keeps the popover whole inside a Modal", async ({ page }) => {
    await page.getByRole("button", { name: "Open modal" }).click();
    await page
      .getByTestId("in-modal")
      .getByRole("button", { name: "Choose a color" })
      .click();

    const dialog = page.getByRole("dialog", { name: "Choose a color" });
    await expect(dialog).toBeVisible();
    const box = await dialog.locator(".bx--color-input__popover").boundingBox();
    const viewport = page.viewportSize();
    if (!(box && viewport)) throw new Error("no box");
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await expect(
      dialog.getByRole("slider", { name: "Saturation and brightness" }),
    ).toBeFocused();
  });

  test("keeps the swatch color and the text in forced colors mode", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    try {
      const face = await trigger(page)
        .locator(".bx--color-input__swatch-face")
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(face).toBe("rgb(15, 98, 254)");
      await expect(input(page)).toHaveValue("#0f62fe");
      await expect(input(page)).toBeVisible();
    } finally {
      await page.emulateMedia({ forcedColors: "none" });
    }
  });
});
