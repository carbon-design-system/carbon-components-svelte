import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ComboBox a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/combobox.html");
    await expect(page.getByTestId("combobox-contact")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with the menu open", async ({
    page,
  }) => {
    await page.goto("/combobox.html");
    await page.getByRole("combobox", { name: "Contact" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option", { name: "Slack" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
