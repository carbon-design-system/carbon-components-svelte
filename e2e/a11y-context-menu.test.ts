import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ContextMenu a11y", () => {
  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.goto("/context-menu.html");
    await page.getByTestId("context-target").click({ button: "right" });
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Option 1" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
