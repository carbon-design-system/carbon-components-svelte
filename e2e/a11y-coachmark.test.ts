import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const violations = (page: Page) =>
  new AxeBuilder({ page }).include("#app").analyze();

test.describe("Coachmark a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/coachmark.html");
    await page.evaluate(() =>
      localStorage.setItem("e2e-coachmark-seen", "true"),
    );
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Show coachmark" }).first(),
    ).toBeVisible();

    expect((await violations(page)).violations).toEqual([]);

    await page.getByRole("button", { name: "Show coachmark" }).first().click();
    await expect(page.locator("#cm-basic-content")).toBeVisible();
    expect((await violations(page)).violations).toEqual([]);
  });

  test("has none for a tab's portalled coachmark and a tour stop", async ({
    page,
  }) => {
    await page.goto("/coachmark.html");
    await page.getByTestId("show-tab-tip").click();
    await expect(page.locator("#cm-tab-content")).toBeVisible();
    expect((await violations(page)).violations).toEqual([]);

    await page.getByTestId("start-tour").click();
    await expect(page.locator("#cm-tour-0-content")).toBeVisible();
    expect((await violations(page)).violations).toEqual([]);
  });

  test("has none inside a Modal", async ({ page }) => {
    await page.goto("/coachmark-edge.html");
    await page.getByTestId("open-modal").click();
    await page
      .getByTestId("cm-modal")
      .getByRole("button", { name: "Show coachmark" })
      .click();
    await expect(page.locator("#cm-modal-content")).toBeVisible();

    expect((await violations(page)).violations).toEqual([]);
  });
});
