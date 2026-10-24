import { expect, test } from "@playwright/test";

// A Modal inside a UIShellContainer covers the container: its overlay
// fills the container and the dialog sits inside it. Carbon sizes the
// overlay in viewport units, which made it window-sized from the
// container's corner and centered the dialog off the container.
test.use({ viewport: { width: 1440, height: 900 } });

test("a modal in a contained shell covers the container", async ({ page }) => {
  await page.goto("/uishell-container-modal.html");
  const shell = page.getByTestId("shell");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const [container, overlay, box] = await Promise.all([
    shell.boundingBox(),
    shell.locator(".bx--modal").boundingBox(),
    shell.locator(".bx--modal-container").boundingBox(),
  ]);
  if (!container || !overlay || !box) throw new Error("not rendered");

  expect(overlay).toEqual(container);
  expect(box.x).toBeGreaterThanOrEqual(container.x);
  expect(box.y).toBeGreaterThanOrEqual(container.y);
  expect(box.x + box.width).toBeLessThanOrEqual(container.x + container.width);
  expect(box.y + box.height).toBeLessThanOrEqual(
    container.y + container.height,
  );
});
