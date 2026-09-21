import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ToggleButtonGroup a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/toggle-button-group.html");

    const toolbar = page.getByRole("toolbar", { name: "Text formatting" });
    await expect(toolbar).toBeVisible();
    await expect(toolbar.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      toolbar.getByRole("button", { name: "Underline" }),
    ).toBeDisabled();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});
