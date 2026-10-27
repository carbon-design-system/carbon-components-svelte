import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const names = (page: Page) =>
  page
    .getByTestId("table-state")
    .locator("tbody tr")
    .evaluateAll((rows) =>
      rows.map((row) => row.querySelectorAll("td")[1]?.textContent?.trim()),
    );

const sortButton = (page: Page) =>
  page.getByRole("columnheader", { name: /Name/ }).getByRole("button");

test.describe("createTableState", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/table-state.html");
  });

  test("mirrors sort, page and search to the URL, and keeps other parameters", async ({
    page,
  }) => {
    await page.evaluate(() => {
      history.replaceState(null, "", "/host.html?tab=2");
    });
    await page.goto("/table-state.html?tab=2");

    await sortButton(page).click();
    await page.getByRole("button", { name: "Next page" }).click();

    await expect(page).toHaveURL(/\?tab=2&sort=name%3Aasc&page=2$/);
    await expect(page.getByTestId("request")).toHaveText(
      "sort=name%3Aasc&page=2&pageSize=5",
    );
  });

  test("resets the page when the search changes", async ({ page }) => {
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);

    await page.getByRole("searchbox").fill("an");

    await expect(page).toHaveURL(/\?q=an$/);
    await expect.poll(() => names(page)).toEqual(["Banana", "banana split"]);
  });

  test("restores sort and page from the URL", async ({ page }) => {
    await page.goto("/table-state.html?sort=name%3Aasc&page=2");

    await expect(
      sortButton(page).locator("xpath=ancestor::th"),
    ).toHaveAttribute("aria-sort", "ascending");
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

  test("restores the page size from storage", async ({ page }) => {
    await page
      .getByRole("combobox", { name: /Items per page/ })
      .selectOption("10");
    await expect(page.getByTestId("request")).toContainText("pageSize=10");

    await page.reload();

    await expect(page.getByTestId("request")).toContainText("pageSize=10");
  });

  test("leaves the selection out of the URL and storage", async ({ page }) => {
    await page
      .getByRole("checkbox", { name: "Select row" })
      .first()
      .click({ force: true });
    await expect(page.getByText("1 item selected")).toBeVisible();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByText("1 item selected")).toBeVisible();
    await expect(page).not.toHaveURL(/selected/);

    await page.reload();

    await expect(page.getByText("1 item selected")).toBeHidden();
  });

  test("reads the URL again on back and forward", async ({ page }) => {
    await page.getByRole("searchbox").fill("date");
    await expect(page).toHaveURL(/\?q=date$/);

    // A router push to another view, then the back button.
    await page.evaluate(() => {
      history.pushState(null, "", "/host.html?q=an");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect.poll(() => names(page)).toEqual(["Banana", "banana split"]);
    await page.goBack();

    await expect.poll(() => names(page)).toEqual(["Date"]);
  });

  test("ignores a sort key outside sortKeys", async ({ page }) => {
    await page.goto("/table-state.html?sort=password:asc&page=-3");

    await expect(page.getByTestId("request")).toHaveText("page=1&pageSize=5");
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
      await sortButton(page).click();

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
