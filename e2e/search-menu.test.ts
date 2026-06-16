import { expect, test } from "@playwright/test";

test.describe("SearchMenu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search-menu.html");
  });

  test("opens the results menu on focus", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await expect(page.getByRole("listbox")).toBeHidden();
    await input.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(input).toHaveAttribute("aria-expanded", "true");
  });

  test("fuzzy-filters results while keeping a filter:false group", async ({
    page,
  }) => {
    const input = page.getByTestId("search-input");
    await input.click();
    await input.fill("memcache");

    await expect(
      page.getByRole("option", { name: "Data Store for Memcache" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Databases for TestSQL" }),
    ).toBeHidden();
    // Recent searches opts out of filtering, so it remains visible.
    await expect(
      page.getByRole("option", { name: "recent vpc" }),
    ).toBeVisible();
  });

  test("navigates with the keyboard and selects with Enter", async ({
    page,
  }) => {
    const input = page.getByTestId("search-input");
    await input.click();
    await input.press("ArrowDown");

    const firstOption = page.getByRole("option").first();
    await expect(firstOption).toHaveAttribute("aria-selected", "true");

    await input.press("Enter");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(page.getByTestId("last-select")).toHaveText("recent vpc");
    await expect(input).toHaveValue("recent vpc");
  });

  test("dispatches submit on Enter with no active result", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.click();
    await input.fill("free text query");
    await input.press("Enter");
    await expect(page.getByTestId("last-submit")).toHaveText("free text query");
  });

  test("closes on Escape and preserves the value", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.click();
    await input.fill("data");
    await expect(page.getByRole("listbox")).toBeVisible();
    await input.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(input).toHaveValue("data");
  });

  test("keeps the menu open when clicking a group header", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    // Group headers are dead click areas; the menu must stay open.
    await page.getByText("Results", { exact: true }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
  });

  test("closes on an outside click", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.getByTestId("outside-target").click();
    await expect(page.getByRole("listbox")).toBeHidden();
  });

  test("renders href items as links", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.click();
    const link = page.getByRole("option", { name: "Carbon docs" });
    await expect(link).toHaveJSProperty("tagName", "A");
    await expect(link).toHaveAttribute("href", "#carbon-docs");
  });
});
