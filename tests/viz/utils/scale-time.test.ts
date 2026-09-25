import { scaleTime } from "../../../src/viz/utils/scale-time.js";

describe("scaleTime", () => {
  test("map accepts a Date or epoch milliseconds", () => {
    const d0 = Date.UTC(2024, 0, 1);
    const d1 = Date.UTC(2024, 0, 11);
    const scale = scaleTime({ domain: [d0, d1], range: [0, 100] });
    expect(scale.map(new Date(d0))).toBe(0);
    expect(scale.map(new Date(d1))).toBe(100);
    expect(scale.map(d0)).toBe(0);
    expect(scale.map(d1)).toBe(100);
  });

  test("invert returns epoch milliseconds", () => {
    const d0 = Date.UTC(2024, 0, 1);
    const d1 = Date.UTC(2024, 0, 11);
    const scale = scaleTime({ domain: [d0, d1], range: [0, 100] });
    expect(scale.invert(50)).toBe(Date.UTC(2024, 0, 6));
  });

  test("supports a reversed domain", () => {
    const d0 = Date.UTC(2024, 0, 1);
    const d1 = Date.UTC(2024, 0, 11);
    const scale = scaleTime({ domain: [d1, d0], range: [0, 100] });
    expect(scale.map(d0)).toBe(100);
    expect(scale.map(d1)).toBe(0);
  });

  test("nice snaps the domain to calendar boundaries", () => {
    const scale = scaleTime({
      domain: [Date.UTC(2024, 0, 13), Date.UTC(2024, 10, 20)],
      range: [0, 100],
      nice: true,
      utc: true,
    });
    expect(scale.domain).toEqual([Date.UTC(2024, 0, 1), Date.UTC(2025, 0, 1)]);
  });

  test("a zero-width domain does not produce NaN", () => {
    const t = Date.UTC(2024, 0, 1);
    const scale = scaleTime({ domain: [t, t], range: [0, 100] });
    expect(Number.isNaN(scale.map(t))).toBe(false);
    expect(scale.map(t)).toBe(50);
  });
});
