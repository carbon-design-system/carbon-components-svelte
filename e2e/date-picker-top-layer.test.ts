import { expect, test } from "@playwright/test";

test.describe("DatePicker inside native dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/date-picker-top-layer.html");
    await page.getByTestId("open-dialog").click();
    await expect(page.getByTestId("native-dialog")).toBeVisible();
  });

  test("portalMenu calendar mounts inside the dialog (not document.body)", async ({
    page,
  }) => {
    await page.getByTestId("dialog-date-picker-portal-input").click();

    const calendar = page
      .getByTestId("native-dialog")
      .locator(".flatpickr-calendar.open");
    await expect(calendar).toBeVisible();

    const parentTag = await calendar.evaluate(
      (el) => el.parentElement?.tagName.toLowerCase() ?? null,
    );
    expect(parentTag).toBe("dialog");
  });

  test("portalMenu calendar uses position: fixed inside the dialog", async ({
    page,
  }) => {
    await page.getByTestId("dialog-date-picker-portal-input").click();

    const calendar = page
      .getByTestId("native-dialog")
      .locator(".flatpickr-calendar.open");
    await expect(calendar).toBeVisible();

    const position = await calendar.evaluate(
      (el) => (el as HTMLElement).style.position,
    );
    expect(position).toBe("fixed");
  });

  test("portalMenu calendar is anchored to its input inside the dialog", async ({
    page,
  }) => {
    const input = page.getByTestId("dialog-date-picker-portal-input");
    await input.click();

    const calendar = page
      .getByTestId("native-dialog")
      .locator(".flatpickr-calendar.open");
    await expect(calendar).toBeVisible();

    const inputBox = await input.boundingBox();
    const calendarBox = await calendar.boundingBox();

    expect(inputBox).not.toBeNull();
    expect(calendarBox).not.toBeNull();
    if (inputBox && calendarBox) {
      // The calendar should sit immediately above or below the input — not
      // offset by the dialog's top, which is the regression in #2881.
      const distanceBelow = Math.abs(
        calendarBox.y - (inputBox.y + inputBox.height),
      );
      const distanceAbove = Math.abs(
        calendarBox.y + calendarBox.height - inputBox.y,
      );
      expect(Math.min(distanceBelow, distanceAbove)).toBeLessThan(32);
    }
  });
});

test.describe("DatePicker inside native [popover]", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/date-picker-top-layer.html");
    await page.getByTestId("open-popover").click();
    await expect(page.getByTestId("native-popover")).toBeVisible();
  });

  test("portalMenu calendar mounts inside the popover", async ({ page }) => {
    await page.getByTestId("popover-date-picker-portal-input").focus();

    const calendar = page
      .getByTestId("native-popover")
      .locator(".flatpickr-calendar.open");
    await expect(calendar).toBeVisible();

    const parentTestId = await calendar.evaluate(
      (el) => el.parentElement?.getAttribute("data-testid") ?? null,
    );
    expect(parentTestId).toBe("native-popover");
  });

  test("portalMenu calendar uses position: fixed inside the popover", async ({
    page,
  }) => {
    await page.getByTestId("popover-date-picker-portal-input").focus();
    const calendar = page
      .getByTestId("native-popover")
      .locator(".flatpickr-calendar.open");
    await expect(calendar).toBeVisible();

    const position = await calendar.evaluate(
      (el) => (el as HTMLElement).style.position,
    );
    expect(position).toBe("fixed");
  });

  test("portalMenu calendar is anchored to its input inside the popover", async ({
    page,
  }) => {
    const input = page.getByTestId("popover-date-picker-portal-input");
    await input.focus();

    const calendar = page
      .getByTestId("native-popover")
      .locator(".flatpickr-calendar.open");
    await expect(calendar).toBeVisible();

    const inputBox = await input.boundingBox();
    const calendarBox = await calendar.boundingBox();

    expect(inputBox).not.toBeNull();
    expect(calendarBox).not.toBeNull();
    if (inputBox && calendarBox) {
      const distanceBelow = Math.abs(
        calendarBox.y - (inputBox.y + inputBox.height),
      );
      const distanceAbove = Math.abs(
        calendarBox.y + calendarBox.height - inputBox.y,
      );
      expect(Math.min(distanceBelow, distanceAbove)).toBeLessThan(32);
    }
  });
});
