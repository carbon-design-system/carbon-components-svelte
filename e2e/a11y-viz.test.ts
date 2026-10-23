import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Data visualization a11y", () => {
  for (const theme of ["white", "g10", "g90", "g100"]) {
    test(`has no detectable accessibility violations in ${theme}`, async ({
      page,
    }) => {
      await page.goto("/viz.html");
      await page.evaluate(
        (value) => document.documentElement.setAttribute("theme", value),
        theme,
      );
      await expect(page.getByTestId("viz")).toBeVisible();

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test("has no detectable accessibility violations in the data table view", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    await page
      .locator("figure")
      .filter({ hasText: "Revenue by region" })
      .last()
      .getByRole("button", { name: "Show as table" })
      .click();
    await expect(
      page.getByRole("region", { name: "Revenue by region, data table" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  // The UX pass: states, a folded legend, a pinned tooltip, the dashboard.
  const pages = [
    ["/viz-states.html", "loading and empty states"],
    ["/viz-narrow.html", "narrow containers with folded legends"],
    ["/viz-dashboard.html", "the dashboard composition"],
    ["/viz-stock.html", "the stock chart panes"],
  ] as const;
  for (const [url, what] of pages) {
    test(`has no detectable accessibility violations in ${what}`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.goto(url);
      await expect(page.locator("figure").first()).toBeVisible();

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test("has no detectable accessibility violations with a legend expanded and a tooltip pinned", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/viz-narrow.html");
    const more = page.locator(".bx--viz-legend__more").first();
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");

    const svg = page
      .locator("figure[aria-label='Line'] .bx--viz-chart__svg")
      .first();
    const box = await svg.boundingBox();
    if (!box) throw new Error("no line plot");
    // Hover first: a click pins the point under the pointer.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(
      page.locator(".bx--viz-chart-tooltip--pinned").first(),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
