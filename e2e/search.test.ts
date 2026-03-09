import { expect, test } from "@playwright/test";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByTestId("search-query")).toBeVisible();
    await expect(
      page.getByText("Search", { exact: true }).first(),
    ).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const search = page.getByTestId("search-query");
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
    const firstSearch = page.locator(".bx--search").filter({
      has: page.getByTestId("search-query"),
    });
    await firstSearch
      .getByRole("button", { name: "Clear search input" })
      .click();
    await expect(search).toHaveValue("");
  });

  test("expandable search expands when magnifier is clicked", async ({
    page,
  }) => {
    const wrapper = page.locator(".bx--search--expandable");
    await expect(wrapper).not.toHaveClass(/bx--search--expanded/);
    await wrapper.locator(".bx--search-magnifier").click();
    await expect(wrapper).toHaveClass(/bx--search--expanded/);
  });

  test("expandable search expands on input focus", async ({ page }) => {
    const wrapper = page.locator(".bx--search--expandable");
    await wrapper.locator(".bx--search-magnifier").click();
    const input = wrapper.getByRole("searchbox");
    await input.focus();
    await expect(wrapper).toHaveClass(/bx--search--expanded/);
  });

  test("expandable search collapses on Escape then blur when empty", async ({
    page,
  }) => {
    const wrapper = page.locator(".bx--search--expandable");
    await wrapper.locator(".bx--search-magnifier").click();
    await wrapper.getByRole("searchbox").focus();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Tab");
    await expect(wrapper).not.toHaveClass(/bx--search--expanded/);
  });
});
