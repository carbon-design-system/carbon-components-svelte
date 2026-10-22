import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("Modal a11y", () => {
  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.goto("/modal.html");
    await page.getByTestId("open-modal").click();
    await expect(page.getByTestId("modal-body")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no violations in each loading status", async ({ page }) => {
    await page.goto("/modal-v11.html");
    await page.getByTestId("open-modal").click();
    await expect(page.getByTestId("modal")).toHaveClass(/is-visible/);
    const primary = page.locator('[data-testid="modal"] .bx--btn--primary');

    for (const status of ["active", "finished", "error"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one status at a time
      await page.getByTestId(`status-${status}`).click();
      await expect(primary.locator(".bx--inline-loading")).toBeVisible();

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect.soft(results.violations, status).toEqual([]);
    }
  });
});
