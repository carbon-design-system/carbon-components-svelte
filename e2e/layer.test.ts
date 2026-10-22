import { expect, test } from "./helpers/host";

// Gray 100 gives each level its own color, so a component that ignores
// Layer shows up as a repeated value.
const G100 = {
  "layer-background": ["rgb(22, 22, 22)", "rgb(38, 38, 38)", "rgb(57, 57, 57)"],
  layer: ["rgb(38, 38, 38)", "rgb(57, 57, 57)", "rgb(82, 82, 82)"],
  field: ["rgb(38, 38, 38)", "rgb(57, 57, 57)", "rgb(82, 82, 82)"],
};

const CASES: [name: string, selector: string, token: keyof typeof G100][] = [
  ["TextInput", ".bx--text-input", "field"],
  ["Tile", ".bx--tile", "layer"],
  ["Box fill field", ".bx--box-fill-field", "field"],
  [
    "ContainedList header",
    ".bx--contained-list--on-page .bx--contained-list__header",
    "layer-background",
  ],
];

test("components take the surface of their Layer level", async ({ page }) => {
  await page.goto("/layer.html");
  await page.evaluate(() =>
    document.documentElement.setAttribute("theme", "g100"),
  );

  for (const [name, selector, token] of CASES) {
    for (const level of [1, 2, 3]) {
      const el = page.getByTestId(`level-${level}`).locator(selector).first();
      // biome-ignore lint/performance/noAwaitInLoops: one page, read in order
      await expect
        .soft(el, `${name} at level ${level}`)
        .toHaveCSS("background-color", G100[token][level - 1]);
    }
  }
});

// v11 draws zebra stripes with layer-accent, which steps up with the
// Layer as the rows do. A fixed stripe matched the rows at one level.
const ZEBRA = {
  white: {
    row: ["rgb(244, 244, 244)", "rgb(255, 255, 255)", "rgb(244, 244, 244)"],
    stripe: ["rgb(224, 224, 224)", "rgb(224, 224, 224)", "rgb(224, 224, 224)"],
  },
  g100: {
    row: ["rgb(38, 38, 38)", "rgb(57, 57, 57)", "rgb(82, 82, 82)"],
    stripe: ["rgb(57, 57, 57)", "rgb(82, 82, 82)", "rgb(111, 111, 111)"],
  },
};

test("zebra stripes stand out from the rows at every Layer level", async ({
  page,
}) => {
  await page.goto("/layer.html");
  // Keep the pointer off the rows so no hover color applies.
  await page.mouse.move(0, 0);

  for (const [theme, { row, stripe }] of Object.entries(ZEBRA)) {
    // biome-ignore lint/performance/noAwaitInLoops: one page, read in order
    await page.evaluate(
      (t) => document.documentElement.setAttribute("theme", t),
      theme,
    );
    await Promise.all(
      [1, 2, 3].flatMap((level) => {
        const cells = page
          .getByTestId(`level-${level}`)
          .locator(".bx--data-table--zebra tbody td");
        return [
          expect
            .soft(cells.nth(0), `${theme} row at level ${level}`)
            .toHaveCSS("background-color", row[level - 1]),
          expect
            .soft(cells.nth(1), `${theme} stripe at level ${level}`)
            .toHaveCSS("background-color", stripe[level - 1]),
        ];
      }),
    );
  }
});
