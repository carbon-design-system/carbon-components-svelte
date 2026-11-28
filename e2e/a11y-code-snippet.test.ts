import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("CodeSnippet a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/code-snippet.html");
    await expect(page.getByTestId("snippet-single")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page
      .getByTestId("multi-snippet")
      .getByRole("button", { name: "Show more" })
      .click();
    await expect(
      page.getByTestId("multi-snippet").getByRole("button", {
        name: "Show less",
      }),
    ).toBeVisible();

    const expandedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(expandedResults.violations).toEqual([]);
  });

  for (const theme of ["white", "g100"]) {
    test(`a preview and its bar have no violations in ${theme}`, async ({
      page,
    }) => {
      await page.goto("/code-snippet-preview.html");
      await page.evaluate(
        (theme) => document.documentElement.setAttribute("theme", theme),
        theme,
      );
      await expect(page.getByTestId("snippet-actions")).toBeVisible();
      // Disabled text is exempt from contrast (WCAG 1.4.3), and axe can't
      // tell that a disabled snippet's code is disabled.
      const axe = () =>
        new AxeBuilder({ page })
          .include("#app")
          .exclude("[data-testid=disabled]")
          .analyze();
      const before = await axe();
      expect(before.violations).toEqual([]);

      await page
        .getByTestId("snippet-actions")
        .getByRole("button", { name: "Simulate saving" })
        .click();
      const running = await axe();
      expect(running.violations).toEqual([]);
    });
  }
});
