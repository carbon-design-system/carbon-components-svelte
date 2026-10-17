import { expect, test } from "./helpers/host";

// A warning icon is yellow in every theme, so the "!" cut into it is black in
// every theme. It is drawn by a path that starts out transparent (`opacity:
// 0` or `fill: none`) and shows whatever fill a rule gives it. A theme token
// there turns it white on the light themes or the dark ones, about 1.5:1 on
// the yellow, and no rule at all leaves the notification behind it showing
// through. These read the color a user sees, so a theme where the leftover
// color still reads on the yellow is not flagged.

const THEMES = ["white", "g10", "g80", "g90", "g100"] as const;

const ICONS = [
  "text-area",
  "slider",
  "fluid-time-picker",
  ...["warning", "warning-alt"].flatMap((kind) =>
    ["inline", "toast"].flatMap((type) => [
      `${type}-${kind}`,
      `${type}-${kind}-low-contrast`,
    ]),
  ),
];

type Rgba = [number, number, number, number];

function parse(color: string): Rgba {
  const nums = color.match(/[\d.]+/g)?.map(Number) ?? [];
  return [nums[0], nums[1], nums[2], nums[3] ?? 1];
}

function luminance([r, g, b]: Rgba) {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(parse(a)), luminance(parse(b))].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

test("the '!' in every warning icon reads on the yellow", async ({ page }) => {
  await page.goto("/warning-icon-glyph.html");

  for (const theme of THEMES) {
    // biome-ignore lint/performance/noAwaitInLoops: one theme at a time
    const glyphs = await page.evaluate(
      ([theme, ids]) => {
        document.documentElement.setAttribute("theme", theme);
        return ids.map((id) => {
          const svg = document
            .querySelector(`[data-testid=${id}]`)
            ?.querySelector("svg path[data-icon-path=inner-path]")
            ?.closest("svg");
          const glyph = svg?.querySelector("path[data-icon-path=inner-path]");
          const shape = svg?.querySelector("path:not([data-icon-path])");
          if (!svg || !glyph || !shape) return { id, missing: true as const };
          const g = getComputedStyle(glyph);
          // A glyph that is still transparent shows what is behind the icon.
          let backdrop = "rgb(255, 255, 255)";
          for (let el = svg.parentElement; el; el = el.parentElement) {
            const bg = getComputedStyle(el).backgroundColor;
            if (!bg.endsWith(", 0)") && bg !== "transparent") {
              backdrop = bg;
              break;
            }
          }
          const transparent = g.fill === "none" || g.opacity === "0";
          return {
            id,
            missing: false as const,
            color: transparent ? backdrop : g.fill,
            shape: getComputedStyle(shape).fill,
          };
        });
      },
      [theme, ICONS] as const,
    );

    for (const glyph of glyphs) {
      expect
        .soft(glyph.missing, `${theme} ${glyph.id} has an icon`)
        .toBe(false);
      if (glyph.missing) continue;
      expect
        .soft(
          contrast(glyph.color, glyph.shape),
          `${theme} ${glyph.id} "!" ${glyph.color} on ${glyph.shape}`,
        )
        .toBeGreaterThanOrEqual(4.5);
    }
  }
});
