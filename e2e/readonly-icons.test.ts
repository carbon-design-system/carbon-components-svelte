import { expect, test } from "./helpers/host";

/**
 * A read-only field is still in use, so the icon that says what kind of
 * field it is (a chevron, a calendar) keeps the 3:1 contrast WCAG 1.4.11
 * asks of icons, in every theme. The disabled icon color is about 1.7:1 on
 * the light themes and 2:1 on the dark ones.
 */
const THEMES = ["white", "g10", "g90", "g100"];

const ICONS: Record<string, string> = {
  "readonly-select": ".bx--select__arrow",
  "readonly-time-picker": ".bx--time-picker__select .bx--select__arrow",
  "readonly-dropdown": ".bx--list-box__menu-icon svg",
  "readonly-combo-box": ".bx--list-box__menu-icon svg",
  "readonly-multi-select": ".bx--list-box__menu-icon svg",
  "readonly-date-picker": ".bx--date-picker__icon",
};

test("read-only field icons contrast with the field in every theme", async ({
  page,
}) => {
  await page.goto("/readonly-icons.html");

  for (const theme of THEMES) {
    // biome-ignore lint/performance/noAwaitInLoops: one theme at a time
    await page.evaluate(
      (t) => document.documentElement.setAttribute("theme", t),
      theme,
    );

    const ratios = await page.evaluate((icons) => {
      type Rgba = [number, number, number, number];
      const parse = (color: string): Rgba => {
        const m = color.match(/rgba?\(([^)]+)\)/);
        const [r, g, b, a = 1] = (m?.[1] ?? "0, 0, 0, 0")
          .split(",")
          .map(Number.parseFloat);
        return [r, g, b, a];
      };
      const over = (top: Rgba, bottom: Rgba): Rgba => {
        const a = top[3] + bottom[3] * (1 - top[3]);
        const mix = (i: number) =>
          a === 0
            ? 0
            : (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a;
        return [mix(0), mix(1), mix(2), a];
      };
      const luminance = ([r, g, b]: Rgba) => {
        const [lr, lg, lb] = [r, g, b].map((c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      };
      // The color a viewer sees behind the icon: every translucent
      // background up to the first opaque one, composited.
      const backdrop = (el: Element): Rgba => {
        let color: Rgba = [0, 0, 0, 0];
        for (
          let node: Element | null = el;
          node && color[3] < 1;
          node = node.parentElement
        ) {
          color = over(color, parse(getComputedStyle(node).backgroundColor));
        }
        return color;
      };

      return Object.entries(icons).map(([id, selector]) => {
        const icon = document.querySelector(`[data-testid=${id}] ${selector}`);
        if (!icon) return { id, ratio: null };
        const back = backdrop(icon);
        const front = over(parse(getComputedStyle(icon).fill), back);
        const [light, dark] = [luminance(front), luminance(back)].sort(
          (a, b) => b - a,
        );
        return {
          id,
          ratio: Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100,
        };
      });
    }, ICONS);

    expect.soft(ratios.length, theme).toBe(Object.keys(ICONS).length);
    for (const { id, ratio } of ratios) {
      expect.soft(ratio, `${theme} ${id} icon rendered`).not.toBeNull();
      expect
        .soft(ratio ?? 0, `${theme} ${id} icon contrast`)
        .toBeGreaterThanOrEqual(3);
    }
  }
});
