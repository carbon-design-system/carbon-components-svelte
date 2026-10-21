import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.beforeEach(async ({ page }) => {
  await page.goto("/callout.html");
  await expect(page.locator(".bx--inline-notification--callout")).toHaveCount(
    3,
  );
});

test("Callout has no outer margin or room for a close button", async ({
  page,
}) => {
  const layout = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-width]")].map((box) => {
      const rect = (selector: string) =>
        box.querySelector(selector)?.getBoundingClientRect() as DOMRect;
      const callout = box.querySelector(".bx--inline-notification") as Element;
      const style = getComputedStyle(callout);
      const details = rect(".bx--inline-notification__details");
      const action = rect(".bx--inline-notification__action-button");
      return {
        width: Number(box.dataset.width),
        margin: [style.marginTop, style.marginBottom],
        actionBelow: action.top >= details.bottom - 1,
        gap: callout.getBoundingClientRect().right - details.right,
      };
    }),
  );

  const [narrow, wide] = layout;
  for (const { width, margin } of layout) {
    expect.soft(margin, `${width}rem`).toEqual(["0px", "0px"]);
  }
  // A narrow callout moves the action under the text, and the text keeps
  // only the inline padding at its end, not a close button's 48px.
  expect.soft(narrow.actionBelow).toBe(true);
  expect.soft(narrow.gap).toBe(16);
  expect.soft(wide.actionBelow).toBe(false);
});

test("Callout has no detectable accessibility violations", async ({ page }) => {
  const results = await new AxeBuilder({ page }).include("#app").analyze();

  expect(results.violations).toEqual([]);
});
