import AxeBuilder from "@axe-core/playwright";
import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** A number field is a spinbutton, and a formatted one a textbox. */
const input = (scope: Locator, side: "Minimum" | "Maximum") =>
  scope.locator(`input:not([type=hidden])[aria-label^="${side}"]`);

test.describe("NumberRangeInput a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/number-range-input.html");
    await expect(page.getByTestId("nri-default")).toBeVisible();
  });

  for (const theme of ["white", "g100"]) {
    for (const dir of ["ltr", "rtl"]) {
      test(`has no detectable accessibility violations in ${theme} ${dir}`, async ({
        page,
      }) => {
        await page.evaluate(
          ([theme, dir]) => {
            document.documentElement.dir = dir;
            if (theme === "g100") {
              document.documentElement.classList.add("bx--g100");
            }
          },
          [theme, dir],
        );
        // Show an error and a crossed pair too, so those states are checked.
        const group = page.getByTestId("nri-default");
        await input(group, "Maximum").fill("5000");
        await page.keyboard.press("Tab");
        // Axe reads colors, so let the theme's color transitions finish.
        await page.evaluate(() =>
          Promise.all(document.getAnimations().map((a) => a.finished)),
        );

        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  }
});
