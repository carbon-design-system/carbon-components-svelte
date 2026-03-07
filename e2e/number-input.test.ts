import { expect, test } from "@playwright/test";

test.describe("NumberInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/number-input.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("Quantity")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const input = page.getByLabel("Quantity");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("10");
    await input.fill("25");
    await expect(input).toHaveValue("25");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const input = page.getByTestId("number-input-quantity");
    await expect(input).toBeVisible();
    await input.fill("50");
    await expect(input).toHaveValue("50");
  });

  test("increment button increases value", async ({ page }) => {
    const input = page.getByTestId("number-input-quantity");
    await input.fill("5");
    await page.getByLabel("Increment number").click();
    await expect(input).toHaveValue("6");
  });

  test("decrement button decreases value", async ({ page }) => {
    const input = page.getByTestId("number-input-quantity");
    await input.fill("5");
    await page.getByLabel("Decrement number").click();
    await expect(input).toHaveValue("4");
  });
});
