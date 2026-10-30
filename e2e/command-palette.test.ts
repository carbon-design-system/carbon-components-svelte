import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const highlighted = ".bx--command-palette__item--highlighted";

/** Whether the highlighted option sits fully inside the list's viewport. */
function highlightInView(page: Page) {
  return page.evaluate((selector) => {
    const list = document.querySelector(".bx--command-palette__list");
    const option = document.querySelector(selector);
    if (!list || !option) return false;
    const outer = list.getBoundingClientRect();
    const inner = option.getBoundingClientRect();
    return inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
  }, highlighted);
}

test("runs the highlighted command and gives focus back after the exit", async ({
  page,
}) => {
  await page.goto("/command-palette.html");
  const trigger = page.getByTestId("trigger");
  await trigger.click();

  const input = page.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.pressSequentially("rest");
  await expect(page.locator(highlighted)).toHaveText("Restart service");

  await page.keyboard.press("Enter");
  await expect(page.getByTestId("selected")).toHaveText("Restart service");
  await expect(page.locator(".bx--command-palette")).not.toHaveClass(
    /bx--command-palette--open/,
  );
  await expect(trigger).toBeFocused();
  await expect(page.locator('[role="option"]')).toHaveCount(0);
  await expect(input).toHaveValue("");
});

test("keeps the keyboard highlight in view in a virtualized list", async ({
  page,
}) => {
  await page.goto("/command-palette.html?large&open");
  await expect(page.locator(highlighted)).toHaveText("service-0");

  // Up from the first option wraps to the last, past the rendered window.
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(highlighted)).toHaveText("service-999");
  await expect.poll(() => highlightInView(page)).toBe(true);

  await page.keyboard.press("PageUp");
  await page.keyboard.press("PageUp");
  await page.keyboard.press("PageUp");
  await expect(page.locator(highlighted)).toHaveText("service-969");
  await expect.poll(() => highlightInView(page)).toBe(true);

  await expect(page.locator('[role="option"]').first()).toHaveAttribute(
    "aria-setsize",
    "1000",
  );
  expect(await page.locator('[role="option"]').count()).toBeLessThan(40);
});

test("mirrors the icon, the highlight bar and the key caps in RTL", async ({
  page,
}) => {
  const measure = () =>
    page.evaluate(() => {
      const container = document
        .querySelector(".bx--command-palette__container")
        ?.getBoundingClientRect();
      const row = document.querySelector(
        ".bx--command-palette__item--highlighted",
      );
      const icon = row
        ?.querySelector(".bx--command-palette__item-icon")
        ?.getBoundingClientRect();
      const keys = row
        ?.querySelector(".bx--command-palette__shortcut")
        ?.getBoundingClientRect();
      if (!container || !row || !icon || !keys) throw new Error("no row");
      return {
        icon: [icon.left - container.left, container.right - icon.right],
        keys: [keys.left - container.left, container.right - keys.right],
        bar: getComputedStyle(row).boxShadow,
        // Key caps from left to right on screen.
        caps: [...row.querySelectorAll("kbd")]
          .sort(
            (a, b) =>
              a.getBoundingClientRect().left - b.getBoundingClientRect().left,
          )
          .map((key) => key.textContent),
      };
    });

  await page.goto("/command-palette.html?open");
  const ltr = await measure();
  await page.goto("/command-palette.html?open&rtl");
  const rtl = await measure();

  expect(rtl.icon[1]).toBeCloseTo(ltr.icon[0], 0);
  expect(rtl.keys[0]).toBeCloseTo(ltr.keys[1], 0);
  expect(ltr.bar).toContain("3px 0px 0px 0px inset");
  expect(rtl.bar).toContain("-3px 0px 0px 0px inset");
  // Key names read left to right in any language.
  expect(rtl.caps).toEqual(ltr.caps);
});
