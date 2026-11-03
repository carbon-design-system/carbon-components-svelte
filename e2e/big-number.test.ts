import { expect, test } from "./helpers/host";
import { expectNoPageOverflow, expectTextFits } from "./helpers/layout";

test("BigNumber steps its type with size", async ({ page }) => {
  await page.goto("/big-number.html");
  await page.evaluate(() => document.fonts.ready);

  // Carbon v11: label-01 / heading-04 / body-compact-01 at the default
  // size, heading-06 and heading-03 at lg, and body-compact-01,
  // heading-07 and heading-04 at xl.
  const sizes = await page.evaluate(() =>
    ["default", "lg", "xl"].map((size) => {
      const fontSize = (testId: string, selector: string) => {
        const el = document.querySelector(
          `[data-testid="${testId}-${size}"] ${selector}`,
        );
        return el ? getComputedStyle(el).fontSize : "";
      };
      return [
        size,
        fontSize("total", ".bx--big-number__label"),
        fontSize("total", ".bx--big-number__value"),
        fontSize("total", ".bx--big-number__denominator"),
        fontSize("percentage", ".bx--big-number__percentage-mark"),
      ];
    }),
  );
  expect(sizes).toEqual([
    ["default", "12px", "28px", "14px", "14px"],
    ["lg", "12px", "42px", "20px", "20px"],
    ["xl", "14px", "54px", "28px", "28px"],
  ]);
});

for (const dir of ["ltr", "rtl"]) {
  for (const size of ["default", "lg", "xl"]) {
    test(`BigNumber action sits on the value's baseline (${size}, ${dir})`, async ({
      page,
    }) => {
      await page.goto("/big-number.html");
      await page.evaluate(() => document.fonts.ready);

      const measure = (testId: string, selector: string) =>
        page.getByTestId(testId).evaluate((el, selector) => {
          // A zero-height inline-block's bottom edge is the baseline of
          // the line it joins. In a flex container (Link) the text is its
          // own flex item, so the probe joins the text inside a wrapper.
          const baseline = (node: Element) => {
            const probe = document.createElement("span");
            probe.style.cssText = "display:inline-block;width:0;height:0";
            const text = [...node.childNodes].find((child) =>
              child.textContent?.trim(),
            );
            const line = document.createElement("span");
            const flex = getComputedStyle(node).display.includes("flex");
            if (flex && text) {
              text.replaceWith(line);
              line.append(text, probe);
            } else node.append(probe);
            const { bottom } = probe.getBoundingClientRect();
            probe.remove();
            if (flex && text) line.replaceWith(text);
            return bottom;
          };
          const value = el.querySelector(".bx--big-number__value");
          const action = el.querySelector(selector);
          if (!value || !action) throw new Error("missing node");
          const box = action.getBoundingClientRect();
          const valueBox = value.getBoundingClientRect();
          return {
            value: baseline(value),
            action:
              action instanceof SVGElement ? box.bottom : baseline(action),
            after:
              getComputedStyle(el).direction === "rtl"
                ? box.right <= valueBox.left
                : box.left >= valueBox.right,
          };
        }, selector);

      // Link text shares the value's baseline.
      const link = await measure(`link-action-${size}-${dir}`, ".bx--link");
      expect(link.action).toBeCloseTo(link.value, 0);
      expect(link.after).toBe(true);

      // An icon-only action stands on it, like a glyph, rather than
      // riding near the top of the value's line.
      const icon = await measure(
        `icon-action-${size}-${dir}`,
        ".bx--big-number__action svg",
      );
      expect(icon.action).toBeCloseTo(icon.value, 0);
      expect(icon.after).toBe(true);
    });
  }
}

// The row's gap grows with the value: 4px, 6px, 8px between the value,
// trend icon and total, twice that before a link, and the row's gap
// before an icon-only button, whose padding sets its icon apart.
const GAPS = { default: 4, lg: 6, xl: 8 };

for (const dir of ["ltr", "rtl"]) {
  for (const size of ["default", "lg", "xl"] as const) {
    test(`BigNumber spaces its row by size (${size}, ${dir})`, async ({
      page,
    }) => {
      await page.goto("/big-number.html");
      await page.evaluate(() => document.fonts.ready);

      // The inline gap between each laid-out item in the row, then
      // between the last item before the action and the action's
      // control, measured toward the inline end.
      const gaps = (testId: string) =>
        page.getByTestId(testId).evaluate((el) => {
          const rtl = getComputedStyle(el).direction === "rtl";
          const row = el.querySelector(".bx--big-number__value-row");
          const control = el.querySelector(".bx--big-number__action > *");
          if (!row || !control) throw new Error("missing node");
          const boxes = [...row.children]
            .filter((child) => getComputedStyle(child).position !== "absolute")
            .map((child) => child.getBoundingClientRect());
          boxes.splice(-1, 1, control.getBoundingClientRect());
          return boxes
            .slice(1)
            .map((box, i) =>
              Math.round(
                rtl ? boxes[i].left - box.right : box.left - boxes[i].right,
              ),
            );
        });

      const gap = GAPS[size];
      // Value, trend icon, total, then the link.
      expect(await gaps(`link-action-${size}-${dir}`)).toEqual([
        gap,
        gap,
        gap * 2,
      ]);
      // Value, then the icon-only button.
      expect(await gaps(`icon-action-${size}-${dir}`)).toEqual([gap]);
    });
  }
}

// The trend icon's hidden description sits at the row's inline start. A
// -1px inline margin on `.bx--visually-hidden` put it 1px past the right
// edge under `dir="rtl"`, so the page scrolled sideways.
test("BigNumber's hidden trend text stays inside the page in RTL, and its text fits", async ({
  page,
}) => {
  await page.goto("/big-number.html");
  await page.evaluate(() => document.fonts.ready);

  const hidden = await page
    .locator('[dir="rtl"] .bx--big-number__value-row > .bx--visually-hidden')
    .count();
  expect(hidden).toBeGreaterThan(0);
  await expectNoPageOverflow(page);
  // Each value, label and total shows in full in both directions.
  expect(await expectTextFits(page.locator("#app"))).toBeGreaterThan(0);
});
