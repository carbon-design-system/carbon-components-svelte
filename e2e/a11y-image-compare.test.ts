import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const divider = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("slider");

test.beforeEach(async ({ page }) => {
  await page.goto("/image-compare.html");
  await expect(divider(page, "slider")).toBeVisible();
});

test.describe("ImageCompare a11y", () => {
  test("has no detectable accessibility violations in any mode", async ({
    page,
  }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await divider(page, "slider").focus();
    await page.keyboard.press("End");
    await page.getByRole("tab", { name: "Current" }).click();
    // Axe reads colors, so let the fade finish.
    await expect(
      page.getByTestId("toggle").locator(".bx--image-compare__layer--before"),
    ).toBeHidden();

    const changed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(changed.violations).toEqual([]);
  });

  for (const theme of ["white", "g100"]) {
    test(`has none in ${theme} under RTL`, async ({ page }) => {
      await page.evaluate((theme) => {
        document.documentElement.setAttribute("theme", theme);
        document.documentElement.setAttribute("dir", "rtl");
      }, theme);
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("names the divider and says what it shows", async ({ page }) => {
    const slider = divider(page, "slider");
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      "Showing 50% of Before",
    );
    await expect(
      page.getByRole("group", { name: "Denoised photo" }),
    ).toBeVisible();
    await expect(
      page.getByRole("slider", { name: "Comparison" }).first(),
    ).toBeVisible();
  });
});
