import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A footer of `CardAction`s drops its padding and gains a top border, the
// text actions share the row, and an icon-only action keeps its width at
// the end. CSS reads this with `:has()`, so the deprecated `actionSet` and
// `iconOnly` props give the same layout.

function layout(footer: Locator) {
  return footer.evaluate((node) => {
    const style = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return {
      padding: style.padding,
      border: style.borderTopWidth,
      actions: [...node.children].map((child) => {
        const rect = child.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          end: Math.round(box.right - rect.right),
        };
      }),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/card.html");
});

test("reads a footer of actions and an icon-only action", async ({ page }) => {
  const result = await layout(page.getByTestId("footer"));
  expect(result.padding).toBe("0px");
  expect(result.border).toBe("1px");
  const [share, open, more] = result.actions;
  expect(share.width).toBe(open.width);
  expect(share.width).toBeGreaterThan(more.width);
  expect(more).toEqual({ width: 48, end: 0 });
});

test("lays out the same with the deprecated props", async ({ page }) => {
  const [plain, props] = await Promise.all([
    layout(page.getByTestId("footer")),
    layout(page.getByTestId("footer-props")),
  ]);
  expect(props).toEqual(plain);
});
