import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("SelectableTagGroup", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/selectable-tag-group.html");
    await expect(page.getByRole("toolbar", { name: "Status" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("is one tab stop; arrows move and Space toggles", async ({ page }) => {
    await page.goto("/selectable-tag-group.html");
    const status = page.getByRole("toolbar", { name: "Status" });
    const closed = status.getByRole("button", { name: "Closed" });

    await expect(status.locator('[tabindex="0"]')).toHaveCount(1);
    await status.getByRole("button", { name: "Open" }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(closed).toBeFocused();
    // Tab leaves the group for the next group's tab stop.
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("toolbar", { name: "Priority" }).getByRole("button", {
        name: "Medium",
      }),
    ).toBeFocused();
    await closed.focus();

    await page.keyboard.press("Space");
    await expect(closed).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("status-value")).toHaveText(
      '["open","closed"]',
    );
  });

  test("keeps the last tag of a required single group", async ({ page }) => {
    await page.goto("/selectable-tag-group.html");
    const priority = page.getByRole("toolbar", { name: "Priority" });

    await priority.getByRole("button", { name: "Medium" }).click();
    await expect(
      priority.getByRole("button", { name: "Medium" }),
    ).toHaveAttribute("aria-pressed", "true");

    await priority.getByRole("button", { name: "High" }).click();
    await expect(
      priority.getByRole("button", { name: "Medium" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("wraps in a narrow parent instead of overflowing", async ({ page }) => {
    await page.setViewportSize({ width: 200, height: 600 });
    await page.goto("/selectable-tag-group.html");
    const status = page.getByTestId("status");

    const rows = await status
      .getByRole("button")
      .evaluateAll((tags) => new Set(tags.map((tag) => tag.offsetTop)).size);
    expect(rows).toBeGreaterThan(1);

    const { scrollWidth, clientWidth } = await status.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("lays tags out from the inline start in RTL", async ({ page }) => {
    await page.goto("/selectable-tag-group.html");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const status = page.getByTestId("status");

    const first = await status
      .getByRole("button", { name: "Open" })
      .boundingBox();
    const second = await status
      .getByRole("button", { name: "In progress" })
      .boundingBox();
    expect(first && second && first.x > second.x).toBe(true);
  });

  test("marks the selected tag in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/selectable-tag-group.html");
    const status = page.getByTestId("status");

    const colors = await status.getByRole("button").evaluateAll((tags) =>
      tags.map((tag) => {
        const s = getComputedStyle(tag);
        return `${s.backgroundColor}|${s.color}`;
      }),
    );
    // Open is selected; every other tag differs from it.
    expect(colors.slice(1).every((color) => color !== colors[0])).toBe(true);
  });
});
