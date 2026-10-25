import {
  labelWidth,
  placeLabels,
} from "../../../src/viz/Chart/label-layout.js";

describe("placeLabels", () => {
  it("keeps the higher priority of two colliding labels, nudges when it can, and stays in bounds", () => {
    const placed = placeLabels(
      [
        { key: "a", x: 0, y: 0, width: 40, height: 16, priority: 1 },
        {
          key: "b",
          x: 10,
          y: 4,
          width: 40,
          height: 16,
          alternatives: [{ x: 10, y: 24 }],
        },
        { key: "c", x: 12, y: 2, width: 40, height: 16 },
        { key: "d", x: 70, y: 90, width: 40, height: 16 },
      ],
      { bounds: { x0: 0, x1: 200, y0: 0, y1: 100 } },
    );
    expect(placed.map((p) => `${p.key}${p.moved ? "*" : ""}`)).toEqual(
      ["a", "b*", "c"].slice(0, 2),
    );
    // `d` would hang below the plot; `c` had nowhere else to go.
    expect(placed.find((p) => p.key === "d")).toBeUndefined();
    expect(placed.find((p) => p.key === "b")?.y).toBe(24);
  });

  it("estimates a label's width from its glyphs", () => {
    expect(labelWidth("")).toBe(4);
    expect(labelWidth("$1,234")).toBeGreaterThan(labelWidth("$12"));
  });
});
