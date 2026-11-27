import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).include("#app").analyze();
  return results.violations;
}

test.describe("CountryPicker a11y", () => {
  for (const [title, query] of [
    ["White", ""],
    ["Gray 100", "theme=g100"],
    ["RTL with an Arabic locale", "dir=rtl&locale=ar"],
    ["Gray 100, RTL, Hebrew", "theme=g100&dir=rtl&locale=he"],
  ]) {
    test(`${title} has no detectable violations, closed or open`, async ({
      page,
    }) => {
      await page.goto(`/country-picker.html?${query}`);
      const combobox = page.getByRole("combobox", {
        name: "Country",
        exact: true,
      });
      await expect(combobox).toBeVisible();
      expect(await violations(page)).toEqual([]);

      await combobox.click();
      await expect(page.getByRole("listbox")).toBeVisible();
      await expect(page.getByRole("option").first()).toBeVisible();
      expect(await violations(page)).toEqual([]);

      // A query that matches a few rows, and one that matches none.
      await combobox.fill("a");
      await expect(page.getByRole("option").first()).toBeVisible();
      expect(await violations(page)).toEqual([]);
      await combobox.fill("zzzz");
      await expect(page.getByRole("listbox")).toContainText(/./);
      expect(await violations(page)).toEqual([]);
    });
  }

  test("names its options for assistive technology", async ({ page }) => {
    await page.goto("/country-picker.html");
    await page.getByRole("combobox", { name: "Country", exact: true }).click();

    const tree = await page.getByRole("listbox").ariaSnapshot();
    // Flags, code badges and tags are decoration: no unnamed image or bare
    // code in the tree.
    expect(tree).not.toMatch(/img/);
    expect(tree).toMatch(/option "Afghanistan/);
    expect(tree).not.toMatch(/option "AF /);
  });
});

test("CountryPicker in a Modal has no detectable violations", async ({
  page,
}) => {
  await page.goto("/country-picker.html");
  await page.getByTestId("open-modal").click();
  await page
    .getByRole("combobox", { name: "Modal country", exact: true })
    .click();
  await expect(page.getByRole("listbox")).toBeVisible();

  // The menu is in a portal outside any landmark, as every portalled menu is.
  const results = await new AxeBuilder({ page })
    .disableRules(["region"])
    .analyze();
  expect(results.violations).toEqual([]);
});
