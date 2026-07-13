import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The empty overflow-menu column header is a known, deferred gap: DataTable's
// `{ empty: true }` header has no way for a consumer to supply accessible
// (even visually-hidden) text. See the "Related" section in
// .context/bugs/datatable-batch-selection-a11y.md — needs a new header API,
// not a one-line fix, so it's intentionally excluded here rather than fixed.
function withoutKnownGaps(violations) {
  return violations.filter((v) => v.id !== "empty-table-header");
}

test.describe("DataTable OverflowMenu a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/data-table-overflow-menu.html");
    await expect(page.getByTestId("data-table-overflow")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(withoutKnownGaps(staticResults.violations)).toEqual([]);

    await page.getByRole("button", { name: "menu" }).first().click();
    await expect(
      page.getByRole("menuitem", { name: "Edit" }).first(),
    ).toBeVisible();

    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(withoutKnownGaps(openResults.violations)).toEqual([]);
  });
});
