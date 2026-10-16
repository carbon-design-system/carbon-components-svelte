import { expect, test } from "@playwright/test";

// An inline list box's status icon sits between the value and the chevron.
// The field made room for the invalid icon but not the warning one, which
// drew over the value. A clearable Dropdown's clear button sits there too,
// and the inline field's own padding and icon offset outranked the room
// reserved for it.
test("inline list box status icons clear the value", async ({ page }) => {
  await page.goto("/list-box-inline-status.html");
  await expect(page.locator(".bx--list-box__invalid-icon")).toHaveCount(6);

  const gaps = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        ".bx--list-box--inline, .bx--multi-select--inline",
      ),
    ].map((box) => {
      const value = box.querySelector(".bx--list-box__label");
      if (!value) return { id: box.className, gaps: [Number.NaN] };
      const range = document.createRange();
      range.selectNodeContents(value);
      // Left to right: value, MultiSelect's count tag, status icon,
      // Dropdown's clear button.
      const edges = [
        range.getBoundingClientRect(),
        box.querySelector(".bx--tag"),
        box.querySelector(".bx--list-box__invalid-icon"),
        box.querySelector(".bx--list-box__selection"),
      ]
        .map((part) =>
          part instanceof Element ? part.getBoundingClientRect() : part,
        )
        .filter((rect): rect is DOMRect => rect != null);
      return {
        id: box.className,
        gaps: edges
          .slice(1)
          .map((rect, i) => Math.round(rect.left - edges[i].right)),
      };
    }),
  );

  expect(gaps).toHaveLength(7);
  for (const { id, gaps: boxGaps } of gaps) {
    for (const gap of boxGaps) {
      expect.soft(gap, id).toBeGreaterThanOrEqual(0);
    }
  }
});
