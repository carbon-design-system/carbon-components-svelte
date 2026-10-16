import { expect, test } from "@playwright/test";

// The layout follows the notification's width, not the window's. On a wide
// window, a notification in an 18rem card kept its action beside the
// text, squeezing the subtitle into a narrow column.
test.use({ viewport: { width: 1440, height: 900 } });

test("a narrow notification moves its action under the text", async ({
  page,
}) => {
  await page.goto("/inline-notification-width.html");
  await expect(page.locator(".bx--inline-notification")).toHaveCount(2);

  const layout = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-width]")].map((box) => {
      const rect = (selector: string) =>
        box.querySelector(selector)?.getBoundingClientRect() as DOMRect;
      const details = rect(".bx--inline-notification__details");
      const action = rect(".bx--inline-notification__action-button");
      const close = rect(".bx--inline-notification__close-button");
      const notification = rect(".bx--inline-notification");
      return {
        width: Number(box.dataset.width),
        actionBelow: action.top >= details.bottom - 1,
        detailsShare: details.width / notification.width,
        closeInCorner:
          Math.abs(close.top - notification.top) < 1 &&
          Math.abs(close.right - notification.right) < 1,
      };
    }),
  );

  const [narrow, wide] = layout;
  expect(narrow.actionBelow).toBe(true);
  expect(narrow.detailsShare).toBeGreaterThan(0.7);
  expect(narrow.closeInCorner).toBe(true);
  // A wide one keeps the action on the text's line.
  expect(wide.actionBelow).toBe(false);
});
