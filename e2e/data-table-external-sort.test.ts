import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const names = (page: Page) =>
  page
    .getByTestId("external-sort")
    .locator("tbody tr")
    .evaluateAll((rows) =>
      rows.map((row) => row.querySelectorAll("td")[1]?.textContent?.trim()),
    );

test.describe("DataTable externalSort", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-table-external-sort.html");
  });

  test("renders the server's order on a later page", async ({ page }) => {
    const header = page.getByRole("columnheader", { name: /Name/ });
    await header.getByRole("button").click();
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await page.getByRole("button", { name: "Next page" }).click();

    // Code point order. An Intl.Collator sort would start with "apple".
    await expect
      .poll(() => names(page))
      .toEqual([
        "Honeydew",
        "apple",
        "banana split",
        "cherry pie",
        "elderberry",
      ]);
  });

  test("keeps the selection across a search and a sort", async ({ page }) => {
    await page.getByRole("searchbox").fill("an");
    await expect.poll(() => names(page)).toEqual(["Banana", "banana split"]);

    await page
      .getByRole("checkbox", { name: "Select row" })
      .first()
      .click({ force: true });
    await expect(page.getByText("1 item selected")).toBeVisible();
    await page
      .getByRole("columnheader", { name: /Name/ })
      .getByRole("button")
      .click();

    await expect(page.getByText("1 item selected")).toBeVisible();
    await expect.poll(() => names(page)).toEqual(["Banana", "banana split"]);
  });

  for (const mode of ["ltr", "rtl", "forced-colors"] as const) {
    test(`has no detectable accessibility violations in ${mode}`, async ({
      page,
    }) => {
      if (mode === "rtl") {
        await page.evaluate(() => {
          document.documentElement.dir = "rtl";
        });
      }
      if (mode === "forced-colors") {
        await page.emulateMedia({ forcedColors: "active" });
      }
      await page
        .getByRole("columnheader", { name: /Name/ })
        .getByRole("button")
        .click();
      await page
        .getByRole("checkbox", { name: "Select row" })
        .first()
        .click({ force: true });

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
