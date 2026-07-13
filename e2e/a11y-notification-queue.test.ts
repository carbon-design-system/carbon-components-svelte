import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("NotificationQueue a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/notification-queue.html");
    await expect(page.getByTestId("notification-queue-root")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByTestId("nq-add").click();
    await expect(page.getByText("Toast A")).toBeVisible();

    const toastResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(toastResults.violations).toEqual([]);
  });
});
