import { getVisibleTagCount } from "../../src/utils/tag-overflow.js";

describe("getVisibleTagCount", () => {
  it("returns 0 for an empty tagWidths list", () => {
    expect(
      getVisibleTagCount({
        tagWidths: [],
        availableWidth: 500,
        overflowWidth: 40,
      }),
    ).toBe(0);
  });

  it("returns 0 when availableWidth is 0", () => {
    expect(
      getVisibleTagCount({
        tagWidths: [50, 50, 50],
        availableWidth: 0,
        overflowWidth: 40,
      }),
    ).toBe(0);
  });

  it("fits every tag when they consume exactly the available width", () => {
    expect(
      getVisibleTagCount({
        tagWidths: [50, 50, 50],
        availableWidth: 150,
        overflowWidth: 40,
      }),
    ).toBe(3);
  });

  it("backtracks by one tag when the overflow trigger doesn't fit", () => {
    // Two tags (50 + 50 = 100) fit in 110, leaving 10px — not enough for the
    // 40px trigger, so one tag is given back to make room for it.
    expect(
      getVisibleTagCount({
        tagWidths: [50, 50, 50],
        availableWidth: 110,
        overflowWidth: 40,
      }),
    ).toBe(1);
  });

  it("backtracks by more than one tag when needed", () => {
    // Three of the four 30px tags fit in 95, leaving 5px — not enough for the
    // 40px trigger. Giving back one tag (35px) still isn't enough; giving
    // back a second (65px) is.
    expect(
      getVisibleTagCount({
        tagWidths: [30, 30, 30, 30],
        availableWidth: 95,
        overflowWidth: 40,
      }),
    ).toBe(1);
  });

  it("caps the count at maxVisible even when more would fit", () => {
    expect(
      getVisibleTagCount({
        tagWidths: [50, 50, 50],
        availableWidth: 500,
        overflowWidth: 40,
        maxVisible: 2,
      }),
    ).toBe(2);
  });

  it("does not backtrack when every tag already fits (no trigger needed)", () => {
    expect(
      getVisibleTagCount({
        tagWidths: [50, 50],
        availableWidth: 500,
        overflowWidth: 40,
      }),
    ).toBe(2);
  });
});
