import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

test.describe("CopyButton", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/copy-button.html");
  });

  test("renders copy button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Copy to clipboard" }),
    ).toBeVisible();
  });

  test("can be located by data-testid", async ({ page }) => {
    const button = page.getByTestId("copy-button");
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-label", "Copy to clipboard");
  });

  test("shows feedback on click", async ({ page }) => {
    await page.getByRole("button", { name: "Copy to clipboard" }).click();
    await expect(
      page.locator("[data-floating-portal]").getByText("Copied!"),
    ).toBeVisible();
    await expect(page.getByRole("status").first()).toHaveText("Copied!");
  });

  test("copies text when clicked", async ({ page }) => {
    await page.getByRole("button", { name: "Copy to clipboard" }).click();
    await expect(page.getByTestId("copied-value")).toContainText(
      "Hello, World!",
    );
  });

  test("swaps to feedback icon during feedback window and reverts", async ({
    page,
  }) => {
    const button = page.getByTestId("copy-button-feedback-icon");
    const feedbackIcon = button.getByTestId("feedback-icon");

    await expect(feedbackIcon).toBeHidden();
    await button.click();
    await expect(feedbackIcon).toBeVisible();
    await expect(feedbackIcon).toBeHidden();
  });

  test.describe("feedback motion", () => {
    const animationNames = (page: Page) =>
      page.evaluate(() => document.getAnimations().map((a) => a.animationName));

    // Park the pointer and focus elsewhere, so the hover description does not
    // keep the tooltip open when the feedback ends.
    const leave = async (page: Page) => {
      await page.mouse.move(600, 400);
      await page.evaluate(() =>
        (document.activeElement as HTMLElement)?.blur(),
      );
    };

    test("fades the portalled feedback in, then out, then removes it", async ({
      page,
    }) => {
      const portal = page.locator("[data-floating-portal]");
      // A click without hover or focus, so no description tooltip is open
      // and the feedback fades in. An open tooltip swaps its text in place.
      await page.getByTestId("copy-button").dispatchEvent("click");
      await leave(page);

      await expect(portal).toBeVisible();
      await expect(portal.locator(".bx--tooltip-portal")).toHaveClass(
        /bx--tooltip-portal--fade-in/,
      );
      await expect
        .poll(() => animationNames(page), { timeout: 5000, intervals: [10] })
        .toContain("hide-feedback");
      await expect(portal).toHaveCount(0);
    });

    test("fades in the feedback of a copy that follows the first", async ({
      page,
    }) => {
      const button = page.getByTestId("copy-button");
      await button.click();
      await leave(page);
      await expect(page.locator("[data-floating-portal]")).toHaveCount(0, {
        timeout: 5000,
      });

      await button.dispatchEvent("click");
      await expect
        .poll(() => animationNames(page), { intervals: [5] })
        .toContain("show-feedback");
    });

    test("swaps the feedback at once under reduced motion", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByTestId("copy-button").click();
      await leave(page);

      await expect(page.locator("[data-floating-portal]")).toBeVisible();
      expect(await animationNames(page)).not.toContain("show-feedback");
      await expect(page.locator("[data-floating-portal]")).toHaveCount(0, {
        timeout: 5000,
      });
    });
  });
});
