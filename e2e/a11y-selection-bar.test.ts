import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function check(page: Page, theme: string) {
  await page.evaluate(
    (theme) => document.documentElement.setAttribute("theme", theme),
    theme,
  );
  await expect(page.getByTestId("bar")).toBeVisible();
  const results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);
}

test.describe("SelectionBar a11y", () => {
  for (const theme of ["white", "g100"]) {
    test(`has no detectable accessibility violations in ${theme}`, async ({
      page,
    }) => {
      await page.goto("/selection-bar.html");
      await check(page, theme);
    });

    test(`has no detectable accessibility violations pinned, in ${theme}`, async ({
      page,
    }) => {
      await page.goto("/selection-bar.html?pinned");
      await check(page, theme);
    });
  }
});
