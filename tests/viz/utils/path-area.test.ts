import { pathArea } from "../../../src/viz/utils/path-area.js";

describe("pathArea", () => {
  test("flat numeric baseline closes down to the baseline", () => {
    expect(
      pathArea(
        [
          { x: 0, y: 10 },
          { x: 50, y: 0 },
          { x: 100, y: 10 },
        ],
        20,
      ),
    ).toBe("M0,10L50,0L100,10L100,20L0,20Z");
  });

  test("a gap closes each run separately", () => {
    expect(
      pathArea(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          null,
          { x: 20, y: 0 },
          { x: 30, y: 10 },
        ],
        20,
      ),
    ).toBe("M0,0L10,10L10,20L0,20ZM20,0L30,10L30,20L20,20Z");
  });

  test("a single-point run contributes nothing", () => {
    expect(pathArea([{ x: 0, y: 0 }], 20)).toBe("");
  });

  test("an array baseline traces the lower edge backward", () => {
    expect(
      pathArea(
        [
          { x: 0, y: 10 },
          { x: 10, y: 0 },
          { x: 20, y: 5 },
        ],
        [15, 12, 14],
      ),
    ).toBe("M0,10L10,0L20,5L20,14L10,12L0,15Z");
  });

  test("step-after with an array baseline traces a correct closed shape", () => {
    expect(
      pathArea(
        [
          { x: 0, y: 10 },
          { x: 10, y: 0 },
          { x: 20, y: 4 },
        ],
        [15, 12, 14],
        { curve: "step-after" },
      ),
    ).toBe("M0,10H10V0H20V4L20,14V12H10V15H0Z");
  });

  test("a missing baseline entry falls back to the point's own y", () => {
    expect(
      pathArea(
        [
          { x: 0, y: 10 },
          { x: 10, y: 0 },
        ],
        [15],
      ),
    ).toBe("M0,10L10,0L10,0L0,15Z");
  });
});
