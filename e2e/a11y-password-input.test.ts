import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("PasswordInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/password-input.html");
    await expect(page.getByTestId("password-input")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(page.getByTestId("password-input")).toHaveAttribute(
      "type",
      "text",
    );
    // The click leaves the toggle hovered and focused, so its "Hide password"
    // tooltip fades in. Scan once it is opaque: mid-fade, axe reads the text
    // against a half-transparent background and reports a contrast failure.
    await page
      .locator("#app")
      .evaluate((app) =>
        Promise.all(
          app.getAnimations({ subtree: true }).map((a) => a.finished),
        ),
      );

    const revealedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(revealedResults.violations).toEqual([]);
  });
});
