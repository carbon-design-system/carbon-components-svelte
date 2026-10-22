import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("Loading a11y", () => {
  test("holds keyboard focus in the overlay and restores it", async ({
    page,
  }) => {
    await page.goto("/loading.html");

    const save = page.getByRole("button", { name: "Save changes" });
    await save.focus();
    await page.keyboard.press("Enter");

    const overlay = page.getByRole("dialog", { name: "Saving changes" });
    await expect(overlay).toBeFocused();
    await expect(overlay).toHaveCSS("outline-color", "rgba(0, 0, 0, 0)");

    await page.keyboard.press("Tab");
    await expect(overlay).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(overlay).toBeFocused();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await page.evaluate(() => window.dispatchEvent(new Event("stop-loading")));
    await expect(save).toBeFocused();
  });
});
