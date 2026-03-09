import { expect, test } from "@playwright/test";

test.describe("DatePicker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/date-picker.html");
  });

  test("renders with placeholder", async ({ page }) => {
    await expect(
      page.getByTestId("date-picker-single").getByPlaceholder("mm/dd/yyyy"),
    ).toBeVisible();
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
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
  });

  test("opens calendar via calendar icon", async ({ page }) => {
    const calendarIcon = page
      .getByTestId("date-picker-single")
      .locator(".bx--date-picker__icon");
    await calendarIcon.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
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

    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
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

    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();

    const day15 = calendar
      .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
      .filter({ hasText: /^15$/ });
    await day15.click();

    await expect(input).toHaveValue("03/15/2024");
  });

  test("calendar receives keyboard input after open", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(input).not.toHaveValue("");
  });

  test("Escape closes calendar", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);
    await input.focus();
    await page.keyboard.press("Escape");
    await expect(calendar).not.toHaveClass(/open/);
  });

  test("click outside closes calendar", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);
    await page.getByTestId("outside-date-picker").click();
    await expect(calendar).not.toHaveClass(/open/);
  });

  test("min/max: disabled days not selectable", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
    // With min 03/01 and max 03/31, days outside March get .flatpickr-disabled
    const disabledDay = calendar
      .locator(".flatpickr-day.flatpickr-disabled")
      .first();
    await expect(disabledDay).toBeVisible();
    const initialValue = await input.inputValue();
    await disabledDay.click();
    await expect(input).toHaveValue(initialValue);
  });

  test("range: renders two inputs", async ({ page }) => {
    const startInput = page.getByLabel("Start date");
    const endInput = page.getByLabel("End date");
    await expect(startInput).toBeVisible();
    await expect(endInput).toBeVisible();
    await expect(startInput).toHaveAttribute("placeholder", "mm/dd/yyyy");
    await expect(endInput).toHaveAttribute("placeholder", "mm/dd/yyyy");
  });

  test("range: opens calendar from start input", async ({ page }) => {
    await page.getByTestId("date-picker-range-start").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
  });

  test("range: opens calendar from end input", async ({ page }) => {
    await page.getByTestId("date-picker-range-end").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
  });

  test("range: selecting range updates both inputs", async ({ page }) => {
    await page.getByTestId("date-picker-range-start").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();

    const day10 = calendar
      .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
      .filter({ hasText: /^10$/ });
    const day20 = calendar
      .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
      .filter({ hasText: /^20$/ });
    await day10.click();
    await day20.click();

    await expect(page.getByTestId("date-picker-range-start")).toHaveValue(
      "03/10/2024",
    );
    await expect(page.getByTestId("date-picker-range-end")).toHaveValue(
      "03/20/2024",
    );
  });

  test("range: Escape closes calendar", async ({ page }) => {
    await page.getByTestId("date-picker-range-start").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);
    await page.getByTestId("date-picker-range-start").focus();
    await page.keyboard.press("Escape");
    await expect(calendar).not.toHaveClass(/open/);
  });
});
