import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

// COMPONENT_GUIDELINES.md, Spacing: the gap between groups is at least
// twice the gap between items in a group, measured between the text.

type Gaps = { item: number; group: number; header: number; first: number };

/** Ink gaps in an open grouped menu, in px. */
function gaps(root: Locator) {
  return root.evaluate((node): Gaps => {
    const menu = node.querySelector(".bx--list-box__menu");
    if (!menu) throw new Error("no menu");
    const rows = [
      ...menu.querySelectorAll(
        ".bx--list-box__menu-group-header, .bx--list-box__menu-item__option",
      ),
    ].map((row) => {
      const label = row.querySelector(".bx--checkbox-label-text") ?? row;
      const range = document.createRange();
      range.selectNodeContents(label);
      const rects = [...range.getClientRects()].filter((r) => r.height > 0);
      return {
        header: row.classList.contains("bx--list-box__menu-group-header"),
        top: Math.min(...rects.map((r) => r.top)),
        bottom: Math.max(...rects.map((r) => r.bottom)),
      };
    });
    const item: number[] = [];
    const group: number[] = [];
    const header: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      const gap = Math.round(rows[i].top - rows[i - 1].bottom);
      if (rows[i].header) group.push(gap);
      else if (rows[i - 1].header) header.push(gap);
      else item.push(gap);
    }
    return {
      item: Math.max(...item),
      group: Math.min(...group),
      header: Math.max(...header),
      first: Math.round(rows[0].top - menu.getBoundingClientRect().top),
    };
  });
}

test("spaces list box groups twice as far apart as their options", async ({
  page,
}) => {
  let checked = 0;
  for (const size of ["xs", "sm", "md", "xl"]) {
    // biome-ignore lint/performance/noAwaitInLoops: one size mounted at a time
    await page.goto(`/list-box-groups.html?size=${size}`);
    await page.evaluate(() => document.fonts.ready);
    const ids = ["dropdown", "combobox", "multiselect"];
    const all = await Promise.all(ids.map((id) => gaps(page.getByTestId(id))));
    for (const [index, id] of ids.entries()) {
      const name = `${id} ${size}`;
      const measured = all[index];
      expect.soft(measured.item, `${name} item gap`).toBeGreaterThan(0);
      expect
        .soft(measured.group, `${name} group gap`)
        .toBeGreaterThanOrEqual(2 * measured.item);
      // A header reads with the options below it.
      expect
        .soft(measured.header, `${name} header gap`)
        .toBeLessThan(measured.group);
      // A header in the menu's first row has nothing above it to clear.
      // MultiSelect's menu starts with an ungrouped option.
      if (id !== "multiselect") {
        expect.soft(measured.first, `${name} first header`).toBe(16);
      }
      checked++;
    }
  }
  expect(checked).toBe(12);
});
