import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("DatePicker a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/date-picker.html");
    await expect(page.getByTestId("date-picker-meeting")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByTestId("date-picker-meeting").click();
    await expect(
      page.locator(
        ".bx--date-picker__calendar.bx--date-picker__calendar--open",
      ),
    ).toBeVisible();

    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(openResults.violations).toEqual([]);

    await page.keyboard.press("Escape");
    await page.getByTestId("date-picker-time-input").click();
    await expect(page.getByRole("spinbutton", { name: "Hours" })).toBeVisible();
    const timeResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(timeResults.violations).toEqual([]);

    await page.keyboard.press("Escape");
    await page.getByTestId("date-picker-range-time-input").click();
    await expect(page.getByRole("group", { name: "End time" })).toBeVisible();
    const rangeTimeResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(rangeTimeResults.violations).toEqual([]);
  });
});
