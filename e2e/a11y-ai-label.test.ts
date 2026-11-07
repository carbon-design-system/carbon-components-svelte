import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("AILabel a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/ai-label.html");

    // Closed labels: default, inline, in fields, a revert button, a tag and
    // a tile.
    const closed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(closed.violations).toEqual([]);

    // The open explanation, with its actions bar.
    await page
      .getByTestId("default")
      .getByRole("button", { name: "AI Show information" })
      .click();
    await expect(page.getByText("View details")).toBeVisible();
    // The click leaves the label hovered, so its fill fades in. Scan once
    // it settles: mid-fade, axe reads the text against a half-blended
    // background and reports a contrast failure.
    await page
      .locator("#app")
      .evaluate((app) =>
        Promise.all(
          app.getAnimations({ subtree: true }).map((a) => a.finished),
        ),
      );
    const open = await new AxeBuilder({ page }).include("#app").analyze();
    expect(open.violations).toEqual([]);

    // In RTL the parts swap sides; names and roles stay the same.
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const rtl = await new AxeBuilder({ page }).include("#app").analyze();
    expect(rtl.violations).toEqual([]);
  });
});
