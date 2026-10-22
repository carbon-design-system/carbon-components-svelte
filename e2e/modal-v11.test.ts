import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function openModal(page: Page) {
  await page.goto("/modal-v11.html");
  await page.getByTestId("open-modal").click();
  await expect(page.getByTestId("modal")).toHaveClass(/is-visible/);
}

test.describe("Modal loadingStatus", () => {
  test("shows each status in the primary button", async ({ page }) => {
    await openModal(page);
    const footer = page.locator('[data-testid="modal"] .bx--modal-footer');
    const primary = footer.locator(".bx--btn--primary");
    const cancel = footer.getByRole("button", { name: "Cancel" });

    await expect(primary).toHaveText("Save");
    await expect(footer).not.toHaveAttribute("aria-busy");

    await page.getByTestId("status-active").click();
    await expect(primary.locator(".bx--loading")).toBeVisible();
    await expect(primary).toBeDisabled();
    await expect(cancel).toBeDisabled();
    await expect(footer).toHaveAttribute("aria-busy", "true");

    await page.getByTestId("status-error").click();
    await expect(primary.locator(".bx--inline-loading--error")).toBeVisible();
    await expect(footer).not.toHaveAttribute("aria-busy");

    await page.getByTestId("status-finished").click();
    await expect(
      primary.locator(".bx--inline-loading__checkmark-container"),
    ).toBeVisible();
    await expect(page.getByTestId("success-count")).toHaveText("1", {
      timeout: 4000,
    });

    await page.getByTestId("status-inactive").click();
    await expect(primary).toHaveText("Save");
    await expect(primary).toBeEnabled();
  });

  test("sets aria-busy on the ComposedModal footer", async ({ page }) => {
    await page.goto("/modal-v11.html");
    await page.getByTestId("open-composed-modal").click();
    const footer = page.locator(
      '[data-testid="composed-modal"] .bx--modal-footer',
    );

    await expect(footer).toHaveAttribute("aria-busy", "true");
    await expect(
      footer.locator(".bx--btn--primary .bx--loading"),
    ).toBeVisible();
  });
});

test.describe("Modal close button tooltip", () => {
  for (const { name, trigger, root, label } of [
    {
      name: "Modal",
      trigger: "open-modal",
      root: "modal",
      label: "Close the modal",
    },
    {
      name: "ComposedModal",
      trigger: "open-composed-modal",
      root: "composed-modal",
      label: "Close",
    },
  ]) {
    test(`${name}: shows the label to the left on hover`, async ({ page }) => {
      await page.goto("/modal-v11.html");
      await page.getByTestId(trigger).click();
      const close = page.getByTestId(root).getByRole("button", { name: label });
      const tooltip = page.locator(".bx--tooltip-portal__content");

      await expect(tooltip).toHaveCount(0);
      await close.hover();

      await expect(tooltip).toHaveText(label);
      const closeLeft = (await close.boundingBox())?.x ?? 0;
      const tooltipBox = await tooltip.boundingBox();
      expect(tooltipBox).not.toBeNull();
      expect(
        (tooltipBox?.x ?? 0) + (tooltipBox?.width ?? 0),
      ).toBeLessThanOrEqual(closeLeft);
    });

    test(`${name}: Escape hides the tooltip, then closes the modal`, async ({
      page,
    }) => {
      await page.goto("/modal-v11.html");
      await page.getByTestId(trigger).click();
      const modal = page.getByTestId(root);
      await expect(modal).toHaveClass(/is-visible/);
      const close = modal.getByRole("button", { name: label });
      const tooltip = page.locator(".bx--tooltip-portal__content");

      await close.focus();
      await expect(tooltip).toHaveText(label);

      await page.keyboard.press("Escape");
      await expect(tooltip).toHaveCount(0);
      await expect(modal).toHaveClass(/is-visible/);
      await expect(close).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(modal).not.toHaveClass(/is-visible/);
    });
  }
});

test.describe("Passive modal close button as initial focus", () => {
  for (const opener of ["click", "keyboard"] as const) {
    test(`closes on one Escape when opened by ${opener}`, async ({ page }) => {
      await page.goto("/modal-v11.html");
      const trigger = page.getByTestId("open-passive-modal");
      if (opener === "click") {
        await trigger.click();
      } else {
        await trigger.focus();
        await page.keyboard.press("Enter");
      }
      const modal = page.getByTestId("passive-modal");
      const close = modal.getByRole("button", { name: "Close the modal" });
      await expect(close).toBeFocused();
      await expect(page.locator(".bx--tooltip-portal__content")).toHaveCount(0);

      await page.keyboard.press("Escape");
      await expect(modal).not.toHaveClass(/is-visible/);
    });
  }

  test("shows the tooltip when Tab brings focus back", async ({ page }) => {
    await page.goto("/modal-v11.html");
    await page.getByTestId("open-passive-modal").focus();
    await page.keyboard.press("Enter");
    const modal = page.getByTestId("passive-modal");
    const close = modal.getByRole("button", { name: "Close the modal" });
    const tooltip = page.locator(".bx--tooltip-portal__content");
    await expect(close).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(close).not.toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(close).toBeFocused();
    await expect(tooltip).toHaveText("Close the modal");

    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
    await expect(modal).toHaveClass(/is-visible/);

    await page.keyboard.press("Escape");
    await expect(modal).not.toHaveClass(/is-visible/);
  });
});

test.describe("Modal heading", () => {
  test("renders the heading as an h2", async ({ page }) => {
    await openModal(page);

    await expect(
      page
        .getByTestId("modal")
        .getByRole("heading", { level: 2, name: "Save changes" }),
    ).toBeVisible();

    await page.goto("/modal-v11.html");
    await page.getByTestId("open-composed-modal").click();
    await expect(
      page
        .getByTestId("composed-modal")
        .getByRole("heading", { level: 2, name: "Rename workspace" }),
    ).toBeVisible();
  });
});
