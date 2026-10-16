import { expect, test } from "./helpers/host";

/**
 * A skeleton stands in for a component while it loads, then swaps out for
 * it. If the two differ in height, everything below the swap moves.
 *
 * Each case renders a component and its skeleton at the same size; their
 * boxes must be the same height.
 */
const sizes = ["xs", "sm", "md", "xl"];
const cases = [
  ...[
    "text-input",
    "password-input",
    "number-input",
    "select",
    "copy-input",
    "date-picker",
  ].flatMap((id) => sizes.map((size) => `${id}-${size}`)),
  ...["dropdown", "combo-box", "multi-select"].flatMap((id) =>
    sizes.map((size) => `${id}-${size}`),
  ),
  // Dropdown's `lg` is 40px, not the 48px of the other list boxes (#4455).
  "combo-box-lg",
  "multi-select-lg",
  "dropdown-inline",
  "multi-select-inline",
  "dropdown-hidden-label",
  ...["xs", "sm", "lg", "xl"].map((size) => `search-${size}`),
  ...["default", "sm"].flatMap((size) => [
    `toggle-${size}`,
    `toggle-${size}-hidden-label`,
    `toggle-${size}-no-label`,
  ]),
  ...["xs", "md"].flatMap((size) => [`slider-${size}`, `range-slider-${size}`]),
  "slider-hidden-input",
  ...[1, 2, 4, 8].flatMap((rows) => [
    `text-area-${rows}`,
    `fluid-text-area-${rows}`,
  ]),
  "date-picker-range",
  ...sizes.map((size) => `time-picker-${size}`),
  "date-picker-simple",
  "date-picker-short",
  "fluid-date-picker-320",
  "fluid-date-picker-200",
  "pin-code-input",
  "code-snippet-single",
  "code-snippet-multi",
  "radio-button",
];

// Every case only reads layout, so the fixture loads once for all of them.
test("skeletons are as tall as the components they stand in for", async ({
  page,
}) => {
  await page.goto("/skeleton-swap.html");

  for (const id of cases) {
    const pair = page.getByTestId(id);
    // biome-ignore lint/performance/noAwaitInLoops: reads one box at a time
    const real = await pair.locator("[data-part=real]").boundingBox();
    const skeleton = await pair.locator("[data-part=skeleton]").boundingBox();
    expect.soft(real && skeleton, `${id} rendered`).toBeTruthy();
    if (!real || !skeleton) continue;

    expect.soft(skeleton.height, id).toBeCloseTo(real.height, 0);
  }
});

/**
 * Fields whose width doesn't depend on their text: the skeleton's field
 * must be as wide as the component's.
 */
const fieldWidths: Record<string, string> = {
  ...Object.fromEntries(
    sizes.map((size) => [`date-picker-${size}`, ".bx--date-picker__input"]),
  ),
  "date-picker-range": ".bx--date-picker__input",
  "date-picker-simple": ".bx--date-picker__input",
  "date-picker-short": ".bx--date-picker__input",
  // The whole fluid field: 288px, or its container's width when narrower.
  "fluid-date-picker-320": "> *",
  "fluid-date-picker-200": "> *",
};

test("skeleton fields are as wide as the fields they stand in for", async ({
  page,
}) => {
  await page.goto("/skeleton-swap.html");

  for (const [id, field] of Object.entries(fieldWidths)) {
    const pair = page.getByTestId(id);
    const widths = (part: string) =>
      pair
        .locator(`[data-part=${part}] ${field}`)
        .evaluateAll((els) =>
          els.map((el) => el.getBoundingClientRect().width),
        );
    // biome-ignore lint/performance/noAwaitInLoops: reads one pair at a time
    const real = await widths("real");
    const skeleton = await widths("skeleton");
    expect.soft(real.length, `${id} rendered`).toBeGreaterThan(0);
    expect.soft(skeleton.map(Math.round), id).toEqual(real.map(Math.round));
  }
});

test("a fluid date picker fits a container narrower than 288px", async ({
  page,
}) => {
  await page.goto("/skeleton-swap.html");
  const box = await page.getByTestId("fluid-date-picker-200").boundingBox();
  const field = await page
    .locator("[data-testid=fluid-date-picker-200] [data-part=real] > *")
    .boundingBox();
  expect(box && field).toBeTruthy();
  if (box && field) expect(field.width).toBeLessThanOrEqual(box.width);
});

test("TimePickerSkeleton's input and first select are as wide as an AM/PM picker's", async ({
  page,
}) => {
  await page.goto("/skeleton-swap.html");

  for (const size of sizes) {
    const pair = page.getByTestId(`time-picker-${size}`);
    const boxes = (selector: string) =>
      pair
        .locator(selector)
        .evaluateAll((els) =>
          els.map((el) => Math.round(el.getBoundingClientRect().width)),
        );
    // The time zone select sizes to its options, so only the input and
    // the AM/PM select are compared.
    // biome-ignore lint/performance/noAwaitInLoops: reads one pair at a time
    const real = await boxes(
      "[data-part=real] :is(.bx--time-picker__input-field, .bx--time-picker__select)",
    );
    const skeleton = await boxes(
      "[data-part=skeleton] :is(.bx--time-picker__input .bx--text-input, .bx--time-picker__select .bx--select)",
    );
    expect.soft(skeleton[0], `${size} input`).toBe(real[0]);
    // The AM/PM select's width is its text's, which renders a pixel
    // apart across browsers and sizes.
    expect
      .soft(Math.abs(skeleton[1] - real[1]), `${size} AM/PM select`)
      .toBeLessThanOrEqual(2);
  }
});
