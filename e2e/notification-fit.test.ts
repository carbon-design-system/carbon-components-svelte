import { expect, test } from "./helpers/host";

/**
 * Inline and toast notifications fit a container narrower than their
 * usual 288px, rather than spilling out of it.
 */
test("notifications fit a narrow container", async ({ page }) => {
  await page.goto("/notification-fit.html");

  for (const id of ["inline-200", "inline-320", "toast-200", "toast-320"]) {
    const box = page.getByTestId(id);
    const outer = await box.boundingBox();
    const notification = await box
      .locator(".bx--inline-notification, .bx--toast-notification")
      .boundingBox();
    expect.soft(outer && notification, `${id} rendered`).toBeTruthy();
    if (!outer || !notification) continue;
    expect
      .soft(notification.x + notification.width, `${id} right edge`)
      .toBeLessThanOrEqual(outer.x + outer.width + 0.5);
  }
});

test("an inline notification keeps its width in a parent that sizes to it", async ({
  page,
}) => {
  await page.goto("/notification-fit.html");
  const notification = await page
    .getByTestId("inline-shrink")
    .locator(".bx--inline-notification")
    .boundingBox();
  // Its 288px floor, plus the status border on the left.
  expect(notification?.width).toBeGreaterThanOrEqual(288);
  expect(notification?.width).toBeLessThanOrEqual(294);
});
