import { expect, test } from "@playwright/test";
import {
  installClickListenerCounter,
  netClickListeners,
} from "./helpers/window-listeners";

const ROW_COUNT = 50;

test.describe("DataTable overflow menu listener pooling", () => {
  test.beforeEach(async ({ page }) => {
    await installClickListenerCounter(page);
    await page.goto("/data-table-overflow-menu.html");
    await expect(page.getByTestId("data-table-overflow")).toBeVisible();
  });

  test("50 closed menus attach no window click listeners", async ({ page }) => {
    const table = page.getByTestId("data-table-overflow");
    await expect(table.locator("tbody tr")).toHaveCount(ROW_COUNT);
    await expect(table.getByRole("button")).toHaveCount(ROW_COUNT);
    expect(await netClickListeners(page)).toBe(0);
  });

  test("50 open menus share one window click listener", async ({ page }) => {
    const baseline = await netClickListeners(page);

    await page.getByTestId("open-all-menus").click();
    await expect(page.locator(".bx--overflow-menu--open")).toHaveCount(
      ROW_COUNT,
    );
    expect(await netClickListeners(page)).toBe(baseline + 1);
  });

  test("closing all menus removes the shared listener", async ({ page }) => {
    const baseline = await netClickListeners(page);

    await page.getByTestId("open-all-menus").click();
    await expect(page.locator(".bx--overflow-menu--open")).toHaveCount(
      ROW_COUNT,
    );
    expect(await netClickListeners(page)).toBe(baseline + 1);

    await page.getByTestId("close-all-menus").click();
    await expect(page.locator(".bx--overflow-menu--open")).toHaveCount(0);
    expect(await netClickListeners(page)).toBe(baseline);
  });
});
