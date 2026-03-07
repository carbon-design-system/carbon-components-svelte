import { expect, test } from "@playwright/test";

test.describe("DatePicker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/date-picker.html");
  });

  test("renders with placeholder", async ({ page }) => {
    await expect(page.getByPlaceholder("mm/dd/yyyy")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const input = page.getByLabel("Meeting date");
    await expect(input).toBeVisible();
    await input.fill("03/10/2023");
    await expect(input).toHaveValue("03/10/2023");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const input = page.getByTestId("date-picker-meeting");
    await expect(input).toBeVisible();
    await input.click();
    await input.fill("01/15/2024");
    await expect(input).toHaveValue("01/15/2024");
  });

  test("opens calendar on click", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page.getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
  });

  test("opens calendar via calendar icon", async ({ page }) => {
    const calendarIcon = page.locator(".bx--date-picker__icon");
    await calendarIcon.click();
    const calendar = page.getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
  });

  test("accepts typed date value", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.fill("12/25/2024");
    await expect(input).toHaveValue("12/25/2024");
  });

  test("selects date by clicking day in calendar", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();

    const calendar = page.getByLabel("calendar-container");
    await expect(calendar).toBeVisible();

    // Fixture uses defaultDate "03/15/2024" so March 2024 is shown.
    // Click day 20 (current month only, exclude prev/next month days).
    const day20 = calendar
      .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
      .filter({ hasText: /^20$/ });
    await day20.click();

    await expect(input).toHaveValue("03/20/2024");
  });

  test("selects date by clicking day and updates input", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();

    const calendar = page.getByLabel("calendar-container");
    await expect(calendar).toBeVisible();

    const day15 = calendar
      .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
      .filter({ hasText: /^15$/ });
    await day15.click();

    await expect(input).toHaveValue("03/15/2024");
  });
});
