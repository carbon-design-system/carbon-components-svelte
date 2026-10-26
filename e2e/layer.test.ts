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

// v11 renders the modal as a Layer and its body as the next one up. The
// container stays on layer-01, content inside sits on level 2, and a
// Layer inside the body steps up to level 3.
const MODAL = {
  white: {
    container: "rgb(244, 244, 244)",
    field: "rgb(255, 255, 255)",
    layer: "rgb(255, 255, 255)",
    nested: "rgb(244, 244, 244)",
  },
  g100: {
    container: "rgb(38, 38, 38)",
    field: "rgb(57, 57, 57)",
    layer: "rgb(57, 57, 57)",
    nested: "rgb(82, 82, 82)",
  },
};

const MODAL_CASES: [
  name: string,
  selector: string,
  token: keyof (typeof MODAL)["white"],
][] = [
  ["container", ".bx--modal-container", "container"],
  ["TextInput", ".bx--modal-content > .bx--form-item .bx--text-input", "field"],
  ["Tile", ".bx--tile", "layer"],
  ["DataTable cell", ".bx--data-table td", "layer"],
  ["nested Layer TextInput", "[data-testid$=nested] .bx--text-input", "nested"],
];

// v10 kept these on field-02 with `.bx--modal .bx--text-input` rules.
// The body Layer gives them the same color.
const MODAL_FIELDS = [
  ".bx--number input",
  ".bx--dropdown",
  ".bx--multi-select",
  ".bx--form-item .bx--select-input",
  ".bx--search-input",
  ".bx--text-area",
  ".bx--pagination",
];

test("modal content sits one Layer level up", async ({ page }) => {
  await page.goto("/modal-layer.html");

  for (const [theme, colors] of Object.entries(MODAL)) {
    await page.evaluate(
      (t) => document.documentElement.setAttribute("theme", t),
      theme,
    );
    const cases = ["modal", "composed-modal"].flatMap((modal) =>
      MODAL_CASES.map(([name, selector, token]) =>
        expect
          .soft(
            page.getByTestId(modal).locator(selector).first(),
            `${theme} ${modal} ${name}`,
          )
          .toHaveCSS("background-color", colors[token]),
      ),
    );
    const fields = MODAL_FIELDS.map((selector) =>
      expect
        .soft(
          page.getByTestId("modal").locator(selector).first(),
          `${theme} ${selector}`,
        )
        .toHaveCSS("background-color", colors.field),
    );
    await Promise.all([...cases, ...fields]);
  }
});
