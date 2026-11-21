import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("ShortcutHelp a11y", () => {
  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.goto("/shortcut-help.html?scoped");
    await page.keyboard.press("?");
    await expect(
      page.getByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("returns focus to the page when Escape closes it", async ({ page }) => {
    await page.goto("/shortcut-help.html");
    await page.getByRole("button", { name: "Show shortcuts" }).focus();
    await page.keyboard.press("?");
    await expect(
      page.getByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(
      page.getByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Show shortcuts" }),
    ).toBeFocused();
  });
});
