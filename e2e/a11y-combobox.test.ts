import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ComboBox a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/combobox.html");
    await expect(page.getByTestId("combobox-contact")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("combobox", { name: "Contact" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option", { name: "Slack" })).toBeVisible();

    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(openResults.violations).toEqual([]);
  });
});
