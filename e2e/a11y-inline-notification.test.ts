import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("InlineNotification a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/inline-notification.html");
    await expect(page.getByTestId("inline-notification")).toBeVisible();
    // axe checks that the status icon, a role="img", has a name.
    await expect(
      page
        .getByTestId("inline-notification")
        .getByRole("img", { name: "Information" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
