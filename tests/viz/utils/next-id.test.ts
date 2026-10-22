import { nextId } from "../../../src/viz/utils/next-id.js";

describe("nextId", () => {
  test("never repeats, and keeps the prefix", () => {
    const ids = Array.from({ length: 50 }, () => nextId("bx-viz-clip"));

    expect(new Set(ids).size).toBe(50);
    expect(ids.every((id) => /^bx-viz-clip-\d+$/.test(id))).toBe(true);
  });

  test("counts across prefixes, so two kinds of id cannot collide either", () => {
    const a = nextId("a").split("-")[1];
    const b = nextId("b").split("-")[1];

    expect(Number(b)).toBe(Number(a) + 1);
  });
});
