import { expect, test } from "@playwright/test";

test.describe("ComposedModal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/composed-modal.html");
  });

  test("does not show content when closed", async ({ page }) => {
    const modal = page.locator(".bx--modal");
    await expect(modal).not.toHaveClass(/is-visible/);
  });

  test("shows content when opened", async ({ page }) => {
    await page.getByTestId("open-modal").click();

    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);
    await expect(page.getByTestId("modal-body")).toHaveText("Modal content");
  });

  test("closes when close button is clicked", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);

    await page.getByTestId("close-modal").click();
    await expect(page.locator(".bx--modal")).not.toHaveClass(/is-visible/);
  });

  test("closes when Escape is pressed", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);
    await page.waitForTimeout(400);

    await page.getByTestId("modal-primary-focus").focus();
    await page.keyboard.press("Escape");
    await expect(page.locator(".bx--modal")).not.toHaveClass(/is-visible/);
  });

  test("primary focus element is focusable when opened", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);

    const primaryFocus = page.getByTestId("modal-primary-focus");
    await primaryFocus.focus();
    await expect(primaryFocus).toBeFocused();
  });

  test("does not close when mousedown inside modal and mouseup outside", async ({
    page,
  }) => {
    await page.getByTestId("open-modal").click();
    const modal = page.locator(".bx--modal");
    await expect(modal).toHaveClass(/is-visible/);

    const container = page.locator(".bx--modal-container");
    const containerBox = await container.boundingBox();
    const modalBox = await modal.boundingBox();
    if (containerBox == null || modalBox == null) {
      throw new Error("expected modal container and modal bounding boxes");
    }

    // mousedown inside the modal container, then mouseup on the backdrop
    await page.mouse.move(
      containerBox.x + containerBox.width / 2,
      containerBox.y + containerBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(modalBox.x + 5, modalBox.y + 5);
    await page.mouse.up();

    await expect(modal).toHaveClass(/is-visible/);
  });

  test("closes when clicking directly on the backdrop", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    const modal = page.locator(".bx--modal");
    await expect(modal).toHaveClass(/is-visible/);

    const modalBox = await modal.boundingBox();
    if (modalBox == null) {
      throw new Error("expected modal bounding box");
    }

    // click directly on the backdrop (outside the container)
    await page.mouse.click(modalBox.x + 5, modalBox.y + 5);
    await expect(modal).not.toHaveClass(/is-visible/);
  });

  test("traps focus with Tab", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);

    const primaryFocus = page.getByTestId("modal-primary-focus");
    const footerClose = page.getByTestId("close-modal");
    const headerClose = page.locator(".bx--modal-close");

    // ComposedModal moves focus in a transitionend handler; wait for that
    // before sending Tab so we do not race parallel updates.
    await expect
      .poll(
        async () =>
          primaryFocus.evaluate((el) => el === document.activeElement),
        { timeout: 10_000 },
      )
      .toBeTruthy();

    await page.keyboard.press("Tab");
    await expect(footerClose).toBeFocused({ timeout: 10_000 });

    await page.keyboard.press("Tab");
    await expect(headerClose).toBeFocused({ timeout: 10_000 });

    await page.keyboard.press("Tab");
    await expect(primaryFocus).toBeFocused({ timeout: 10_000 });
  });
});
