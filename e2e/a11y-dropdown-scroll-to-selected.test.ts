import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Dropdown scroll-to-selected a11y", () => {
  test("has no detectable accessibility violations with the menu open", async ({
    page,
  }) => {
    await page.goto("/dropdown-scroll-to-selected.html");
    await page.getByRole("combobox", { name: "Items" }).click();
    await expect(page.getByRole("option", { name: "Item 43" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
