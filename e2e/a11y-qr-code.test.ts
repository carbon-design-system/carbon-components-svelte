import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("QRCode a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/qr-code.html");
    await expect(page.getByTestId("qr-default")).toBeVisible();
  });

  for (const theme of ["white", "g100"]) {
    test(`has no accessibility violations in ${theme}`, async ({ page }) => {
      await page.evaluate(
        (theme) => document.documentElement.setAttribute("theme", theme),
        theme,
      );
      await page
        .getByRole("button", { name: "Can't scan? Enter this key" })
        .click();
      // Axe reads colors, which are mid-fade while the disclosure opens.
      await expect(page.locator(".bx--disclosure--expanding")).toHaveCount(0);

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
