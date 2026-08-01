import { shouldFlipHorizontally } from "../../src/utils/shouldFlipHorizontally.js";

const viewportWidth = 1000;

describe("shouldFlipHorizontally", () => {
  test("keeps the default alignment when the menu fits", () => {
    expect(
      shouldFlipHorizontally({
        anchorLeft: 100,
        anchorWidth: 40,
        floatingWidth: 200,
        viewportWidth,
      }),
    ).toBe(false);
  });

  test("flips when the menu overflows right and fits on the other side", () => {
    expect(
      shouldFlipHorizontally({
        anchorLeft: 940,
        anchorWidth: 40,
        floatingWidth: 200,
        viewportWidth,
      }),
    ).toBe(true);
  });

  test("does not flip when the menu ends exactly on the right edge", () => {
    // anchorLeft (800) + floatingWidth (200) === viewportWidth (1000).
    expect(
      shouldFlipHorizontally({
        anchorLeft: 800,
        anchorWidth: 40,
        floatingWidth: 200,
        viewportWidth,
      }),
    ).toBe(false);
  });

  test("does not flip when the menu is wider than the viewport", () => {
    expect(
      shouldFlipHorizontally({
        anchorLeft: 900,
        anchorWidth: 40,
        floatingWidth: 1200,
        viewportWidth,
      }),
    ).toBe(false);
  });

  test("does not flip when the flipped placement would clip the left edge", () => {
    // Overflows right (940 + 200 > 1000) but flipping lands at -160.
    expect(
      shouldFlipHorizontally({
        anchorLeft: 40,
        anchorWidth: 40,
        floatingWidth: 1200,
        viewportWidth,
      }),
    ).toBe(false);
  });

  test("does not flip an anchor at the left edge", () => {
    expect(
      shouldFlipHorizontally({
        anchorLeft: 0,
        anchorWidth: 40,
        floatingWidth: 200,
        viewportWidth,
      }),
    ).toBe(false);
  });

  test("falls back to the default alignment for zero-size inputs", () => {
    expect(
      shouldFlipHorizontally({
        anchorLeft: 0,
        anchorWidth: 0,
        floatingWidth: 0,
        viewportWidth: 0,
      }),
    ).toBe(false);

    // A measured-but-unlaid-out menu (width 0) never overflows.
    expect(
      shouldFlipHorizontally({
        anchorLeft: 990,
        anchorWidth: 0,
        floatingWidth: 0,
        viewportWidth,
      }),
    ).toBe(false);
  });
});
