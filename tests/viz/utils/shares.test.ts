import { getShares } from "../../../src/viz/utils/shares.js";

function item(id: string, value: number) {
  return { id, label: id.toUpperCase(), value };
}

describe("getShares", () => {
  test("computes each share of the total in input order", () => {
    const result = getShares([item("a", 50), item("b", 30), item("c", 20)]);

    expect(result.total).toBe(100);
    expect(result.segments.map((s) => s.pct)).toEqual([50, 30, 20]);
    expect(result.segments.map((s) => s.share)).toEqual([0.5, 0.3, 0.2]);
    expect(result.segments.map((s) => s.item.id)).toEqual(["a", "b", "c"]);
  });

  test("counts negative and non-finite values as zero", () => {
    const result = getShares([
      item("a", 10),
      item("b", -5),
      item("c", Number.NaN),
      item("d", 30),
    ]);

    expect(result.total).toBe(40);
    expect(result.segments.map((s) => s.value)).toEqual([10, 0, 0, 30]);
    expect(result.segments.map((s) => s.pct)).toEqual([25, 0, 0, 75]);
  });

  test("returns zero shares when the total is zero", () => {
    const result = getShares([item("a", 0), item("b", 0)]);

    expect(result.total).toBe(0);
    expect(result.segments.map((s) => s.share)).toEqual([0, 0]);
  });

  test("folds items past the limit into one trailing segment", () => {
    const items = [item("a", 40), item("b", 30), item("c", 20), item("d", 10)];
    const result = getShares(items, { maxSegments: 3, otherLabel: "Rest" });

    expect(result.segments).toHaveLength(3);
    expect(result.segments[2].item).toEqual({
      id: "other",
      label: "Rest",
      value: 30,
    });
    expect(result.segments[2].items).toEqual([items[2], items[3]]);
    expect(result.segments[2].pct).toBe(30);
    expect(result.segments[0].items).toBeNull();
  });

  test("does not fold when the items fit the limit", () => {
    const result = getShares([item("a", 1), item("b", 1)], { maxSegments: 2 });

    expect(result.segments.map((s) => s.item.id)).toEqual(["a", "b"]);
  });

  test("does not mutate its input", () => {
    const items = Object.freeze([item("a", 1), item("b", 2), item("c", 3)]);

    expect(() => getShares(items, { maxSegments: 2 })).not.toThrow();
    expect(items).toHaveLength(3);
  });
});
