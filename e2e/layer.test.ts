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
