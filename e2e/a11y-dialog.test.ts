import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Dialog a11y", () => {
  test("has no detectable accessibility violations with a modal dialog open", async ({
    page,
  }) => {
    await page.goto("/dialog.html");
    await page.getByTestId("open-modal").click();
    await expect(page.getByTestId("modal-focus-target")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations with a non-modal dialog open", async ({
    page,
  }) => {
    await page.goto("/dialog.html");
    await page.getByTestId("open-non-modal").click();
    await expect(page.getByText("Non-modal content")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
