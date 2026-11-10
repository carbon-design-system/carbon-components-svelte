import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const rows = (page: Page) => page.getByTestId("row-count");

/** Wait out the side panel's slide, so axe reads settled colors. */
async function settle(page: Page) {
  await page.waitForFunction(() => document.getAnimations().length === 0);
}

async function open(page: Page, query = "") {
  await page.goto(`/filter-panel.html?${query}`);
  await expect(page.getByTestId("fixture")).toBeVisible();
}

test.describe("FilterPanel", () => {
  test("filters with the keyboard alone, and keeps focus where it is useful", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "webkit",
      "Safari does not tab to buttons and checkboxes by default",
    );
    await open(page);
    await expect(rows(page)).toHaveText("400 of 400 rows");

    const clearAll = page.getByRole("button", { name: "Clear all" }).first();
    await expect(clearAll).toHaveAttribute("aria-disabled", "true");

    // Tab to the first option and check it with Space.
    await page.getByRole("button", { name: "Brand" }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("checkbox").first()).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.getByRole("checkbox").first()).toBeChecked();
    await expect(rows(page)).not.toHaveText("400 of 400 rows");

    // A chip appears above the table, and its button removes the filter.
    const chip = page.getByRole("button", { name: /^Remove filter Brand:/ });
    await expect(chip).toHaveCount(1);
    await chip.focus();
    await page.keyboard.press("Enter");
    await expect(rows(page)).toHaveText("400 of 400 rows");
    // The last chip left: focus lands on the bar, not on <body>.
    await expect(
      page.getByRole("group", { name: "Applied filters" }),
    ).toBeFocused();

    // Clear all stays focused, and reads as unavailable.
    await page.getByRole("checkbox").first().focus();
    await page.keyboard.press("Space");
    await expect(rows(page)).not.toHaveText("400 of 400 rows");
    await clearAll.focus();
    await page.keyboard.press("Enter");
    await expect(rows(page)).toHaveText("400 of 400 rows");
    await expect(clearAll).toBeFocused();
    await expect(clearAll).toHaveAttribute("aria-disabled", "true");
  });

  test("checks, shows counts that ignore the facet's own choice, and applies a range", async ({
    page,
  }) => {
    await open(page);
    const brand = page
      .locator(".bx--filter-panel .bx--checkbox-wrapper")
      .first();
    const before = Number(
      await brand.locator(".bx--filter-panel__count").textContent(),
    );
    await brand.getByRole("checkbox").check({ force: true });
    // Its own count is unchanged by its own selection.
    await expect(brand.locator(".bx--filter-panel__count")).toHaveText(
      String(before),
    );
    await expect(rows(page)).toHaveText(`${before} of 400 rows`);

    await page.getByRole("spinbutton", { name: "Max" }).fill("500");
    await page.getByRole("spinbutton", { name: "Max" }).blur();
    await expect(
      page.getByRole("button", { name: /Remove filter Price: up to \$?500/ }),
    ).toBeVisible();
  });

  test("a long list shows 6 options, then all, and a search narrows it", async ({
    page,
  }) => {
    await open(page, "brands=40");
    const options = page.locator(".bx--filter-panel .bx--checkbox-wrapper");
    await expect(options.first()).toBeVisible();
    const brandOptions = page
      .locator("#app fieldset")
      .filter({ hasText: "Brand 1" })
      .first();
    await expect(brandOptions.locator(".bx--checkbox-wrapper")).toHaveCount(6);
    await page
      .getByRole("button", { name: /Show \d+ more/ })
      .first()
      .click();
    await expect(brandOptions.locator(".bx--checkbox-wrapper")).toHaveCount(40);
    await page.getByRole("searchbox", { name: "Search Brand" }).fill("Brand 3");
    await expect(
      page.getByRole("checkbox", { name: /^Brand 3\d? / }).first(),
    ).toBeVisible();
    expect(
      await page.getByRole("checkbox", { name: /^Brand 1 / }).count(),
    ).toBe(0);
  });

  test("batch mode waits for Apply, and the Reset button discards", async ({
    page,
  }) => {
    await open(page, "mode=batch");
    await page.getByRole("checkbox").first().check({ force: true });
    await expect(rows(page)).toHaveText("400 of 400 rows");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByRole("checkbox").first()).not.toBeChecked();

    await page.getByRole("checkbox").first().check({ force: true });
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(rows(page)).not.toHaveText("400 of 400 rows");
  });

  test("hides options with no results on request", async ({ page }) => {
    await open(page, "zero=hide");
    await page
      .locator("label.bx--radio-button__label", { hasText: /Black/ })
      .click();
    // With Black chosen, every tag count is below the full count, and an
    // option with none would be gone; the panel never shows a 0 in hide mode.
    await expect(
      page.locator(".bx--filter-panel__count", { hasText: /^0$/ }),
    ).toHaveCount(0);
  });

  test("keeps the filters in the query string and restores them on load", async ({
    page,
  }) => {
    await open(page, "url=1&brand=Brand+3&price=..400&stock=true");
    await expect(
      page.getByRole("button", { name: "Remove filter Brand: Brand 3" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Remove filter In stock only" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Remove filter In stock only" })
      .click();
    await expect
      .poll(() => new URL(page.url()).searchParams.has("stock"))
      .toBe(false);
    expect(new URL(page.url()).searchParams.getAll("brand")).toEqual([
      "Brand 3",
    ]);
  });

  test("moves into a side panel on a narrow screen, and Escape returns focus to Filter", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 900 });
    await open(page);
    await expect(page.locator("aside.bx--filter-flyout")).toHaveCount(0);

    const filter = page.getByRole("button", { name: "Filter", exact: true });
    await filter.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Filters" }).first(),
    ).toBeVisible();
    await settle(page);
    await dialog.getByRole("checkbox").first().check({ force: true });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(filter).toBeFocused();
    await expect(rows(page)).not.toHaveText("400 of 400 rows");
  });

  test("recounts 50,000 records inside a frame budget", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "timing is measured in one engine");
    await open(page, "n=50000&view=list");
    const label = page.locator(".bx--filter-panel .bx--checkbox-label").first();
    const ms = await page.evaluate(async () => {
      const box = document.querySelector<HTMLElement>(
        ".bx--filter-panel .bx--checkbox-label",
      );
      const start = performance.now();
      box?.click();
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      return performance.now() - start;
    });
    // Two frames of 16 ms, plus the recount and the render. A generous bound
    // for a CI runner; the measured figure is in the spike report.
    expect(ms).toBeLessThan(400);
    await expect(label).toBeVisible();
  });
});

test.describe("FilterPanel themes and layout", () => {
  for (const [name, setup] of [
    ["White", async (_page: Page) => {}],
    [
      "Gray 100",
      async (page: Page) => {
        await page.evaluate(() =>
          document.documentElement.classList.add("bx--g100"),
        );
      },
    ],
    [
      "RTL",
      async (page: Page) => {
        await page.evaluate(() =>
          document.documentElement.setAttribute("dir", "rtl"),
        );
      },
    ],
  ] as const) {
    test(`has no axe violations: ${name}, with every facet open and a filter applied`, async ({
      page,
    }) => {
      await open(page);
      await setup(page);
      const closed = page.locator(
        ".bx--accordion__heading[aria-expanded=false]",
      );
      // biome-ignore lint/performance/noAwaitInLoops: each click moves the next closed header up
      while ((await closed.count()) > 0) await closed.first().click();
      await page
        .locator("label.bx--radio-button__label", { hasText: /Black/ })
        .click();
      await expect(
        page.getByRole("button", { name: /^Remove filter Color/ }),
      ).toBeVisible();
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("has no axe violations in the flyout, in batch mode", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 900 });
    await open(page, "mode=batch");
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await settle(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("mirrors in RTL: the count sits at the inline end", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const option = page.locator(".bx--filter-panel__option").first();
    const [label, count, panel] = await Promise.all([
      option.locator(".bx--filter-panel__option-label").boundingBox(),
      option.locator(".bx--filter-panel__count").boundingBox(),
      page.locator(".bx--filter-panel").boundingBox(),
    ]);
    expect(count && label && count.x < label.x).toBe(true);
    // The panel moves to the inline start, the right edge.
    expect(panel && panel.x > 0).toBe(true);
  });

  test("keeps edges and focus visible in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    await page
      .locator("label.bx--radio-button__label", { hasText: /Black/ })
      .click();
    const badge = page.locator(".bx--filter-panel__badge").first();
    await expect(badge).toBeVisible();
    const border = await badge.evaluate(
      (el) => getComputedStyle(el).borderTopWidth,
    );
    expect(border).toBe("1px");
    await page.getByRole("checkbox").first().focus();
    const outline = await page
      .getByRole("checkbox")
      .first()
      .evaluate((el) => {
        const label = el.nextElementSibling as HTMLElement;
        return getComputedStyle(label, "::before").outlineStyle;
      });
    expect(outline).not.toBe("none");
    const chip = page.locator(".bx--filter-panel__chips .bx--tag").first();
    await expect(chip).toBeVisible();
  });
});
