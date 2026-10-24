import { expect, test } from "@playwright/test";

// A menu that a scrolling panel or an `overflow: hidden` card would cut off
// opens in a portal instead, so it shows whole and the panel doesn't grow a
// scrollbar; one with nothing around it stays in place.
const MENU = ".bx--list-box__menu, .bx--overflow-menu-options";

for (const box of ["scroll", "card"])
  for (const [name, selector] of [
    ["Dropdown", ".bx--dropdown .bx--list-box__field"],
    ["ComboBox", ".bx--combo-box input"],
    ["MultiSelect", ".bx--multi-select .bx--list-box__field"],
    ["OverflowMenu", ".bx--overflow-menu"],
  ] as const)
    test(`${name} in a ${box} box opens in full view`, async ({ page }) => {
      await page.setViewportSize({ width: 1100, height: 800 });
      await page.goto("/portal-when-clipped.html");
      const container = page.getByTestId(box);
      await container.locator(selector).click();
      const menu = page.locator(MENU).first();
      await expect(menu).toBeVisible();
      // Every corner of the menu shows: nothing cuts it off.
      const hidden = await menu.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return [
          [r.left + 4, r.top + 4],
          [r.right - 4, r.top + 4],
          [r.left + 4, r.bottom - 4],
          [r.right - 4, r.bottom - 4],
        ].filter(([x, y]) => !el.contains(document.elementFromPoint(x, y)));
      });
      expect(hidden).toEqual([]);
      const scroll = await container.evaluate(
        (el) => el.scrollHeight - el.clientHeight,
      );
      expect(scroll).toBeLessThanOrEqual(1);
    });

test("a dropdown with nothing around it stays in place", async ({ page }) => {
  await page.goto("/portal-when-clipped.html");
  const plain = page.getByTestId("plain");
  await plain.locator(".bx--list-box__field").click();
  await expect(plain.locator(".bx--list-box__menu")).toBeVisible();
});
