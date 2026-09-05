import { expect, test } from "@playwright/test";

/**
 * Pass/fail definition of "easy to override": a consumer rule made of one
 * custom class (plus a state or one child element) must beat the library's
 * rule for the same property. Fixture: e2e/fixtures/consumer-override.css.
 *
 * Cases marked `test.fail()` are library selectors that still out-weigh a
 * single-class consumer rule; flip the mark when the selector is flattened.
 */

const RED = "rgb(200, 0, 0)";
const RED_HOVER = "rgb(150, 0, 0)";
const GRAY = "rgb(100, 100, 100)";
const PINK = "rgb(255, 230, 230)";
const PINK_HOVER = "rgb(255, 200, 200)";

test.describe("consumer override", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/consumer-override.html");
  });

  test.describe("button", () => {
    test("background", async ({ page }) => {
      await expect(page.getByTestId("btn")).toHaveCSS("background-color", RED);
    });

    test("hover background", async ({ page }) => {
      const btn = page.getByTestId("btn");
      await btn.hover();
      await expect(btn).toHaveCSS("background-color", RED_HOVER);
    });

    test("disabled background", async ({ page }) => {
      await expect(page.getByTestId("btn-disabled")).toHaveCSS(
        "background-color",
        GRAY,
      );
    });

    test("icon-only focus border", async ({ page }) => {
      const btn = page.getByTestId("icon-btn");
      await btn.focus();
      await expect(btn).toHaveCSS("border-top-color", RED);
    });

    test("icon-only icon fill", async ({ page }) => {
      // loses to `.bx--btn--ghost.bx--btn--icon-only .bx--btn__icon` (0,3,0)
      test.fail();
      await expect(page.getByTestId("icon-btn").locator("svg")).toHaveCSS(
        "fill",
        RED,
      );
    });
  });

  test.describe("link", () => {
    test("color", async ({ page }) => {
      await expect(page.getByTestId("link")).toHaveCSS("color", RED);
    });

    test("hover color", async ({ page }) => {
      const link = page.getByTestId("link");
      await link.hover();
      await expect(link).toHaveCSS("color", RED_HOVER);
    });

    test("inline link text-decoration", async ({ page }) => {
      // loses to `.bx--link.bx--link--inline` (0,2,0)
      test.fail();
      await expect(page.getByTestId("link-inline")).toHaveCSS(
        "text-decoration-line",
        "none",
      );
    });
  });

  test.describe("tag", () => {
    test("border and background", async ({ page }) => {
      const tag = page.getByTestId("tag");
      await expect(tag).toHaveCSS("border-top-color", RED);
      await expect(tag).toHaveCSS("background-color", PINK);
    });
  });

  test.describe("data-table", () => {
    const cell = (page: import("@playwright/test").Page, row: number) =>
      page
        .getByTestId("table")
        .locator("tbody tr")
        .nth(row)
        .locator("td")
        .last();

    test("row background", async ({ page }) => {
      await expect(cell(page, 0)).toHaveCSS("background-color", PINK);
    });

    test("selected row background", async ({ page }) => {
      // loses to `tr.bx--data-table--selected td` (0,1,2)
      test.fail();
      await expect(cell(page, 1)).toHaveCSS("background-color", PINK);
    });

    test("hover row background", async ({ page }) => {
      // loses to `.bx--data-table tbody tr:hover td` (0,2,3)
      test.fail();
      const td = cell(page, 2);
      await td.hover();
      await expect(td).toHaveCSS("background-color", PINK_HOVER);
    });
  });

  test.describe("tabs", () => {
    const link = (page: import("@playwright/test").Page, i: number) =>
      page.getByTestId("tabs").locator(".my-tab a").nth(i);

    test("unselected tab underline", async ({ page }) => {
      await expect(link(page, 1)).toHaveCSS("border-bottom-color", RED);
    });

    test("selected tab underline", async ({ page }) => {
      // loses to `.bx--tabs__nav-item--selected:not(...) .bx--tabs__nav-link` (0,3,0)
      test.fail();
      await expect(link(page, 0)).toHaveCSS("border-bottom-color", RED);
    });
  });
});
