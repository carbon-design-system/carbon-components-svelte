import { beeswarm } from "../../../src/viz/utils/beeswarm.js";

describe("beeswarm", () => {
  test("leaves dots that are far apart on the axis", () => {
    expect(beeswarm([0, 20, 40], 4)).toEqual([0, 0, 0]);
  });

  test("pushes dots that would overlap to either side, nearest the axis first", () => {
    const offsets = beeswarm([10, 10, 10, 10], 4);
    expect(offsets[0]).toBe(0);
    expect(Math.abs(offsets[1])).toBe(8);
    expect(Math.abs(offsets[2])).toBe(8);
    expect(offsets[1]).toBe(-offsets[2]);
    expect(Math.abs(offsets[3])).toBe(16);
  });

  test("never lets two dots overlap", () => {
    const positions = Array.from({ length: 60 }, (_, i) => (i * 7919) % 50);
    const offsets = beeswarm(positions, 3);
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i] - positions[j];
        const dy = offsets[i] - offsets[j];
        expect(Math.sqrt(dx * dx + dy * dy)).toBeGreaterThanOrEqual(6 - 1e-6);
      }
    }
  });

  test("keeps the input order and skips what is not a number", () => {
    const offsets = beeswarm([30, Number.NaN, 30], 5);
    expect(offsets[0]).toBe(0);
    expect(offsets[1]).toBeNaN();
    expect(Math.abs(offsets[2])).toBe(10);
  });
});
