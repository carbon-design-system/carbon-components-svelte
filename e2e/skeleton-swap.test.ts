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
  "date-picker-range",
  "pin-code-input",
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
