import { expect, test } from "./helpers/host";

/**
 * A field's invalid or warning icon must stay clear of the field's own
 * controls: clear buttons, steppers, menu arrows, calendars, tags. Fluid
 * Search's icon once sat on its clear button like a badge.
 */
// A list box's field is the whole box, where its icon belongs.
const CONTROLS = [
  "button:not(.bx--list-box__field)",
  "[role=button]:not(.bx--list-box__field)",
  ".bx--list-box__menu-icon",
  ".bx--list-box__selection",
  ".bx--select__arrow",
  ".bx--date-picker__icon",
  ".bx--number__controls",
  ".bx--search-close",
  ".bx--search-magnifier-icon",
  ".bx--tag",
].join(",");

test("status icons stay clear of their fields' controls", async ({ page }) => {
  test.slow();
  await page.goto("/status-icons.html");

  const collisions = await page.evaluate((controls) => {
    const overlap = (a: DOMRect, b: DOMRect) =>
      Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const found: string[] = [];
    for (const cell of document.querySelectorAll<HTMLElement>("[data-cell]")) {
      const icons = [...cell.querySelectorAll("svg")].filter((svg) =>
        /invalid-icon|warning-icon|__invalid/.test(
          String(svg.className.baseVal),
        ),
      );
      for (const icon of icons) {
        const box = icon.getBoundingClientRect();
        if (!box.width) continue;
        for (const control of cell.querySelectorAll(controls)) {
          if (control.contains(icon) || icon.contains(control)) continue;
          const area = overlap(box, control.getBoundingClientRect());
          if (area > 4) {
            found.push(
              `${cell.dataset.cell}: over ${String(control.className).split(" ")[0] || control.tagName}`,
            );
          }
        }
      }
    }
    return found;
  }, CONTROLS);

  expect(collisions).toEqual([]);
});
