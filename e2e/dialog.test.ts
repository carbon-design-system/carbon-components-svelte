import { expect, test } from "@playwright/test";

test.describe("Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dialog.html");
  });

  test("opens as a modal, moves focus inside, and dispatches an open event", async ({
    page,
  }) => {
    await page.getByTestId("open-modal").click();

    const dialog = page.getByTestId("modal-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass(/bx--dialog--modal/);
    await expect(page.getByTestId("modal-focus-target")).toBeFocused();
    await expect(page.getByTestId("modal-open-count")).toHaveText("1");
  });

  test("closes the modal on Escape with escape-key trigger and restores focus", async ({
    page,
  }) => {
    const opener = page.getByTestId("open-modal");
    await opener.click();
    await expect(page.getByTestId("modal-dialog")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByTestId("modal-dialog")).toBeHidden();
    await expect(page.getByTestId("modal-close-count")).toHaveText("1");
    await expect(page.getByTestId("modal-close-trigger")).toHaveText(
      "escape-key",
    );
    await expect(opener).toBeFocused();
  });

  test("closes with close-button trigger via form method=dialog", async ({
    page,
  }) => {
    await page.getByTestId("open-modal").click();
    await expect(page.getByTestId("modal-dialog")).toBeVisible();

    await page.getByTestId("modal-close-button").click();

    await expect(page.getByTestId("modal-dialog")).toBeHidden();
    await expect(page.getByTestId("modal-close-trigger")).toHaveText(
      "close-button",
    );
  });

  test("opens non-modally without a backdrop that blocks the rest of the page", async ({
    page,
  }) => {
    await page.getByTestId("open-non-modal").click();

    const dialog = page.getByTestId("non-modal-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toHaveClass(/bx--dialog--modal/);

    // A modal backdrop would intercept pointer events and fail this click.
    await page.getByTestId("outside-button").click();
  });
});
