import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("Masonry a11y", () => {
  for (const theme of ["white", "g100"]) {
    test(`has no detectable accessibility violations in ${theme}`, async ({
      page,
    }) => {
      await page.goto("/masonry.html");
      await expect(page.getByTestId("js")).toHaveClass(/bx--masonry--placed/);
      await page.evaluate(
        (theme) => document.documentElement.setAttribute("theme", theme),
        theme,
      );

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test("adds no role or name of its own", async ({ page }) => {
    await page.goto("/masonry.html");
    const attributes = await page
      .getByTestId("js")
      .evaluate((el) => [...el.attributes].map((attr) => attr.name).sort());
    expect(attributes).toEqual(["class", "data-testid", "style"]);
  });
});
