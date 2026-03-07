import { expect, test } from "@playwright/test";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const search = page.getByRole("searchbox", { name: "Search" });
    await expect(search).toBeVisible();
    await search.fill("test query");
    await expect(search).toHaveValue("test query");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const search = page.getByTestId("search-query");
    await expect(search).toBeVisible();
    await search.fill("carbon");
    await expect(search).toHaveValue("carbon");
  });

  test("clear button clears input", async ({ page }) => {
    const search = page.getByTestId("search-query");
    await search.fill("something");
    await expect(search).toHaveValue("something");
    await page.getByRole("button", { name: "Clear search input" }).click();
    await expect(search).toHaveValue("");
  });
});
