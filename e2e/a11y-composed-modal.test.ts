import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ComposedModal a11y", () => {
  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.goto("/composed-modal.html");
    await page.getByTestId("open-modal").click();
    await expect(page.getByTestId("modal-body")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
