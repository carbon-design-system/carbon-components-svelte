import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("EmptyState a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/empty-state.html");

    // Large, linked-subtitle and small empty states, each titled by an h3.
    await expect(
      page.getByRole("heading", {
        level: 3,
        name: "Create your first project",
      }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("renders a no-results state inside a live region that was already there", async ({
    page,
  }) => {
    await page.goto("/empty-state.html");
    const status = page.getByTestId("status");
    await expect(status).toBeEmpty();

    await page
      .getByRole("searchbox", { name: "Search reports" })
      .fill("invoces");
    await expect(
      status.getByRole("heading", { name: "No results for “invoces”" }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await status.getByRole("button", { name: "Clear search" }).click();
    await expect(status).toBeEmpty();
    await expect(page.getByRole("listitem")).toHaveCount(2);
  });
});
