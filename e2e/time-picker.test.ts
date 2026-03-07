import { expect, test } from "@playwright/test";

test.describe("TimePicker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/time-picker.html");
  });

  test("renders time picker", async ({ page }) => {
    await expect(page.getByTestId("time-picker")).toBeVisible();
    await expect(page.getByLabel("Meeting time")).toBeVisible();
  });

  test("can fill time input", async ({ page }) => {
    const input = page.getByLabel("Meeting time");
    await input.fill("02:30");
    await expect(input).toHaveValue("02:30");
  });

  test("can select AM/PM from dropdown", async ({ page }) => {
    const select = page.getByLabel("AM/PM");
    await select.selectOption("am");
    await expect(select).toHaveValue("am");
  });
});
