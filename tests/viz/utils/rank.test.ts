import { getRanks } from "../../../src/viz/utils/rank.js";

function item(id: string, value: number) {
  return { id, label: id.toUpperCase(), value };
}

describe("getRanks", () => {
  const browsers = [
    item("edge", 5),
    item("chrome", 64),
    item("firefox", 4),
    item("safari", 19),
    item("opera", 8),
  ];

  test("sorts descending, numbers from 1, and sizes bars against the largest", () => {
    const result = getRanks(browsers);

    expect(result.rows.map((row) => row.item.id)).toEqual([
      "chrome",
      "safari",
      "opera",
      "edge",
      "firefox",
    ]);
    expect(result.rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(result.rows[0].pct).toBe(100);
    expect(result.rows[1].pct).toBeCloseTo(29.6875);
    expect(result.rows[0].share).toBe(0.64);
    expect(result.total).toBe(100);
  });

  test("keeps the top rows and drops the rest without other", () => {
    const result = getRanks(browsers, { top: 2 });

    expect(result.rows.map((row) => row.item.id)).toEqual(["chrome", "safari"]);
    expect(result.total).toBe(100);
  });

  test("folds the remainder into an unranked trailing row", () => {
    const result = getRanks(browsers, {
      top: 3,
      other: true,
      otherLabel: "Rest",
    });
    const last = result.rows[3];

    expect(result.rows).toHaveLength(4);
    expect(last.item).toEqual({ id: "other", label: "Rest", value: 9 });
    expect(last.rank).toBeNull();
    expect(last.share).toBe(0.09);
    expect(last.items?.map((i) => i.id)).toEqual(["edge", "firefox"]);
  });

  test("scales against the folded row when it is the largest", () => {
    const result = getRanks(
      [item("a", 10), item("b", 9), item("c", 8), item("d", 7)],
      { top: 1, other: true },
    );

    expect(result.max).toBe(24);
    expect(result.rows[1].pct).toBe(100);
    expect(result.rows[0].pct).toBeCloseTo(41.667, 2);
  });

  test("keeps input order with sort off and does not mutate", () => {
    const frozen = Object.freeze([...browsers]);
    const result = getRanks(frozen, { sort: false });

    expect(result.rows.map((row) => row.item.id)).toEqual(
      browsers.map((b) => b.id),
    );
    expect(() => getRanks(frozen)).not.toThrow();
  });

  test("counts bad values as zero and survives an empty total", () => {
    const result = getRanks([item("a", -1), item("b", Number.NaN)]);

    expect(result.rows.map((row) => row.pct)).toEqual([0, 0]);
    expect(result.rows.map((row) => row.share)).toEqual([0, 0]);
  });
});
