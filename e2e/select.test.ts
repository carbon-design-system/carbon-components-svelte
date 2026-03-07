import { expect, test } from "@playwright/test";

test.describe("Select", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/select.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("Country")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const select = page.getByLabel("Country");
    await expect(select).toBeVisible();
    await select.selectOption("Canada");
    await expect(page.getByTestId("selected-value")).toContainText("ca");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const select = page.getByTestId("select-country");
    await expect(select).toBeVisible();
    await select.selectOption({ label: "United Kingdom" });
    await expect(page.getByTestId("selected-value")).toContainText("uk");
  });

  test("selects option", async ({ page }) => {
    await page.getByLabel("Country").selectOption("Germany");
    await expect(page.getByTestId("selected-value")).toContainText("de");
  });
});
