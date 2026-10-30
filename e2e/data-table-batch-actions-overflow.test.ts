import { expect, test } from "./helpers/host";
import {
  expectAligned,
  expectNoPageOverflow,
  expectOnePitch,
  expectTextFits,
} from "./helpers/layout";

test.describe("DataTable batch actions overflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 720 });
    await page.goto("/data-table-batch-actions-overflow.html");
  });

  test("hidden batch actions bar does not widen the page", async ({ page }) => {
    await expect(page.locator(".bx--batch-actions")).toBeAttached();
    await expectNoPageOverflow(page);
  });

  // The toolbar spans the table's width, rows keep one pitch, and no cell
  // or toolbar text spills or gets cut in the 360px table.
  test("toolbar and rows line up with the table", async ({ page }) => {
    const table = page.locator(".bx--data-table-container");
    await expectAligned(
      [table.locator(".bx--table-toolbar"), table.locator("table")],
      { edge: "inline-start" },
    );
    await expectAligned(
      [table.locator(".bx--toolbar-content .bx--btn"), table.locator("table")],
      { edge: "inline-end" },
    );
    expect(await expectOnePitch(table.locator("tbody tr"))).toBe(2);
    expect(await expectTextFits(table)).toBeGreaterThan(0);
  });

  test("selecting a row reveals the bar and its actions", async ({ page }) => {
    await page
      .getByRole("checkbox", { name: "Select all rows" })
      .click({ force: true });

    const batchActionsBar = page.locator(".bx--batch-actions--active");
    await expect(batchActionsBar).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Archive" })).toBeVisible();
    await expectNoPageOverflow(page);
  });
});
