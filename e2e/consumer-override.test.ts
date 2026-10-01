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
    // The pointer starts at (0,0), on top of the first button, so its hover
    // rule would win the static assertions. Park it in empty space.
    const size = page.viewportSize() ?? { width: 1280, height: 720 };
    await page.mouse.move(size.width - 1, size.height - 1);
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
      // loses to `.bx--btn--icon-only.bx--tooltip__trigger.bx--btn svg` (0,3,1)
      test.fail();
      await expect(page.getByTestId("icon-btn").locator("svg")).toHaveCSS(
        "fill",
        RED,
      );
    });
  });

  test.describe("button icon path", () => {
    test("icon-only icon path fill", async ({ page }) => {
      // loses to `.bx--btn--ghost.bx--btn--icon-only .bx--btn__icon
      // path:not([data-icon-path]):not([fill=none])` (0,5,1), which sets
      // `fill` on the path itself, so a consumer `fill` on the svg never
      // reaches it
      test.fail();
      await expect(
        page.getByTestId("icon-btn").locator("svg path").first(),
      ).toHaveCSS("fill", RED);
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
      await expect(link(page, 0)).toHaveCSS("border-bottom-color", RED);
    });
  });

  test.describe("tabs container", () => {
    test("tab background", async ({ page }) => {
      // loses to `.bx--tabs--container .bx--tabs__nav-item` (0,2,0)
      test.fail();
      await expect(
        page.getByTestId("tabs-container").locator(".my-container-tab").nth(1),
      ).toHaveCSS("background-color", PINK);
    });

    test("selected tab background", async ({ page }) => {
      // loses to `.bx--tabs--container .bx--tabs__nav-item--selected:not(.bx--tabs__nav-item--disabled)` (0,3,0)
      test.fail();
      await expect(
        page.getByTestId("tabs-container").locator(".my-container-tab").first(),
      ).toHaveCSS("background-color", PINK);
    });
  });

  test.describe("data-table zebra", () => {
    test("rowClass background", async ({ page }) => {
      // loses to `.bx--data-table--zebra>tbody>tr:not(.bx--parent-row):nth-child(even)>td` (0,3,3)
      test.fail();
      const td = page
        .getByTestId("table-zebra")
        .locator("tbody tr")
        .nth(1)
        .locator("td")
        .last();
      await expect(td).toHaveCSS("background-color", PINK);
    });
  });

  test.describe("notification", () => {
    test("toast icon fill", async ({ page }) => {
      // loses to `.bx--toast-notification--success .bx--toast-notification__icon` (0,2,0)
      test.fail();
      await expect(page.getByTestId("toast").locator("svg").first()).toHaveCSS(
        "fill",
        RED,
      );
    });

    test("toast link color", async ({ page }) => {
      // loses to `.bx--toast-notification:not(.bx--toast-notification--low-contrast) a` (0,2,1)
      test.fail();
      await expect(page.getByTestId("toast-link")).toHaveCSS("color", RED);
    });

    test("low-contrast toast background", async ({ page }) => {
      // loses to `.bx--toast-notification--low-contrast.bx--toast-notification--info` (0,2,0)
      test.fail();
      await expect(page.getByTestId("toast-low")).toHaveCSS(
        "background-color",
        PINK,
      );
    });

    test("inline icon fill", async ({ page }) => {
      // loses to `.bx--inline-notification--error .bx--inline-notification__icon` (0,2,0)
      test.fail();
      await expect(page.getByTestId("inline").locator("svg").first()).toHaveCSS(
        "fill",
        RED,
      );
    });
  });
});

test.describe("consumer override in context", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/consumer-override-contexts.html");
  });

  test("side nav link text color", async ({ page }) => {
    // loses to `.bx--side-nav__link>.bx--side-nav__link-text` (0,2,0)
    test.fail();
    await expect(
      page.getByTestId("side-link").locator("span").first(),
    ).toHaveCSS("color", RED);
  });

  test("text input background inside a modal", async ({ page }) => {
    // loses to `.bx--modal .bx--text-input` (0,2,0); needs `@layer` or a
    // token-based layer context, not a flatten, so it stays a documented gap
    test.fail();
    await expect(page.getByTestId("modal-input")).toHaveCSS(
      "background-color",
      PINK,
    );
  });
});
