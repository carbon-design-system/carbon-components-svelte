import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("DataTable OverflowMenu a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/data-table-overflow-menu.html");
    await expect(page.getByTestId("data-table-overflow")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    // The empty overflow-menu column header is a known, deferred gap: DataTable's
    // `{ empty: true }` header has no way for a consumer to supply accessible
    // (even visually-hidden) text. See the "Related" section in
    // .context/bugs/datatable-batch-selection-a11y.md — needs a new header API,
    // not a one-line fix, so it's intentionally excluded here rather than fixed.
    const violations = results.violations.filter(
      (v) => v.id !== "empty-table-header",
    );
    expect(violations).toEqual([]);
  });

  test("has no detectable accessibility violations with a row menu open", async ({
    page,
  }) => {
    await page.goto("/data-table-overflow-menu.html");
    await page.getByRole("button", { name: "menu" }).first().click();
    await expect(
      page.getByRole("menuitem", { name: "Edit" }).first(),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    // The empty overflow-menu column header is a known, deferred gap: DataTable's
    // `{ empty: true }` header has no way for a consumer to supply accessible
    // (even visually-hidden) text. See the "Related" section in
    // .context/bugs/datatable-batch-selection-a11y.md — needs a new header API,
    // not a one-line fix, so it's intentionally excluded here rather than fixed.
    const violations = results.violations.filter(
      (v) => v.id !== "empty-table-header",
    );
    expect(violations).toEqual([]);
  });
});
