import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectNoPageOverflow, expectTextFits } from "./helpers/layout";

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
  await expect(page.getByTestId("selected")).toHaveText("restart");
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
        caps: [...row.querySelectorAll(".bx--kbd__key")]
          .filter((key) => key.checkVisibility({ visibilityProperty: true }))
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

test("wraps long labels at 320 px instead of cutting them", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/command-palette.html?open&state=long");
  const container = page.locator(".bx--command-palette__container");
  await expect(container).toBeVisible();
  await expect(async () => {
    expect(await expectTextFits(container)).toBeGreaterThan(0);
  }).toPass();
  await expectNoPageOverflow(page);
});

test("keeps Tab off the options, including link options", async ({ page }) => {
  await page.goto("/command-palette.html?open&state=groups");
  const input = page.getByRole("combobox");
  await expect(input).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(input).toBeFocused();
});

test("stacks above a Modal that comes after it in the DOM", async ({
  page,
}) => {
  await page.goto("/command-palette.html?modal&first&state=groups");
  await expect(page.locator(".bx--modal.is-visible")).toBeVisible();
  await page.getByTestId("modal-trigger").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("combobox")).toBeFocused();

  const container = page.locator(".bx--command-palette__container");
  await expect
    .poll(() =>
      container.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + 20,
        );
        return node.contains(hit);
      }),
    )
    .toBe(true);

  await page.keyboard.press("Escape");
  await expect(page.locator(".bx--modal.is-visible")).toBeVisible();
  await expect(page.getByTestId("modal-trigger")).toBeFocused();
});
