import { expect, test } from "./helpers/host";

// A slot passed with content that renders nothing (a false `{#if}`) still
// renders its wrapper, which kept its margin, padding or gap.
const wrappers = [
  ["empty-state", ".bx--empty-state__illustration"],
  ["empty-state", ".bx--empty-state__actions"],
  ["big-number", ".bx--big-number__action"],
  ["big-number", ".bx--big-number__footer"],
  ["page-header", ".bx--page-header__breadcrumb-row"],
  ["page-header", ".bx--page-header__title-start"],
  ["page-header", ".bx--page-header__title-end"],
  ["page-header", ".bx--page-header__description"],
  ["page-header", ".bx--page-header__meta"],
  ["page-header", ".bx--page-header__tabs-row"],
  ["page-header-tabs-end", ".bx--page-header__tabs-end"],
  ["data-table", ".bx--child-row-inner-container"],
  ["timeline", ".bx--timeline__description"],
  ["search-menu", ".bx--search-menu-group__action"],
] as const;

test("hides slot wrappers whose content renders nothing", async ({ page }) => {
  await page.goto("/empty-slots.html");
  const searchMenu = page.getByTestId("search-menu");
  await searchMenu.locator("input").focus();
  await expect(
    searchMenu.locator(".bx--search-menu-group__header"),
  ).toBeVisible();
  const displays = await page.evaluate(
    (list) =>
      list.map(([testId, selector]) => {
        const el = document.querySelector(
          `[data-testid="${testId}"] ${selector}`,
        );
        return [testId, selector, el ? getComputedStyle(el).display : null];
      }),
    wrappers,
  );
  expect(displays).toEqual(
    wrappers.map(([testId, selector]) => [testId, selector, "none"]),
  );
});
